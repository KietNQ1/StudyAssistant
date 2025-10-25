using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using myapp.Data;
using System.Linq;
using System.Threading.Tasks;

namespace myapp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RAGCheckController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RAGCheckController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("status")]
        public async Task<IActionResult> CheckRAGStatus()
        {
            var result = new
            {
                Documents = new
                {
                    Total = await _context.Documents.CountAsync(),
                    Completed = await _context.Documents.Where(d => d.ProcessingStatus == "completed").CountAsync(),
                    Failed = await _context.Documents.Where(d => d.ProcessingStatus == "failed").CountAsync(),
                    Processing = await _context.Documents.Where(d => d.ProcessingStatus == "processing").CountAsync(),
                    Recent = await _context.Documents
                        .OrderByDescending(d => d.UploadedAt)
                        .Take(5)
                        .Select(d => new { d.Id, d.Title, d.ProcessingStatus, d.PageCount, d.UploadedAt })
                        .ToListAsync()
                },
                Chunks = new
                {
                    Total = await _context.DocumentChunks.CountAsync(),
                    WithEmbeddings = await _context.DocumentChunks.Where(dc => dc.EmbeddingVector != null).CountAsync(),
                    WithoutEmbeddings = await _context.DocumentChunks.Where(dc => dc.EmbeddingVector == null).CountAsync(),
                    ByDocument = await _context.DocumentChunks
                        .GroupBy(dc => dc.DocumentId)
                        .Select(g => new
                        {
                            DocumentId = g.Key,
                            ChunkCount = g.Count(),
                            WithEmbedding = g.Count(c => c.EmbeddingVector != null)
                        })
                        .ToListAsync(),
                    Sample = await _context.DocumentChunks
                        .Where(dc => dc.EmbeddingVector != null)
                        .OrderByDescending(dc => dc.Id)
                        .Select(dc => new
                        {
                            dc.Id,
                            dc.DocumentId,
                            ContentLength = dc.Content.Length,
                            EmbeddingDimension = dc.EmbeddingVector != null ? dc.EmbeddingVector.Length : 0,
                            ContentPreview = dc.Content.Length > 100 ? dc.Content.Substring(0, 100) + "..." : dc.Content
                        })
                        .FirstOrDefaultAsync()
                },
                ChatSessions = new
                {
                    Total = await _context.ChatSessions.CountAsync(),
                    WithDocument = await _context.ChatSessions.Where(cs => cs.DocumentId != null).CountAsync(),
                    WithoutDocument = await _context.ChatSessions.Where(cs => cs.DocumentId == null).CountAsync(),
                    LinkedSessions = await _context.ChatSessions
                        .Where(cs => cs.DocumentId != null)
                        .Include(cs => cs.Document)
                        .Take(5)
                        .Select(cs => new
                        {
                            SessionId = cs.Id,
                            SessionTitle = cs.Title,
                            DocumentId = cs.DocumentId,
                            DocumentTitle = cs.Document != null ? cs.Document.Title : null
                        })
                        .ToListAsync()
                },
                RAGStatus = new
                {
                    HasDocuments = await _context.Documents.AnyAsync(),
                    HasProcessedDocs = await _context.Documents.AnyAsync(d => d.ProcessingStatus == "completed"),
                    HasChunks = await _context.DocumentChunks.AnyAsync(),
                    HasEmbeddings = await _context.DocumentChunks.AnyAsync(dc => dc.EmbeddingVector != null),
                    HasLinkedSessions = await _context.ChatSessions.AnyAsync(cs => cs.DocumentId != null),
                    IsWorking = await _context.Documents.AnyAsync() &&
                               await _context.Documents.AnyAsync(d => d.ProcessingStatus == "completed") &&
                               await _context.DocumentChunks.AnyAsync() &&
                               await _context.DocumentChunks.AnyAsync(dc => dc.EmbeddingVector != null)
                }
            };

            return Ok(result);
        }

        [HttpGet("test-vector-search/{documentId}")]
        public async Task<IActionResult> TestVectorSearch(int documentId, [FromQuery] string query = "test")
        {
            // Check if document exists and has chunks
            var document = await _context.Documents.FindAsync(documentId);
            if (document == null)
                return NotFound($"Document {documentId} not found");

            var chunks = await _context.DocumentChunks
                .Where(dc => dc.DocumentId == documentId)
                .ToListAsync();

            if (!chunks.Any())
                return NotFound($"No chunks found for document {documentId}");

            var chunksWithEmbeddings = chunks.Where(c => c.EmbeddingVector != null).ToList();
            if (!chunksWithEmbeddings.Any())
                return NotFound($"No embeddings found for document {documentId} chunks");

            return Ok(new
            {
                DocumentId = documentId,
                DocumentTitle = document.Title,
                TotalChunks = chunks.Count,
                ChunksWithEmbeddings = chunksWithEmbeddings.Count,
                Message = "Vector search infrastructure is ready! Embeddings exist.",
                SampleChunks = chunksWithEmbeddings.Take(3).Select(c => new
                {
                    c.Id,
                    c.ChunkIndex,
                    ContentPreview = c.Content.Length > 150 ? c.Content.Substring(0, 150) + "..." : c.Content,
                    EmbeddingDimension = c.EmbeddingVector.Length
                })
            });
        }
    }
}
