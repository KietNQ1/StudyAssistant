using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace myapp.Services
{
    public class WebScraperService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<WebScraperService> _logger;

        public WebScraperService(IHttpClientFactory httpClientFactory, ILogger<WebScraperService> logger)
        {
            _httpClient = httpClientFactory.CreateClient();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            _logger = logger;
        }

        public async Task<WebPageContent> ExtractContentFromUrlAsync(string url)
        {
            try
            {
                // Validate URL
                if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                {
                    return new WebPageContent
                    {
                        Url = url,
                        Success = false,
                        Error = "Invalid URL format"
                    };
                }

                // Fetch HTML
                var response = await _httpClient.GetAsync(uri);
                
                if (!response.IsSuccessStatusCode)
                {
                    return new WebPageContent
                    {
                        Url = url,
                        Success = false,
                        Error = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}"
                    };
                }

                var html = await response.Content.ReadAsStringAsync();
                
                // Parse HTML
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(html);

                // Extract title
                var titleNode = htmlDoc.DocumentNode.SelectSingleNode("//title");
                var title = titleNode?.InnerText.Trim() ?? uri.Host;

                // Extract meta description
                var metaDesc = htmlDoc.DocumentNode.SelectSingleNode("//meta[@name='description']");
                var description = metaDesc?.GetAttributeValue("description", "") ?? "";

                // Extract main content
                var content = ExtractMainContent(htmlDoc);

                // Clean and format
                content = CleanText(content);

                return new WebPageContent
                {
                    Url = url,
                    Title = CleanText(title),
                    Description = CleanText(description),
                    Content = content,
                    Success = true,
                    ExtractedAt = DateTime.UtcNow
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"HTTP error fetching URL: {url}");
                return new WebPageContent
                {
                    Url = url,
                    Success = false,
                    Error = $"Network error: {ex.Message}"
                };
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, $"Timeout fetching URL: {url}");
                return new WebPageContent
                {
                    Url = url,
                    Success = false,
                    Error = "Request timeout (30 seconds)"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting content from URL: {url}");
                return new WebPageContent
                {
                    Url = url,
                    Success = false,
                    Error = $"Unexpected error: {ex.Message}"
                };
            }
        }

        public async Task<List<WebPageContent>> ExtractContentFromUrlsAsync(List<string> urls)
        {
            var tasks = urls.Select(url => ExtractContentFromUrlAsync(url));
            var results = await Task.WhenAll(tasks);
            return results.ToList();
        }

        private string ExtractMainContent(HtmlDocument htmlDoc)
        {
            var contentBuilder = new StringBuilder();

            // Remove unwanted elements
            var nodesToRemove = new[] { "script", "style", "nav", "footer", "header", "aside", "iframe", "noscript" };
            foreach (var tagName in nodesToRemove)
            {
                var nodes = htmlDoc.DocumentNode.SelectNodes($"//{tagName}");
                if (nodes != null)
                {
                    foreach (var node in nodes.ToList())
                    {
                        node.Remove();
                    }
                }
            }

            // Priority selectors for main content (common patterns)
            var contentSelectors = new[]
            {
                "//article",
                "//main",
                "//*[@role='main']",
                "//*[contains(@class, 'content')]",
                "//*[contains(@class, 'article')]",
                "//*[contains(@class, 'post')]",
                "//body"
            };

            HtmlNode? contentNode = null;
            foreach (var selector in contentSelectors)
            {
                contentNode = htmlDoc.DocumentNode.SelectSingleNode(selector);
                if (contentNode != null) break;
            }

            if (contentNode == null)
            {
                contentNode = htmlDoc.DocumentNode.SelectSingleNode("//body");
            }

            if (contentNode != null)
            {
                // Extract text from meaningful tags
                var meaningfulTags = new[] { "h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote", "pre", "code" };
                
                foreach (var tagName in meaningfulTags)
                {
                    var nodes = contentNode.SelectNodes($".//{tagName}");
                    if (nodes != null)
                    {
                        foreach (var node in nodes)
                        {
                            var text = node.InnerText;
                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                // Add heading markers
                                if (tagName.StartsWith("h"))
                                {
                                    contentBuilder.AppendLine($"\n## {text.Trim()}\n");
                                }
                                else
                                {
                                    contentBuilder.AppendLine(text.Trim());
                                }
                            }
                        }
                    }
                }
            }

            return contentBuilder.ToString();
        }

        private string CleanText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

            // Decode HTML entities
            text = System.Net.WebUtility.HtmlDecode(text);

            // Remove extra whitespaces
            text = Regex.Replace(text, @"\s+", " ");
            
            // Remove multiple blank lines
            text = Regex.Replace(text, @"\n\s*\n\s*\n", "\n\n");

            // Trim
            text = text.Trim();

            return text;
        }
    }

    public class WebPageContent
    {
        public required string Url { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Content { get; set; } = "";
        public bool Success { get; set; }
        public string? Error { get; set; }
        public DateTime ExtractedAt { get; set; }
    }
}
