using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using myapp.Data;
using myapp.Models;
using myapp.Services;

namespace StudyAssistant.Tests
{
    /// <summary>
    /// Unit Tests for AI Course Generation Feature
    /// Testing course CRUD operations with mocked database context
    /// Total: 15 test cases covering 4 main operations (Create, Read, Update, Delete)
    /// Feature: AI-powered course generation and management
    /// </summary>
    public class AICoursesServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<ILogger<CoursesService>> _mockLogger;
        private readonly CoursesService _service;

        public AICoursesServiceTests()
        {
            // Setup in-memory database with mocking
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<CoursesService>>();
            _service = new CoursesService(_context, _mockLogger.Object);
        }

        #region Test Group 1: GetById Tests (4 test cases)

        [Fact]
        public async Task Test01_GetCourseById_ValidId_ReturnsCourse()
        {
            // Arrange - Create test course
            var course = new Course
            {
                Title = "Introduction to Machine Learning",
                Description = "AI-generated ML course",
                CreatedAt = DateTime.UtcNow
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetByIdAsync(course.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Introduction to Machine Learning");
            result.Description.Should().Contain("AI-generated");
            
            // Verify logger was called
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Retrieved course")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task Test02_GetCourseById_InvalidId_ReturnsNull()
        {
            // Act
            var result = await _service.GetByIdAsync(999);

            // Assert
            result.Should().BeNull();
            
            // Verify logger logged the failure
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("not found")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task Test03_GetCourseById_WithTopics_ReturnsFullCourse()
        {
            // Arrange
            var course = new Course
            {
                Title = "Python Programming",
                Description = "Complete Python course"
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            var topic = new Topic
            {
                Title = "Variables",
                CourseId = course.Id,
                Course = course,
                OrderIndex = 1
            };
            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetByIdAsync(course.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Topics.Should().HaveCount(1);
            result.Topics.First().Title.Should().Be("Variables");
        }

        [Fact]
        public async Task Test04_GetCourseById_DeletedCourse_ReturnsNull()
        {
            // Arrange
            var course = new Course
            {
                Title = "Deleted Course",
                Description = "This will be deleted"
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            var courseId = course.Id;

            // Delete the course
            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetByIdAsync(courseId);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region Test Group 2: Create Tests (4 test cases)

        [Fact]
        public async Task Test05_CreateCourse_ValidData_SavesSuccessfully()
        {
            // Arrange
            var course = new Course
            {
                Title = "Data Science Fundamentals",
                Description = "AI-generated data science course",
                CreatedAt = DateTime.UtcNow
            };

            // Act
            var result = await _service.CreateAsync(course);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeGreaterThan(0);
            result.Title.Should().Be("Data Science Fundamentals");
            
            var saved = await _context.Courses.FindAsync(result.Id);
            saved.Should().NotBeNull();
            
            // Verify logger
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Created course")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task Test06_CreateCourse_EmptyTitle_ThrowsException()
        {
            // Arrange
            var course = new Course
            {
                Title = "",
                Description = "Course without title"
            };

            // Act
            Func<Task> act = async () => await _service.CreateAsync(course);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage("*Title*required*");
        }

        [Fact]
        public async Task Test07_CreateCourse_WithTopics_SavesAllData()
        {
            // Arrange
            var course = new Course
            {
                Title = "Web Development",
                Description = "Full-stack web development"
            };
            var topic1 = new Topic { Title = "HTML Basics", Course = course, OrderIndex = 1 };
            var topic2 = new Topic { Title = "CSS Styling", Course = course, OrderIndex = 2 };
            course.Topics = new List<Topic> { topic1, topic2 };

            // Act
            var result = await _service.CreateAsync(course);

            // Assert
            result.Topics.Should().HaveCount(2);
            var savedCourse = await _context.Courses
                .Include(c => c.Topics)
                .FirstAsync(c => c.Id == result.Id);
            savedCourse.Topics.Should().HaveCount(2);
        }

        [Fact]
        public async Task Test08_CreateCourse_DuplicateTitle_AllowsCreation()
        {
            // Arrange
            var course1 = new Course { Title = "Python Basics", Description = "First course" };
            var course2 = new Course { Title = "Python Basics", Description = "Second course" };

            // Act
            await _service.CreateAsync(course1);
            var result = await _service.CreateAsync(course2);

            // Assert - System allows duplicate titles
            result.Should().NotBeNull();
            _context.Courses.Count(c => c.Title == "Python Basics").Should().Be(2);
        }

        #endregion

        #region Test Group 3: Update Tests (4 test cases)

        [Fact]
        public async Task Test09_UpdateCourse_ValidData_UpdatesSuccessfully()
        {
            // Arrange
            var course = new Course
            {
                Title = "Original Title",
                Description = "Original description"
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            // Act
            course.Title = "Updated Title";
            course.Description = "Updated description";
            var result = await _service.UpdateAsync(course.Id, course);

            // Assert
            result.Should().BeTrue();
            var updated = await _context.Courses.FindAsync(course.Id);
            updated!.Title.Should().Be("Updated Title");
            updated.Description.Should().Be("Updated description");
            
            // Verify logger
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Updated course")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task Test10_UpdateCourse_NonExistentId_ReturnsFalse()
        {
            // Arrange
            var course = new Course
            {
                Title = "Test Course",
                Description = "Test description"
            };

            // Act
            var result = await _service.UpdateAsync(999, course);

            // Assert
            result.Should().BeFalse();
            
            // Verify logger logged warning
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("not found")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task Test11_UpdateCourse_EmptyTitle_ThrowsException()
        {
            // Arrange
            var course = new Course { Title = "Valid Title", Description = "Description" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            // Act
            course.Title = "";
            Func<Task> act = async () => await _service.UpdateAsync(course.Id, course);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task Test12_UpdateCourse_OnlyDescription_UpdatesCorrectly()
        {
            // Arrange
            var course = new Course { Title = "Fixed Title", Description = "Old description" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            var originalTitle = course.Title;

            // Act
            course.Description = "New description";
            await _service.UpdateAsync(course.Id, course);

            // Assert
            var updated = await _context.Courses.FindAsync(course.Id);
            updated!.Title.Should().Be(originalTitle);
            updated.Description.Should().Be("New description");
        }

        #endregion

        #region Test Group 4: Delete Tests (3 test cases)

        [Fact]
        public async Task Test13_DeleteCourse_ValidId_DeletesSuccessfully()
        {
            // Arrange
            var course = new Course { Title = "Course to Delete", Description = "Will be deleted" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            var courseId = course.Id;

            // Act
            var result = await _service.DeleteAsync(courseId);

            // Assert
            result.Should().BeTrue();
            var deleted = await _context.Courses.FindAsync(courseId);
            deleted.Should().BeNull();
            
            // Verify logger
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deleted course")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task Test14_DeleteCourse_NonExistentId_ReturnsFalse()
        {
            // Act
            var result = await _service.DeleteAsync(999);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task Test15_DeleteCourse_WithTopics_DeletesCascade()
        {
            // Arrange
            var course = new Course { Title = "Course with Topics", Description = "Has topics" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            var topic = new Topic { Title = "Topic 1", Course = course, CourseId = course.Id, OrderIndex = 1 };
            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();
            var courseId = course.Id;

            // Act
            var result = await _service.DeleteAsync(courseId);

            // Assert
            result.Should().BeTrue();
            _context.Courses.Should().NotContain(c => c.Id == courseId);
            // Topics should also be deleted due to cascade delete
            _context.Topics.Should().NotContain(t => t.CourseId == courseId);
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
