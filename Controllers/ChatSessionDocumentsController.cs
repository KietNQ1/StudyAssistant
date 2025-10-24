using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using myapp.Data;
using myapp.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace myapp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatSessionDocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatSessionDocumentsController(ApplicationDbContext context)
        {
            _context = context;
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

        // GET: api/ChatSessionDocuments/session/5
        // Get all documents attached to a chat session
        [HttpGet("session/{sessionId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSessionDocuments(int sessionId)
        {
            var userId = GetCurrentUserId();
            
            var chatSession = await _context.ChatSessions
                .FirstOrDefaultAsync(cs => cs.Id == sessionId);

            if (chatSession == null)
            {
                return NotFound(new { error = "Chat session not found" });
            }

            // Authorization check
            if (chatSession.UserId != userId)
            {
                return Forbid();
            }

            var documents = await _context.ChatSessionDocuments
                .Where(csd => csd.ChatSessionId == sessionId)
                .Include(csd => csd.Document)
                .OrderBy(csd => csd.DisplayOrder)
                .Select(csd => new
                {
                    id = csd.Id,
                    documentId = csd.DocumentId,
                    document = new
                    {
                        id = csd.Document.Id,
                        title = csd.Document.Title,
                        fileType = csd.Document.FileType,
                        processingStatus = csd.Document.ProcessingStatus,
                        uploadedAt = csd.Document.UploadedAt
                    },
                    addedAt = csd.AddedAt,
                    displayOrder = csd.DisplayOrder
                })
                .ToListAsync();

            return Ok(documents);
        }

        // POST: api/ChatSessionDocuments
        // Add a document to a chat session
        [HttpPost]
        public async Task<ActionResult<ChatSessionDocument>> AddDocumentToSession([FromBody] AddDocumentRequest request)
        {
            var userId = GetCurrentUserId();
            
            var chatSession = await _context.ChatSessions
                .FirstOrDefaultAsync(cs => cs.Id == request.ChatSessionId);

            if (chatSession == null)
            {
                return NotFound(new { error = "Chat session not found" });
            }

            // Authorization check
            if (chatSession.UserId != userId)
            {
                return Forbid();
            }

            // Check if document exists
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == request.DocumentId);

            if (document == null)
            {
                return NotFound(new { error = "Document not found" });
            }

            // Check if document already attached
            var existing = await _context.ChatSessionDocuments
                .FirstOrDefaultAsync(csd => csd.ChatSessionId == request.ChatSessionId && csd.DocumentId == request.DocumentId);

            if (existing != null)
            {
                return BadRequest(new { error = "Document already attached to this session" });
            }

            // Get next display order
            var maxOrder = await _context.ChatSessionDocuments
                .Where(csd => csd.ChatSessionId == request.ChatSessionId)
                .MaxAsync(csd => (int?)csd.DisplayOrder) ?? 0;

            var chatSessionDocument = new ChatSessionDocument
            {
                ChatSessionId = request.ChatSessionId,
                DocumentId = request.DocumentId,
                AddedAt = DateTime.UtcNow,
                DisplayOrder = maxOrder + 1
            };

            _context.ChatSessionDocuments.Add(chatSessionDocument);
            await _context.SaveChangesAsync();

            // Load the document details
            await _context.Entry(chatSessionDocument).Reference(csd => csd.Document).LoadAsync();

            return Ok(new
            {
                id = chatSessionDocument.Id,
                documentId = chatSessionDocument.DocumentId,
                document = new
                {
                    id = chatSessionDocument.Document.Id,
                    title = chatSessionDocument.Document.Title,
                    fileType = chatSessionDocument.Document.FileType,
                    processingStatus = chatSessionDocument.Document.ProcessingStatus
                },
                addedAt = chatSessionDocument.AddedAt,
                displayOrder = chatSessionDocument.DisplayOrder
            });
        }

        // DELETE: api/ChatSessionDocuments/5
        // Remove a document from a chat session
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveDocumentFromSession(int id)
        {
            var userId = GetCurrentUserId();
            
            var chatSessionDocument = await _context.ChatSessionDocuments
                .Include(csd => csd.ChatSession)
                .FirstOrDefaultAsync(csd => csd.Id == id);

            if (chatSessionDocument == null)
            {
                return NotFound(new { error = "Document attachment not found" });
            }

            // Authorization check
            if (chatSessionDocument.ChatSession.UserId != userId)
            {
                return Forbid();
            }

            _context.ChatSessionDocuments.Remove(chatSessionDocument);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Document removed from session" });
        }

        // POST: api/ChatSessionDocuments/reorder
        // Reorder documents in a chat session
        [HttpPost("reorder")]
        public async Task<IActionResult> ReorderDocuments([FromBody] ReorderRequest request)
        {
            var userId = GetCurrentUserId();
            
            var chatSession = await _context.ChatSessions
                .FirstOrDefaultAsync(cs => cs.Id == request.ChatSessionId);

            if (chatSession == null)
            {
                return NotFound(new { error = "Chat session not found" });
            }

            // Authorization check
            if (chatSession.UserId != userId)
            {
                return Forbid();
            }

            foreach (var item in request.DocumentOrders)
            {
                var csd = await _context.ChatSessionDocuments
                    .FirstOrDefaultAsync(csd => csd.Id == item.Id && csd.ChatSessionId == request.ChatSessionId);

                if (csd != null)
                {
                    csd.DisplayOrder = item.Order;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Documents reordered successfully" });
        }
    }

    // Request DTOs
    public class AddDocumentRequest
    {
        public int ChatSessionId { get; set; }
        public int DocumentId { get; set; }
    }

    public class ReorderRequest
    {
        public int ChatSessionId { get; set; }
        public List<DocumentOrder> DocumentOrders { get; set; } = new();
    }

    public class DocumentOrder
    {
        public int Id { get; set; }
        public int Order { get; set; }
    }
}
