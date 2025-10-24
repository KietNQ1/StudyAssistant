using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using myapp.Controllers;
using myapp.Data;
using myapp.Models;
using myapp.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace StudyAssistant.Tests
{
    public class CoursesControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<VertexAIService> _vertexAIServiceMock;
        private readonly Mock<WebScraperService> _webScraperServiceMock;
        private readonly CoursesController _controller;

        public CoursesControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);

            // Mock configuration for VertexAIService
            var mockConfig = new Mock<Microsoft.Extensions.Configuration.IConfiguration>();
            mockConfig.Setup(c => c["GoogleVertexAI:ProjectId"]).Returns("test-project");
            mockConfig.Setup(c => c["GoogleVertexAI:Location"]).Returns("us-central1");
            mockConfig.Setup(c => c["GoogleVertexAI:Model"]).Returns("gemini-pro");
            mockConfig.Setup(c => c["GoogleVertexAI:EmbeddingModel"]).Returns("textembedding-gecko");

            // Mock HttpClientFactory for WebScraperService
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockLogger = new Mock<Microsoft.Extensions.Logging.ILogger<WebScraperService>>();

            // Mock services
            _vertexAIServiceMock = new Mock<VertexAIService>(MockBehavior.Loose, mockConfig.Object);
            _webScraperServiceMock = new Mock<WebScraperService>(MockBehavior.Loose, mockHttpClientFactory.Object, mockLogger.Object);

            _controller = new CoursesController(_context, _vertexAIServiceMock.Object, _webScraperServiceMock.Object);

            // Setup fake user for auth
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Email, "test@example.com"),
            }, "mock"));

            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = new DefaultHttpContext() { User = user }
            };
        }

        [Fact]
        public async Task Test08_GenerateCourse_ValidUrls_CreatesCourseSuccessfully()
        {
            // Arrange
            var dto = new GenerateCourseDto
            {
                Urls = new List<string> { "https://example.com/learn" },
                CourseName = "Web Development",
                UserGoal = "Learn basics"
            };

            _webScraperServiceMock.Setup(s => s.ExtractContentFromUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<WebPageContent>
                {
                    new WebPageContent
                    {
                        Url = "https://example.com/learn",
                        Success = true,
                        Title = "Learn Web Dev",
                        Content = "HTML, CSS, JavaScript basics..."
                    }
                });

            var aiResponse = @"{
                ""courseTitle"": ""Web Development Fundamentals"",
                ""courseDescription"": ""Learn web development from scratch"",
                ""topics"": [
                    {
                        ""title"": ""HTML Basics"",
                        ""description"": ""Learn HTML"",
                        ""content"": ""HTML is the foundation"",
                        ""estimatedTimeMinutes"": 30,
                        ""subtopics"": []
                    }
                ]
            }";

            _vertexAIServiceMock.Setup(s => s.GenerateCourseStructureAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(aiResponse);

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            result.Result.Should().BeOfType<CreatedAtActionResult>();
            var createdResult = result.Result as CreatedAtActionResult;
            var course = createdResult!.Value as Course;
            course.Should().NotBeNull();
            course!.Title.Should().Be("Web Development");
            _context.Courses.Should().HaveCount(1);
            _context.Topics.Should().HaveCountGreaterThan(0);
        }

        [Fact]
        public async Task Test09_GenerateCourse_WithUserGoal_IncorporatesGoalInPrompt()
        {
            // Arrange
            var dto = new GenerateCourseDto
            {
                Urls = new List<string> { "https://example.com" },
                UserGoal = "Become a full-stack developer"
            };

            _webScraperServiceMock.Setup(s => s.ExtractContentFromUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<WebPageContent>
                {
                    new WebPageContent { Url = "https://example.com", Success = true, Content = "Content" }
                });

            var aiResponse = @"{""courseTitle"": ""Full Stack Dev"", ""courseDescription"": ""Desc"", ""topics"": []}";
            _vertexAIServiceMock.Setup(s => s.GenerateCourseStructureAsync(It.IsAny<string>(), It.Is<string>(g => g.Contains("full-stack"))))
                .ReturnsAsync(aiResponse);

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            _vertexAIServiceMock.Verify(s => s.GenerateCourseStructureAsync(
                It.IsAny<string>(),
                It.Is<string>(g => g.Contains("Become a full-stack developer"))),
                Times.Once);
        }

        [Fact]
        public async Task Test10_GenerateCourse_NoContent_ReturnsBadRequest()
        {
            // Arrange
            var dto = new GenerateCourseDto
            {
                DocumentIds = new List<int>(),
                Urls = new List<string>()
            };

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
            var badRequest = result.Result as BadRequestObjectResult;
            badRequest!.Value.Should().ToString().Contains("No content available");
        }

        [Fact]
        public async Task Test11_GenerateCourse_TooManyUrls_ReturnsBadRequest()
        {
            // Arrange
            var dto = new GenerateCourseDto
            {
                Urls = Enumerable.Range(1, 11).Select(i => $"https://example{i}.com").ToList()
            };

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
            var badRequest = result.Result as BadRequestObjectResult;
            badRequest!.Value.Should().ToString().Contains("Maximum 10 URLs");
        }

        [Fact]
        public async Task Test12_GenerateCourse_Unauthorized_Returns401()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(); // No claims
            var dto = new GenerateCourseDto { Urls = new List<string> { "https://example.com" } };

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            result.Result.Should().BeOfType<UnauthorizedResult>();
        }

        [Fact]
        public async Task Test13_GenerateCourse_AIFailure_Returns500()
        {
            // Arrange
            var dto = new GenerateCourseDto { Urls = new List<string> { "https://example.com" } };

            _webScraperServiceMock.Setup(s => s.ExtractContentFromUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<WebPageContent>
                {
                    new WebPageContent { Url = "https://example.com", Success = true, Content = "Content" }
                });

            _vertexAIServiceMock.Setup(s => s.GenerateCourseStructureAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("AI service unavailable"));

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        [Fact]
        public async Task Test14_GenerateCourse_InvalidJsonFromAI_ReturnsBadRequest()
        {
            // Arrange
            var dto = new GenerateCourseDto { Urls = new List<string> { "https://example.com" } };

            _webScraperServiceMock.Setup(s => s.ExtractContentFromUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<WebPageContent>
                {
                    new WebPageContent { Url = "https://example.com", Success = true, Content = "Content" }
                });

            _vertexAIServiceMock.Setup(s => s.GenerateCourseStructureAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync("This is not JSON at all!");

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Test15_GenerateCourse_AIResponseWithMarkdown_CleansAndParses()
        {
            // Arrange
            var dto = new GenerateCourseDto { Urls = new List<string> { "https://example.com" } };

            _webScraperServiceMock.Setup(s => s.ExtractContentFromUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<WebPageContent>
                {
                    new WebPageContent { Url = "https://example.com", Success = true, Content = "Content" }
                });

            var aiResponseWithMarkdown = @"```json
            {
                ""courseTitle"": ""Test Course"",
                ""courseDescription"": ""Description"",
                ""topics"": []
            }
            ```";

            _vertexAIServiceMock.Setup(s => s.GenerateCourseStructureAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(aiResponseWithMarkdown);

            // Act
            var result = await _controller.GenerateCourseFromDocuments(dto);

            // Assert
            result.Result.Should().BeOfType<CreatedAtActionResult>();
            var course = (result.Result as CreatedAtActionResult)!.Value as Course;
            course!.Title.Should().NotBeNull();
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
