using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using myapp.Data;
using myapp.Models;
using myapp.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using myapp.Hubs;
using Pgvector.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace myapp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Protect all endpoints in this controller
    public class ChatMessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly VertexAIService _vertexAIService;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatMessagesController(ApplicationDbContext context, VertexAIService vertexAIService, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _vertexAIService = vertexAIService;
            _hubContext = hubContext;
        }

        // Helper method to get current user ID from JWT token
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }

        // GET: api/ChatMessages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChatMessage>>> GetChatMessages()
        {
            return await _context.ChatMessages.Include(cm => cm.ChatSession).ToListAsync();
        }

        // GET: api/ChatMessages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ChatMessage>> GetChatMessage(int id)
        {
            var chatMessage = await _context.ChatMessages
                .Include(cm => cm.ChatSession)
                .Include(cm => cm.MessageCitations)
                .FirstOrDefaultAsync(cm => cm.Id == id);

            if (chatMessage == null)
            {
                return NotFound();
            }

            return chatMessage;
        }

        // POST: api/ChatMessages
        [HttpPost]
        public async Task<ActionResult<object>> PostChatMessage(ChatMessage chatMessage)
        {
            var userId = GetCurrentUserId();
            
            var chatSession = await _context.ChatSessions
                .Include(cs => cs.Document)
                .Include(cs => cs.ChatSessionDocuments)
                    .ThenInclude(csd => csd.Document)
                .FirstOrDefaultAsync(cs => cs.Id == chatMessage.SessionId);

            if (chatSession == null)
            {
                return BadRequest(new { error = "ChatSessionNotFound", message = "Chat session not found." });
            }

            // Authorization: Only session owner can send messages
            if (chatSession.UserId != userId)
            {
                return Forbid();
            }

            // 1. Save user message
            chatMessage.Role = "user";
            chatMessage.CreatedAt = DateTime.UtcNow;
            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            string aiResponseContent;
            List<MessageCitation> citations = new List<MessageCitation>();

            try
            {
                string documentContext = "";
                
                // NEW: Support multiple documents via ChatSessionDocuments
                var documentIds = new List<int>();
                
                // Get document IDs from new many-to-many relationship
                if (chatSession.ChatSessionDocuments.Any())
                {
                    documentIds = chatSession.ChatSessionDocuments.Select(csd => csd.DocumentId).ToList();
                }
                // Fallback: Use legacy single document if no multi-documents attached
                else if (chatSession.Document != null)
                {
                    documentIds.Add(chatSession.Document.Id);
                }

                if (documentIds.Any())
                {
                    // Generate embedding for user query
                    var userQueryEmbedding = await _vertexAIService.GenerateEmbeddingAsync(chatMessage.Content);

                    // Get all chunks from ALL attached documents (SQLite doesn't support vector operations)
                    var allChunks = await _context.DocumentChunks
                        .Where(dc => documentIds.Contains(dc.DocumentId) && dc.EmbeddingVector != null)
                        .ToListAsync();

                    if (allChunks.Any())
                    {
                        // Calculate cosine similarity in memory
                        var chunksWithSimilarity = allChunks.Select(chunk => new
                        {
                            Chunk = chunk,
                            Similarity = CosineSimilarity(userQueryEmbedding, chunk.EmbeddingVector)
                        })
                        .OrderByDescending(x => x.Similarity)
                        .Take(10) // Get top 10 chunks (more since multiple documents)
                        .ToList();

                        // Group chunks by document for better context
                        var docNames = await _context.Documents
                            .Where(d => documentIds.Contains(d.Id))
                            .ToDictionaryAsync(d => d.Id, d => d.Title);

                        documentContext = "Relevant information from your documents:\n\n" + 
                            string.Join("\n\n", chunksWithSimilarity.Select(x => 
                                $"[From: {docNames.GetValueOrDefault(x.Chunk.DocumentId, "Unknown")}]\n{x.Chunk.Content}"));

                        // Create citations
                        foreach (var item in chunksWithSimilarity)
                        {
                            citations.Add(new MessageCitation
                            {
                                DocumentId = item.Chunk.DocumentId,
                                ChunkId = item.Chunk.Id,
                                PageNumber = item.Chunk.PageNumber,
                                QuoteText = item.Chunk.Content.Length > 200 ? item.Chunk.Content.Substring(0, 200) + "..." : item.Chunk.Content,
                                RelevanceScore = item.Similarity,
                            });
                        }
                    }
                    else
                    {
                        // Fallback: use full document text if no chunks found
                        var documents = await _context.Documents
                            .Where(d => documentIds.Contains(d.Id) && !string.IsNullOrEmpty(d.ExtractedText))
                            .ToListAsync();
                        
                        documentContext = string.Join("\n\n---\n\n", documents.Select(d => 
                            $"[Document: {d.Title}]\n{(d.ExtractedText.Length > 2000 ? d.ExtractedText.Substring(0, 2000) : d.ExtractedText)}"));
                    }
                }
                
                // Get AI response
                if (!string.IsNullOrEmpty(documentContext))
                {
                    aiResponseContent = await _vertexAIService.ChatWithDocument(chatMessage.Content, documentContext);
                }
                else
                {
                    aiResponseContent = await _vertexAIService.PredictTextAsync(chatMessage.Content);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR in RAG processing: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                aiResponseContent = "Sorry, I am having trouble processing your request right now.";
            }

            // 4. Save AI message
            var aiMessage = new ChatMessage
            {
                SessionId = chatMessage.SessionId,
                Role = "assistant",
                Content = aiResponseContent,
                CreatedAt = DateTime.UtcNow,
            };
            _context.ChatMessages.Add(aiMessage);
            await _context.SaveChangesAsync();

            // Link citations to the AI message and save them
            foreach(var citation in citations)
            {
                citation.MessageId = aiMessage.Id;
                _context.MessageCitations.Add(citation);
            }
            await _context.SaveChangesAsync();
            
            // 5. Broadcast the new AI message to all clients in the chat session group
            await _hubContext.Clients.Group($"session-{chatSession.Id}").SendAsync("ReceiveMessage", aiMessage);
            
            // Update last message time for the session
            chatSession.LastMessageAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { userMessage = chatMessage, aiResponse = aiMessage, citations = citations });
        }

        // PUT: api/ChatMessages/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutChatMessage(int id, ChatMessage chatMessage)
        {
            if (id != chatMessage.Id)
            {
                return BadRequest();
            }

            _context.Entry(chatMessage).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ChatMessageExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/ChatMessages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChatMessage(int id)
        {
            var chatMessage = await _context.ChatMessages.FindAsync(id);
            if (chatMessage == null)
            {
                return NotFound();
            }

            _context.ChatMessages.Remove(chatMessage);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ChatMessageExists(int id)
        {
            return _context.ChatMessages.Any(e => e.Id == id);
        }

        // Helper method to calculate cosine similarity between two vectors
        private double CosineSimilarity(float[] vectorA, float[] vectorB)
        {
            if (vectorA == null || vectorB == null || vectorA.Length != vectorB.Length)
            {
                return 0.0;
            }

            double dotProduct = 0.0;
            double magnitudeA = 0.0;
            double magnitudeB = 0.0;

            for (int i = 0; i < vectorA.Length; i++)
            {
                dotProduct += vectorA[i] * vectorB[i];
                magnitudeA += vectorA[i] * vectorA[i];
                magnitudeB += vectorB[i] * vectorB[i];
            }

            magnitudeA = Math.Sqrt(magnitudeA);
            magnitudeB = Math.Sqrt(magnitudeB);

            if (magnitudeA == 0.0 || magnitudeB == 0.0)
            {
                return 0.0;
            }

            return dotProduct / (magnitudeA * magnitudeB);
        }
    }
}
