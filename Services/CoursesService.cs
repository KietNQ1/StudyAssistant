using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using myapp.Data;
using myapp.Models;

namespace myapp.Services
{
    /// <summary>
    /// Service for managing AI-generated courses
    /// Part of AI Course Generation feature
    /// </summary>
    public class CoursesService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CoursesService> _logger;

        public CoursesService(ApplicationDbContext context, ILogger<CoursesService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Course?> GetByIdAsync(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Topics)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
            {
                _logger.LogWarning($"Course with ID {id} not found");
                return null;
            }

            _logger.LogInformation($"Retrieved course {id}: {course.Title}");
            return course;
        }

        public async Task<Course> CreateAsync(Course course)
        {
            if (string.IsNullOrWhiteSpace(course.Title))
            {
                throw new ArgumentException("Title is required");
            }

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Created course {course.Id}: {course.Title}");
            return course;
        }

        public async Task<bool> UpdateAsync(int id, Course course)
        {
            var existing = await _context.Courses.FindAsync(id);
            if (existing == null)
            {
                _logger.LogWarning($"Cannot update - course {id} not found");
                return false;
            }

            if (string.IsNullOrWhiteSpace(course.Title))
            {
                throw new ArgumentException("Title is required");
            }

            existing.Title = course.Title;
            existing.Description = course.Description;
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Updated course {id}: {course.Title}");
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return false;
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Deleted course {id}");
            return true;
        }
    }
}
