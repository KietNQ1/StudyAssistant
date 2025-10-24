using Xunit;
using Moq;
using Moq.Protected;
using FluentAssertions;
using myapp.Services;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace StudyAssistant.Tests
{
    public class WebScraperServiceTests
    {
        private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
        private readonly Mock<ILogger<WebScraperService>> _loggerMock;
        private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;

        public WebScraperServiceTests()
        {
            _httpClientFactoryMock = new Mock<IHttpClientFactory>();
            _loggerMock = new Mock<ILogger<WebScraperService>>();
            _httpMessageHandlerMock = new Mock<HttpMessageHandler>();
        }

        [Fact]
        public async Task Test01_ExtractContent_ValidUrl_ReturnsSuccessWithContent()
        {
            // Arrange
            var htmlContent = "<html><head><title>Test Page</title></head><body><p>Test content</p></body></html>";
            SetupHttpClient(HttpStatusCode.OK, htmlContent);
            var service = new WebScraperService(_httpClientFactoryMock.Object, _loggerMock.Object);

            // Act
            var result = await service.ExtractContentFromUrlAsync("https://example.com");

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Title.Should().Contain("Test Page");
            result.Content.Should().NotBeEmpty();
        }

        [Fact]
        public async Task Test02_ExtractContent_MultipleUrls_ProcessesAllUrls()
        {
            // Arrange
            var htmlContent = "<html><body><p>Content</p></body></html>";
            SetupHttpClient(HttpStatusCode.OK, htmlContent);
            var service = new WebScraperService(_httpClientFactoryMock.Object, _loggerMock.Object);
            var urls = new List<string> { "https://example1.com", "https://example2.com", "https://example3.com" };

            // Act
            var results = await service.ExtractContentFromUrlsAsync(urls);

            // Assert
            results.Should().HaveCount(3);
            results.Should().OnlyContain(r => r.Success == true);
        }

        [Fact]
        public async Task Test03_ExtractContent_UrlWithMetadata_ExtractsTitleAndDescription()
        {
            // Arrange
            var htmlWithMeta = @"<html>
                <head>
                    <title>My Article</title>
                    <meta name='description' description='This is a great article' />
                </head>
                <body><p>Article content</p></body>
            </html>";
            SetupHttpClient(HttpStatusCode.OK, htmlWithMeta);
            var service = new WebScraperService(_httpClientFactoryMock.Object, _loggerMock.Object);

            // Act
            var result = await service.ExtractContentFromUrlAsync("https://example.com/article");

            // Assert
            result.Title.Should().Contain("My Article");
            result.Description.Should().NotBeEmpty();
        }

        [Fact]
        public async Task Test04_ExtractContent_InvalidUrl_ReturnsErrorResult()
        {
            // Arrange
            SetupHttpClient(HttpStatusCode.OK, "");
            var service = new WebScraperService(_httpClientFactoryMock.Object, _loggerMock.Object);

            // Act
            var result = await service.ExtractContentFromUrlAsync("not-a-valid-url");

            // Assert
            result.Success.Should().BeFalse();
            result.Error.Should().Contain("Invalid URL format");
        }

        [Fact]
        public async Task Test05_ExtractContent_Http404_ReturnsErrorWithStatusCode()
        {
            // Arrange
            SetupHttpClient(HttpStatusCode.NotFound, "");
            var service = new WebScraperService(_httpClientFactoryMock.Object, _loggerMock.Object);

            // Act
            var result = await service.ExtractContentFromUrlAsync("https://example.com/notfound");

            // Assert
            result.Success.Should().BeFalse();
            result.Error.Should().Contain("404");
        }

        [Fact]
        public async Task Test06_ExtractContent_Timeout_ReturnsTimeoutError()
        {
            // Arrange
            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ThrowsAsync(new TaskCanceledException("Timeout"));

            var httpClient = new HttpClient(_httpMessageHandlerMock.Object);
            _httpClientFactoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
            var service = new WebScraperService(_httpClientFactoryMock.Object, _loggerMock.Object);

            // Act
            var result = await service.ExtractContentFromUrlAsync("https://example.com/slow");

            // Assert
            result.Success.Should().BeFalse();
            result.Error.Should().Contain("timeout");
        }

        [Fact]
        public async Task Test07_ExtractContent_NetworkError_HandlesException()
        {
            // Arrange
            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ThrowsAsync(new HttpRequestException("Network error"));

            var httpClient = new HttpClient(_httpMessageHandlerMock.Object);
            _httpClientFactoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
            var service = new WebScraperService(_httpClientFactoryMock.Object, _loggerMock.Object);

            // Act
            var result = await service.ExtractContentFromUrlAsync("https://example.com/error");

            // Assert
            result.Success.Should().BeFalse();
            result.Error.Should().Contain("Network error");
        }

        // Helper method
        private void SetupHttpClient(HttpStatusCode statusCode, string content)
        {
            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = statusCode,
                    Content = new StringContent(content)
                });

            var httpClient = new HttpClient(_httpMessageHandlerMock.Object);
            _httpClientFactoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
        }
    }
}
