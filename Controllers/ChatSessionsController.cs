using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using myapp.Data;
using myapp.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace myapp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Protect all endpoints in this controller
    public class ChatSessionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatSessionsController(ApplicationDbContext context)
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

        // GET: api/ChatSessions/my-sessions - Get all sessions for current user
        [HttpGet("my-sessions")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyChatSessions()
        {
            var userId = GetCurrentUserId();
            
            var sessions = await _context.ChatSessions
                .Where(cs => cs.UserId == userId)
                .Include(cs => cs.Course)
                .Include(cs => cs.Document)
                .Include(cs => cs.ChatMessages)
                .OrderByDescending(cs => cs.LastMessageAt ?? cs.CreatedAt)
                .Select(cs => new
                {
                    cs.Id,
                    cs.Title,
                    cs.CreatedAt,
                    cs.UpdatedAt,
                    cs.LastMessageAt,
                    cs.CourseId,
                    CourseName = cs.Course != null ? cs.Course.Title : null,
                    cs.DocumentId,
                    DocumentName = cs.Document != null ? cs.Document.Title : null,
                    MessageCount = cs.ChatMessages.Count,
                    LastMessage = cs.ChatMessages
                        .OrderByDescending(m => m.CreatedAt)
                        .Select(m => new { m.Role, m.Content, m.CreatedAt })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(sessions);
        }

        // GET: api/ChatSessions - Admin only, get all sessions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChatSession>>> GetChatSessions()
        {
            return await _context.ChatSessions
                .Include(cs => cs.User)
                .Include(cs => cs.Course)
                .Include(cs => cs.Document)
                .ToListAsync();
        }

        // GET: api/ChatSessions/5 - With authorization check
        [HttpGet("{id}")]
        public async Task<ActionResult<ChatSession>> GetChatSession(int id)
        {
            var userId = GetCurrentUserId();
            
            var chatSession = await _context.ChatSessions
                .Include(cs => cs.User)
                .Include(cs => cs.Course)
                .Include(cs => cs.Document)
                .Include(cs => cs.ChatMessages)
                .ThenInclude(cm => cm.MessageCitations)
                .FirstOrDefaultAsync(cs => cs.Id == id);

            if (chatSession == null)
            {
                return NotFound(new { error = "ChatSessionNotFound", message = "Chat session not found." });
            }

            // Authorization: Only owner can access their session
            if (chatSession.UserId != userId)
            {
                return Forbid();
            }

            return chatSession;
        }

        // POST: api/ChatSessions - Create new chat session
        [HttpPost]
        public async Task<ActionResult<ChatSession>> PostChatSession(ChatSession chatSession)
        {
            var userId = GetCurrentUserId();
            
            // Force the session to belong to current user
            chatSession.UserId = userId;
            
            // Validate CourseId and DocumentId if provided
            if (chatSession.CourseId.HasValue && !await _context.Courses.AnyAsync(c => c.Id == chatSession.CourseId.Value))
            {
                return BadRequest(new { error = "InvalidCourseId", message = "Course not found." });
            }
            if (chatSession.DocumentId.HasValue && !await _context.Documents.AnyAsync(d => d.Id == chatSession.DocumentId.Value))
            {
                return BadRequest(new { error = "InvalidDocumentId", message = "Document not found." });
            }

            // Set timestamps
            chatSession.CreatedAt = DateTime.UtcNow;
            chatSession.UpdatedAt = DateTime.UtcNow;
            
            _context.ChatSessions.Add(chatSession);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetChatSession), new { id = chatSession.Id }, chatSession);
        }

        // PUT: api/ChatSessions/5 - Update session (e.g., rename title)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutChatSession(int id, ChatSession chatSession)
        {
            if (id != chatSession.Id)
            {
                return BadRequest(new { error = "IdMismatch", message = "Session ID in URL does not match body." });
            }

            var userId = GetCurrentUserId();
            
            // Check if session exists and belongs to user
            var existingSession = await _context.ChatSessions.FindAsync(id);
            if (existingSession == null)
            {
                return NotFound(new { error = "ChatSessionNotFound", message = "Chat session not found." });
            }
            
            if (existingSession.UserId != userId)
            {
                return Forbid();
            }

            // Only allow updating certain fields (Title, UpdatedAt)
            existingSession.Title = chatSession.Title;
            existingSession.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ChatSessionExists(id))
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

        // DELETE: api/ChatSessions/5 - Delete session with authorization
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChatSession(int id)
        {
            var userId = GetCurrentUserId();
            
            var chatSession = await _context.ChatSessions.FindAsync(id);
            if (chatSession == null)
            {
                return NotFound(new { error = "ChatSessionNotFound", message = "Chat session not found." });
            }

            // Authorization: Only owner can delete
            if (chatSession.UserId != userId)
            {
                return Forbid();
            }

            _context.ChatSessions.Remove(chatSession);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ChatSessionExists(int id)
        {
            return _context.ChatSessions.Any(e => e.Id == id);
        }
    }
}
