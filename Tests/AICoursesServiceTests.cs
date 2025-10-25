using Xunit;
using Xunit.Abstractions;
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
        private readonly ITestOutputHelper _output;

        public AICoursesServiceTests(ITestOutputHelper output)
        {
            _output = output;

            // Setup in-memory database with mocking
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<CoursesService>>();
            _service = new CoursesService(_context, _mockLogger.Object);

            _output.WriteLine("========================================");
            _output.WriteLine("Test Environment Initialized");
            _output.WriteLine("========================================");
        }

        #region Test Group 1: GetById Tests (4 test cases)

        [Fact]
        public async Task Test01_GetCourseById_ValidId_ReturnsCourse()
        {
            _output.WriteLine("\n▶ TEST 01: Get Course By Valid ID");

            // Arrange - Create test course
            _output.WriteLine("└─ Arranging: Creating test course...");
            var course = new Course
            {
                Title = "Introduction to Machine Learning",
                Description = "AI-generated ML course",
                CreatedAt = DateTime.UtcNow
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            _output.WriteLine($"   ✓ Course created with ID: {course.Id}");

            // Act
            _output.WriteLine("└─ Acting: Retrieving course...");
            var result = await _service.GetByIdAsync(course.Id);

            // Assert
            _output.WriteLine("└─ Asserting: Validating results...");
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

            _output.WriteLine("   ✓ Test PASSED - Course retrieved successfully");
        }

        [Fact]
        public async Task Test02_GetCourseById_InvalidId_ReturnsNull()
        {
            _output.WriteLine("\n▶ TEST 02: Get Course By Invalid ID");
            _output.WriteLine("└─ Testing with non-existent ID: 999");

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

            _output.WriteLine("   ✓ Test PASSED - Correctly returned null");
        }

        [Fact]
        public async Task Test03_GetCourseById_WithTopics_ReturnsFullCourse()
        {
            _output.WriteLine("\n▶ TEST 03: Get Course With Topics");

            // Arrange
            _output.WriteLine("└─ Creating course with topics...");
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
            _output.WriteLine($"   ✓ Created course ID: {course.Id} with 1 topic");

            // Act
            var result = await _service.GetByIdAsync(course.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Topics.Should().HaveCount(1);
            result.Topics.First().Title.Should().Be("Variables");
            _output.WriteLine("   ✓ Test PASSED - Course with topics retrieved successfully");
        }

        [Fact]
        public async Task Test04_GetCourseById_DeletedCourse_ReturnsNull()
        {
            _output.WriteLine("\n▶ TEST 04: Get Deleted Course");

            // Arrange
            var course = new Course
            {
                Title = "Deleted Course",
                Description = "This will be deleted"
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            var courseId = course.Id;
            _output.WriteLine($"└─ Created course ID: {courseId}");

            // Delete the course
            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            _output.WriteLine("└─ Course deleted from database");

            // Act
            var result = await _service.GetByIdAsync(courseId);

            // Assert
            result.Should().BeNull();
            _output.WriteLine("   ✓ Test PASSED - Deleted course returns null");
        }

        #endregion

        #region Test Group 2: Create Tests (4 test cases)

        [Fact]
        public async Task Test05_CreateCourse_ValidData_SavesSuccessfully()
        {
            _output.WriteLine("\n▶ TEST 05: Create Course With Valid Data");

            // Arrange
            var course = new Course
            {
                Title = "Data Science Fundamentals",
                Description = "AI-generated data science course",
                CreatedAt = DateTime.UtcNow
            };
            _output.WriteLine($"└─ Course Title: {course.Title}");

            // Act
            _output.WriteLine("└─ Creating course...");
            var result = await _service.CreateAsync(course);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeGreaterThan(0);
            result.Title.Should().Be("Data Science Fundamentals");

            var saved = await _context.Courses.FindAsync(result.Id);
            saved.Should().NotBeNull();
            _output.WriteLine($"   ✓ Course created successfully with ID: {result.Id}");

            // Verify logger
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Created course")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);

            _output.WriteLine("   ✓ Test PASSED");
        }

        [Fact]
        public async Task Test06_CreateCourse_EmptyTitle_ThrowsException()
        {
            _output.WriteLine("\n▶ TEST 06: Create Course With Empty Title (Should Throw Exception)");

            // Arrange
            var course = new Course
            {
                Title = "",
                Description = "Course without title"
            };

            // Act
            _output.WriteLine("└─ Attempting to create course with empty title...");
            Func<Task> act = async () => await _service.CreateAsync(course);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage("*Title*required*");

            _output.WriteLine("   ✓ Test PASSED - Exception thrown as expected");
        }

        [Fact]
        public async Task Test07_CreateCourse_WithTopics_SavesAllData()
        {
            _output.WriteLine("\n▶ TEST 07: Create Course With Topics");

            // Arrange
            var course = new Course
            {
                Title = "Web Development",
                Description = "Full-stack web development"
            };
            var topic1 = new Topic { Title = "HTML Basics", Course = course, OrderIndex = 1 };
            var topic2 = new Topic { Title = "CSS Styling", Course = course, OrderIndex = 2 };
            course.Topics = new List<Topic> { topic1, topic2 };
            _output.WriteLine($"└─ Course: {course.Title} with 2 topics");

            // Act
            var result = await _service.CreateAsync(course);

            // Assert
            result.Topics.Should().HaveCount(2);
            var savedCourse = await _context.Courses
                .Include(c => c.Topics)
                .FirstAsync(c => c.Id == result.Id);
            savedCourse.Topics.Should().HaveCount(2);
            _output.WriteLine($"   ✓ Course ID: {result.Id} created with {savedCourse.Topics.Count} topics");
            _output.WriteLine("   ✓ Test PASSED");
        }

        [Fact]
        public async Task Test08_CreateCourse_DuplicateTitle_AllowsCreation()
        {
            _output.WriteLine("\n▶ TEST 08: Create Courses With Duplicate Titles");

            // Arrange
            var course1 = new Course { Title = "Python Basics", Description = "First course" };
            var course2 = new Course { Title = "Python Basics", Description = "Second course" };

            // Act
            _output.WriteLine("└─ Creating first course...");
            await _service.CreateAsync(course1);
            _output.WriteLine("└─ Creating second course with same title...");
            var result = await _service.CreateAsync(course2);

            // Assert - System allows duplicate titles
            result.Should().NotBeNull();
            _context.Courses.Count(c => c.Title == "Python Basics").Should().Be(2);
            _output.WriteLine("   ✓ Both courses created successfully");
            _output.WriteLine("   ✓ Test PASSED - Duplicate titles allowed");
        }

        #endregion

        #region Test Group 3: Update Tests (4 test cases)

        [Fact]
        public async Task Test09_UpdateCourse_ValidData_UpdatesSuccessfully()
        {
            _output.WriteLine("\n▶ TEST 09: Update Course With Valid Data");

            // Arrange
            var course = new Course
            {
                Title = "Original Title",
                Description = "Original description"
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            _output.WriteLine($"└─ Original: {course.Title}");

            // Act
            course.Title = "Updated Title";
            course.Description = "Updated description";
            _output.WriteLine($"└─ Updating to: {course.Title}");
            var result = await _service.UpdateAsync(course.Id, course);

            // Assert
            result.Should().BeTrue();
            var updated = await _context.Courses.FindAsync(course.Id);
            updated!.Title.Should().Be("Updated Title");
            updated.Description.Should().Be("Updated description");
            _output.WriteLine("   ✓ Course updated successfully");

            // Verify logger
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Updated course")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);

            _output.WriteLine("   ✓ Test PASSED");
        }

        [Fact]
        public async Task Test10_UpdateCourse_NonExistentId_ReturnsFalse()
        {
            _output.WriteLine("\n▶ TEST 10: Update Non-Existent Course");

            // Arrange
            var course = new Course
            {
                Title = "Test Course",
                Description = "Test description"
            };

            // Act
            _output.WriteLine("└─ Attempting to update course with ID: 999");
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

            _output.WriteLine("   ✓ Test PASSED - Update failed as expected");
        }

        [Fact]
        public async Task Test11_UpdateCourse_EmptyTitle_ThrowsException()
        {
            _output.WriteLine("\n▶ TEST 11: Update Course With Empty Title");

            // Arrange
            var course = new Course { Title = "Valid Title", Description = "Description" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            _output.WriteLine($"└─ Original Title: {course.Title}");

            // Act
            course.Title = "";
            _output.WriteLine("└─ Attempting to update with empty title...");
            Func<Task> act = async () => await _service.UpdateAsync(course.Id, course);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>();
            _output.WriteLine("   ✓ Test PASSED - Exception thrown as expected");
        }

        [Fact]
        public async Task Test12_UpdateCourse_OnlyDescription_UpdatesCorrectly()
        {
            _output.WriteLine("\n▶ TEST 12: Update Only Course Description");

            // Arrange
            var course = new Course { Title = "Fixed Title", Description = "Old description" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            var originalTitle = course.Title;
            _output.WriteLine($"└─ Title: {originalTitle}");
            _output.WriteLine($"└─ Old Description: {course.Description}");

            // Act
            course.Description = "New description";
            _output.WriteLine($"└─ New Description: {course.Description}");
            await _service.UpdateAsync(course.Id, course);

            // Assert
            var updated = await _context.Courses.FindAsync(course.Id);
            updated!.Title.Should().Be(originalTitle);
            updated.Description.Should().Be("New description");
            _output.WriteLine("   ✓ Title unchanged, description updated");
            _output.WriteLine("   ✓ Test PASSED");
        }

        #endregion

        #region Test Group 4: Delete Tests (3 test cases)

        [Fact]
        public async Task Test13_DeleteCourse_ValidId_DeletesSuccessfully()
        {
            _output.WriteLine("\n▶ TEST 13: Delete Course With Valid ID");

            // Arrange
            var course = new Course { Title = "Course to Delete", Description = "Will be deleted" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            var courseId = course.Id;
            _output.WriteLine($"└─ Course ID to delete: {courseId}");

            // Act
            _output.WriteLine("└─ Deleting course...");
            var result = await _service.DeleteAsync(courseId);

            // Assert
            result.Should().BeTrue();
            var deleted = await _context.Courses.FindAsync(courseId);
            deleted.Should().BeNull();
            _output.WriteLine("   ✓ Course deleted successfully");

            // Verify logger
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deleted course")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);

            _output.WriteLine("   ✓ Test PASSED");
        }

        [Fact]
        public async Task Test14_DeleteCourse_NonExistentId_ReturnsFalse()
        {
            _output.WriteLine("\n▶ TEST 14: Delete Non-Existent Course");

            // Act
            _output.WriteLine("└─ Attempting to delete course with ID: 999");
            var result = await _service.DeleteAsync(999);

            // Assert
            result.Should().BeFalse();
            _output.WriteLine("   ✓ Test PASSED - Delete failed as expected");
        }

        [Fact]
        public async Task Test15_DeleteCourse_WithTopics_DeletesCascade()
        {
            _output.WriteLine("\n▶ TEST 15: Delete Course With Topics (Cascade Delete)");

            // Arrange
            var course = new Course { Title = "Course with Topics", Description = "Has topics" };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            var topic = new Topic { Title = "Topic 1", Course = course, CourseId = course.Id, OrderIndex = 1 };
            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();
            var courseId = course.Id;
            _output.WriteLine($"└─ Course ID: {courseId} with 1 topic");

            // Act
            _output.WriteLine("└─ Deleting course with topics...");
            var result = await _service.DeleteAsync(courseId);

            // Assert
            result.Should().BeTrue();
            _context.Courses.Should().NotContain(c => c.Id == courseId);
            // Topics should also be deleted due to cascade delete
            _context.Topics.Should().NotContain(t => t.CourseId == courseId);
            _output.WriteLine("   ✓ Course and topics deleted successfully");
            _output.WriteLine("   ✓ Test PASSED - Cascade delete working");
        }

        #endregion

        public void Dispose()
        {
            _output.WriteLine("\n========================================");
            _output.WriteLine("Cleaning up test environment...");
            _context.Database.EnsureDeleted();
            _context.Dispose();
            _output.WriteLine("Test environment disposed");
            _output.WriteLine("========================================\n");
        }
    }
}