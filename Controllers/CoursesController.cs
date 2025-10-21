using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using myapp.Data;
using myapp.Models;
using myapp.Models.DTOs;
using myapp.Services;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims; // Add this for User.FindFirst
using System.Threading.Tasks;
using System.Text.Json;

namespace myapp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly VertexAIService _vertexAIService;
        private readonly WebScraperService _webScraperService;

        public CoursesController(ApplicationDbContext context, VertexAIService vertexAIService, WebScraperService webScraperService)
        {
            _context = context;
            _vertexAIService = vertexAIService;
            _webScraperService = webScraperService;
        }

        // GET: api/Courses - Get courses for the current user
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetCourses()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var courses = await _context.Courses
                .Where(c => c.UserId == int.Parse(userId))
                .Include(c => c.User)
                .ToListAsync();
            
            return courses;
        }

        // GET: api/Courses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Course>> GetCourse(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }
            
            var course = await _context.Courses
                .Include(c => c.User)
                .Include(c => c.Documents)
                .Include(c => c.Topics)
                .Include(c => c.Quizzes)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == int.Parse(userId));

            if (course == null)
            {
                return NotFound();
            }

            return course;
        }

        // POST: api/Courses
        [HttpPost]
        public async Task<ActionResult<Course>> PostCourse(CreateCourseDto createCourseDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var course = new Course
            {
                UserId = int.Parse(userId), // Set UserId from the authenticated user's token
                Title = createCourseDto.Title,
                Description = createCourseDto.Description,
                IsPublic = false,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
        }

        // ... (PUT and DELETE should also be updated to check for ownership)
        
        // PUT: api/Courses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCourse(int id, Course course)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null || course.UserId != int.Parse(userId))
            {
                return Forbid(); // User does not own this course
            }

            if (id != course.Id)
            {
                return BadRequest();
            }

            _context.Entry(course).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CourseExists(id))
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

        // DELETE: api/Courses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var course = await _context.Courses.FindAsync(id);
            
            if (course == null)
            {
                return NotFound();
            }

            if (userId == null || course.UserId != int.Parse(userId))
            {
                return Forbid(); // User does not own this course
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Courses/GenerateFromDocuments
        [HttpPost("GenerateFromDocuments")]
        public async Task<ActionResult<Course>> GenerateCourseFromDocuments(GenerateCourseDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var contentParts = new List<string>();

            // Handle Documents
            if (dto.DocumentIds != null && dto.DocumentIds.Any())
            {
                var documents = await _context.Documents
                    .Where(d => dto.DocumentIds.Contains(d.Id))
                    .Include(d => d.Course)
                    .ToListAsync();

                if (documents.Count != dto.DocumentIds.Count)
                {
                    return BadRequest("Some documents were not found");
                }

                // Check ownership
                if (documents.Any(d => d.Course?.UserId != int.Parse(userId)))
                {
                    return Forbid();
                }

                // Add document content
                foreach (var doc in documents)
                {
                    if (!string.IsNullOrWhiteSpace(doc.ExtractedText))
                    {
                        contentParts.Add($"=== Document: {doc.Title} ===\n{doc.ExtractedText}");
                    }
                }
            }

            // Handle URLs
            if (dto.Urls != null && dto.Urls.Any())
            {
                // Limit URLs to prevent abuse
                if (dto.Urls.Count > 10)
                {
                    return BadRequest("Maximum 10 URLs allowed per request");
                }

                var webContents = await _webScraperService.ExtractContentFromUrlsAsync(dto.Urls);
                
                foreach (var webContent in webContents)
                {
                    if (webContent.Success && !string.IsNullOrWhiteSpace(webContent.Content))
                    {
                        contentParts.Add($"=== Web Page: {webContent.Title} ===\nURL: {webContent.Url}\n{webContent.Content}");
                    }
                    else
                    {
                        // Log failed URLs but continue
                        contentParts.Add($"=== Failed to fetch: {webContent.Url} ===\nError: {webContent.Error}");
                    }
                }
            }

            // Validate we have content
            if (!contentParts.Any())
            {
                return BadRequest("No content available. Please provide documents with extracted text or valid URLs.");
            }

            var aggregatedContent = string.Join("\n\n--- Content Separator ---\n\n", contentParts);

            // Limit content size (max ~50k characters to avoid token limits)
            if (aggregatedContent.Length > 50000)
            {
                aggregatedContent = aggregatedContent.Substring(0, 50000) + "\n[Content truncated due to length...]";
            }

            // Call AI to generate course structure
            string aiResponse;
            try
            {
                aiResponse = await _vertexAIService.GenerateCourseStructureAsync(aggregatedContent, dto.UserGoal ?? "");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"AI generation failed: {ex.Message}");
            }

            // Parse AI response
            CourseStructureResponse? courseStructure;
            try
            {
                // Clean up response - remove markdown code blocks if present
                var cleanResponse = aiResponse.Trim();
                if (cleanResponse.StartsWith("```json"))
                {
                    cleanResponse = cleanResponse.Substring(7);
                }
                if (cleanResponse.StartsWith("```"))
                {
                    cleanResponse = cleanResponse.Substring(3);
                }
                if (cleanResponse.EndsWith("```"))
                {
                    cleanResponse = cleanResponse.Substring(0, cleanResponse.Length - 3);
                }
                cleanResponse = cleanResponse.Trim();

                courseStructure = JsonSerializer.Deserialize<CourseStructureResponse>(cleanResponse, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                if (courseStructure == null)
                {
                    return BadRequest("Failed to parse AI response");
                }
            }
            catch (JsonException ex)
            {
                return BadRequest($"Failed to parse AI response: {ex.Message}. Response: {aiResponse}");
            }

            // Create the course
            var course = new Course
            {
                UserId = int.Parse(userId),
                Title = dto.CourseName ?? courseStructure.CourseTitle,
                Description = courseStructure.CourseDescription,
                IsPublic = false,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            // Associate documents with the new course (if any)
            if (dto.DocumentIds != null && dto.DocumentIds.Any())
            {
                var documents = await _context.Documents
                    .Where(d => dto.DocumentIds.Contains(d.Id))
                    .ToListAsync();
                    
                foreach (var doc in documents)
                {
                    doc.CourseId = course.Id;
                }
                await _context.SaveChangesAsync();
            }

            // Create topics and subtopics
            int orderIndex = 0;
            foreach (var topicDto in courseStructure.Topics)
            {
                var topic = new Topic
                {
                    CourseId = course.Id,
                    Course = course,
                    Title = topicDto.Title,
                    Description = topicDto.Description,
                    Content = topicDto.Content,
                    OrderIndex = orderIndex++,
                    EstimatedTimeMinutes = topicDto.EstimatedTimeMinutes,
                    IsCompleted = false
                };

                _context.Topics.Add(topic);
                await _context.SaveChangesAsync(); // Save to get the topic ID

                // Add subtopics
                if (topicDto.Subtopics != null && topicDto.Subtopics.Any())
                {
                    int subOrderIndex = 0;
                    foreach (var subtopicDto in topicDto.Subtopics)
                    {
                        var subtopic = new Topic
                        {
                            CourseId = course.Id,
                            Course = course,
                            ParentTopicId = topic.Id,
                            ParentTopic = topic,
                            Title = subtopicDto.Title,
                            Description = subtopicDto.Description,
                            Content = subtopicDto.Content,
                            OrderIndex = subOrderIndex++,
                            EstimatedTimeMinutes = subtopicDto.EstimatedTimeMinutes,
                            IsCompleted = false
                        };

                        _context.Topics.Add(subtopic);
                    }
                    await _context.SaveChangesAsync();
                }
            }

            // Return the created course with topics
            var createdCourse = await _context.Courses
                .Include(c => c.Documents)
                .Include(c => c.Topics)
                .FirstOrDefaultAsync(c => c.Id == course.Id);

            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, createdCourse);
        }

        private bool CourseExists(int id)
        {
            return _context.Courses.Any(e => e.Id == id);
        }
    }

    // DTOs for AI Course Generation
    public class GenerateCourseDto
    {
        public List<int>? DocumentIds { get; set; }
        public List<string>? Urls { get; set; }
        public string? CourseName { get; set; }
        public string? UserGoal { get; set; }
    }

    public class CourseStructureResponse
    {
        public required string CourseTitle { get; set; }
        public required string CourseDescription { get; set; }
        public required List<TopicDto> Topics { get; set; }
    }

    public class TopicDto
    {
        public required string Title { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
        public int EstimatedTimeMinutes { get; set; }
        public List<SubtopicDto>? Subtopics { get; set; }
    }

    public class SubtopicDto
    {
        public required string Title { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
        public int EstimatedTimeMinutes { get; set; }
    }
}
