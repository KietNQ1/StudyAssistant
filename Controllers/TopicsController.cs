using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using myapp.Data;
using myapp.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace myapp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TopicsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TopicsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Topics/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<Topic>>> GetCourseTopics(int courseId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            // Verify user owns the course
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == courseId && c.UserId == int.Parse(userId));
            
            if (course == null)
            {
                return NotFound("Course not found or access denied");
            }

            // Get all topics for the course, ordered by OrderIndex
            var topics = await _context.Topics
                .Where(t => t.CourseId == courseId)
                .OrderBy(t => t.OrderIndex)
                .ToListAsync();

            return Ok(topics);
        }

        // GET: api/Topics/course/{courseId}/tree
        [HttpGet("course/{courseId}/tree")]
        public async Task<ActionResult<IEnumerable<object>>> GetCourseTopicsTree(int courseId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            // Verify user owns the course
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == courseId && c.UserId == int.Parse(userId));
            
            if (course == null)
            {
                return NotFound("Course not found or access denied");
            }

            // Get all topics for the course
            var allTopics = await _context.Topics
                .Where(t => t.CourseId == courseId)
                .OrderBy(t => t.OrderIndex)
                .ToListAsync();

            // Build tree structure (only root topics)
            var rootTopics = BuildTopicTree(allTopics, null);
            
            return Ok(rootTopics);
        }

        // Helper method to build tree structure
        private List<object> BuildTopicTree(List<Topic> allTopics, int? parentId)
        {
            return allTopics
                .Where(t => t.ParentTopicId == parentId)
                .OrderBy(t => t.OrderIndex)
                .Select(t => new
                {
                    t.Id,
                    t.CourseId,
                    t.ParentTopicId,
                    t.Title,
                    t.Description,
                    t.OrderIndex,
                    t.EstimatedTimeMinutes,
                    Children = BuildTopicTree(allTopics, t.Id)
                })
                .ToList<object>();
        }

        // GET: api/Topics/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Topic>> GetTopic(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var topic = await _context.Topics
                .Include(t => t.Course)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound();
            }

            // Verify user owns the course
            if (topic.Course.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            return topic;
        }

        // POST: api/Topics
        [HttpPost]
        public async Task<ActionResult<Topic>> CreateTopic(CreateTopicDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            // Verify user owns the course
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == dto.CourseId && c.UserId == int.Parse(userId));
            
            if (course == null)
            {
                return NotFound("Course not found or access denied");
            }

            // Get the next order index
            var maxOrderIndex = await _context.Topics
                .Where(t => t.CourseId == dto.CourseId && t.ParentTopicId == dto.ParentTopicId)
                .MaxAsync(t => (int?)t.OrderIndex) ?? -1;

            var topic = new Topic
            {
                CourseId = dto.CourseId,
                ParentTopicId = dto.ParentTopicId,
                Title = dto.Title,
                Description = dto.Description,
                OrderIndex = maxOrderIndex + 1,
                EstimatedTimeMinutes = dto.EstimatedTimeMinutes,
                Course = course // Set the required navigation property
            };

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTopic), new { id = topic.Id }, topic);
        }

        // PUT: api/Topics/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTopic(int id, UpdateTopicDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var topic = await _context.Topics
                .Include(t => t.Course)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound();
            }

            // Verify user owns the course
            if (topic.Course.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            // Update fields
            topic.Title = dto.Title;
            topic.Description = dto.Description;
            topic.EstimatedTimeMinutes = dto.EstimatedTimeMinutes;

            // If parent is changing, update order index
            if (dto.ParentTopicId != topic.ParentTopicId)
            {
                topic.ParentTopicId = dto.ParentTopicId;
                
                // Get the next order index in the new parent
                var maxOrderIndex = await _context.Topics
                    .Where(t => t.CourseId == topic.CourseId && t.ParentTopicId == dto.ParentTopicId && t.Id != id)
                    .MaxAsync(t => (int?)t.OrderIndex) ?? -1;
                
                topic.OrderIndex = maxOrderIndex + 1;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Topics/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTopic(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var topic = await _context.Topics
                .Include(t => t.Course)
                .Include(t => t.ChildTopics)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound();
            }

            // Verify user owns the course
            if (topic.Course.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            // Check if topic has children
            if (topic.ChildTopics.Any())
            {
                return BadRequest("Cannot delete topic with child topics. Delete child topics first.");
            }

            _context.Topics.Remove(topic);
            await _context.SaveChangesAsync();

            // Reorder remaining topics
            var remainingTopics = await _context.Topics
                .Where(t => t.CourseId == topic.CourseId && 
                           t.ParentTopicId == topic.ParentTopicId && 
                           t.OrderIndex > topic.OrderIndex)
                .ToListAsync();

            foreach (var t in remainingTopics)
            {
                t.OrderIndex--;
            }
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Topics/reorder
        [HttpPost("reorder")]
        public async Task<IActionResult> ReorderTopics(ReorderTopicsDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            // Verify user owns the course
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == dto.CourseId && c.UserId == int.Parse(userId));
            
            if (course == null)
            {
                return NotFound("Course not found or access denied");
            }

            // Get all topics to reorder
            var topics = await _context.Topics
                .Where(t => dto.TopicIds.Contains(t.Id) && t.CourseId == dto.CourseId)
                .ToListAsync();

            if (topics.Count != dto.TopicIds.Count)
            {
                return BadRequest("Invalid topic IDs provided");
            }

            // Update order indexes
            for (int i = 0; i < dto.TopicIds.Count; i++)
            {
                var topic = topics.First(t => t.Id == dto.TopicIds[i]);
                topic.OrderIndex = i;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Topics/{id}/attach-document
        [HttpPost("{id}/attach-document")]
        public async Task<IActionResult> AttachDocument(int id, AttachDocumentDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var topic = await _context.Topics
                .Include(t => t.Course)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound("Topic not found");
            }

            // Verify user owns the course
            if (topic.Course.UserId != int.Parse(userId))
            {
                return Forbid();
            }

            // Verify document belongs to the same course
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == dto.DocumentId && d.CourseId == topic.CourseId);

            if (document == null)
            {
                return BadRequest("Document not found or doesn't belong to the same course");
            }

            // Note: We would need to add a TopicId field to Document model
            // For now, we'll return a message about this limitation
            return BadRequest("Document-Topic relationship not yet implemented in database. Need to add TopicId to Document model.");
        }

        // PUT: api/Topics/{id}/content
        [HttpPut("{id}/content")]
        public async Task<IActionResult> UpdateTopicContent(int id, UpdateContentDto dto)
        {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            return Unauthorized();
        }

        var topic = await _context.Topics
            .Include(t => t.Course)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (topic == null)
        {
            return NotFound();
        }

        // Verify user owns the course
        if (topic.Course.UserId != int.Parse(userId))
        {
            return Forbid();
        }

        topic.Content = dto.Content;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/Topics/{id}/complete
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> MarkTopicComplete(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            return Unauthorized();
        }

        var topic = await _context.Topics
            .Include(t => t.Course)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (topic == null)
        {
            return NotFound();
        }

        // Verify user owns the course
        if (topic.Course.UserId != int.Parse(userId))
        {
            return Forbid();
        }

        topic.IsCompleted = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DTOs
    public class CreateTopicDto
    {
        public int CourseId { get; set; }
        public int? ParentTopicId { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
        public int EstimatedTimeMinutes { get; set; }
    }

    public class UpdateTopicDto
    {
        public required string Title { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
        public int? ParentTopicId { get; set; }
        public int EstimatedTimeMinutes { get; set; }
    }

    public class UpdateContentDto
    {
        public string? Content { get; set; }
    }

    public class ReorderTopicsDto
    {
        public int CourseId { get; set; }
        public required List<int> TopicIds { get; set; }
    }

    public class AttachDocumentDto
    {
        public int DocumentId { get; set; }
    }
    }
}