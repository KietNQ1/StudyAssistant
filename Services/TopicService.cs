using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using myapp.Data;
using myapp.Models;

namespace myapp.Services
{
    /// <summary>
    /// Service for managing Topics in AI-generated courses
    /// Part of the AI Course Generation feature
    /// </summary>
    public class TopicService
    {
        private readonly ApplicationDbContext _context;

        public TopicService(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        /// <summary>
        /// Get a topic by its ID
        /// </summary>
        public async Task<Topic?> GetByIdAsync(int id)
        {
            return await _context.Topics.FindAsync(id);
        }

        /// <summary>
        /// Create a new topic
        /// </summary>
        public async Task<Topic> CreateAsync(Topic topic)
        {
            if (topic == null)
                throw new ArgumentNullException(nameof(topic));

            if (string.IsNullOrWhiteSpace(topic.Title))
                throw new ArgumentException("Title is required", nameof(topic));

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();
            return topic;
        }

        /// <summary>
        /// Update an existing topic
        /// </summary>
        public async Task<bool> UpdateAsync(int id, Topic topic)
        {
            if (topic == null)
                throw new ArgumentNullException(nameof(topic));

            var existing = await _context.Topics.FindAsync(id);
            if (existing == null)
                return false;

            existing.Title = topic.Title;
            existing.Description = topic.Description;
            existing.Content = topic.Content;
            existing.EstimatedTimeMinutes = topic.EstimatedTimeMinutes;
            existing.OrderIndex = topic.OrderIndex;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Delete a topic by its ID
        /// </summary>
        public async Task<bool> DeleteAsync(int id)
        {
            var topic = await _context.Topics.FindAsync(id);
            if (topic == null)
                return false;

            _context.Topics.Remove(topic);
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Check if a topic exists
        /// </summary>
        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Topics.AnyAsync(t => t.Id == id);
        }

        /// <summary>
        /// Get all topics for a specific course
        /// </summary>
        public async Task<List<Topic>> GetByCourseIdAsync(int courseId)
        {
            return await _context.Topics
                .Where(t => t.CourseId == courseId)
                .OrderBy(t => t.OrderIndex)
                .ToListAsync();
        }
    }
}
