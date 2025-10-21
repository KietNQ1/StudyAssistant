using Google.Cloud.AIPlatform.V1;
using System.Threading.Tasks;
using System.Collections.Generic;
using Google.Protobuf.WellKnownTypes;
using System.Linq;
using Microsoft.Extensions.Configuration;

namespace myapp.Services
{
    public class VertexAIService
    {
        private readonly PredictionServiceClient _predictionServiceClient;
        private readonly string _textGenerationEndpoint;
        private readonly string _embeddingEndpoint;

        public VertexAIService(IConfiguration configuration)
        {
            _predictionServiceClient = PredictionServiceClient.Create();
            var projectId = configuration["GoogleVertexAI:ProjectId"] ?? throw new InvalidOperationException("ProjectId is not configured.");
            var location = configuration["GoogleVertexAI:Location"] ?? throw new InvalidOperationException("Location is not configured.");
            var textGenerationModel = configuration["GoogleVertexAI:Model"] ?? throw new InvalidOperationException("Model is not configured.");
            var embeddingModel = configuration["GoogleVertexAI:EmbeddingModel"] ?? throw new InvalidOperationException("EmbeddingModel is not configured.");

            _textGenerationEndpoint = $"projects/{projectId}/locations/{location}/publishers/google/models/{textGenerationModel}";
            _embeddingEndpoint = $"projects/{projectId}/locations/{location}/publishers/google/models/{embeddingModel}";
        }
        
        public async Task<string> PredictTextAsync(string prompt, double temperature = 0.7, int maxTokens = 2048)
        {
            var generateContentRequest = new GenerateContentRequest
            {
                Model = _textGenerationEndpoint,
                Contents =
                {
                    new Content
                    {
                        Role = "user",
                        Parts = { new Part { Text = prompt } }
                    }
                },
                GenerationConfig = new GenerationConfig
                {
                    Temperature = (float)temperature,
                    MaxOutputTokens = maxTokens
                }
            };
        
            GenerateContentResponse response = await _predictionServiceClient.GenerateContentAsync(generateContentRequest);
            
            if (response.Candidates.Any() && response.Candidates.First().Content.Parts.Any())
            {
                return response.Candidates.First().Content.Parts.First().Text;
            }

            return "No response from AI.";
        }


        public async Task<string> ChatWithDocument(string userMessage, string documentContext)
        {
            var fullPrompt = $"Context: {documentContext}\n\nQuestion: {userMessage}\n\nAnswer based on the context provided. If the answer is not in the context, state that you don't know.";
            return await PredictTextAsync(fullPrompt, 0.2);
        }

        public async Task<string> GenerateQuizQuestions(string content, string topic, int numberOfQuestions = 5, string questionType = "multiple_choice")
        {
            var prompt = $"Generate {numberOfQuestions} {questionType} questions about the following content and topic.\nContent: {content}\nTopic: {topic}\n\nFormat the output as a JSON array of objects, where each object has \"questionText\", \"options\" (for multiple_choice, array of strings), and \"correctAnswer\" (string or index). For short_answer, only \"questionText\" and \"correctAnswer\".";
            return await PredictTextAsync(prompt);
        }

        public async Task<float[]> GenerateEmbeddingAsync(string text)
        {
            var predictRequest = new PredictRequest
            {
                Endpoint = _embeddingEndpoint,
                Instances = { Google.Protobuf.WellKnownTypes.Value.ForStruct(new Struct { Fields = { { "content", Google.Protobuf.WellKnownTypes.Value.ForString(text) } } }) },
            };

            var response = await _predictionServiceClient.PredictAsync(predictRequest);
            if (response.Predictions.Any() && response.Predictions[0].StructValue.Fields.TryGetValue("embeddings", out var embeddingsValue))
            {
                if (embeddingsValue.StructValue.Fields.TryGetValue("values", out var valuesList))
                {
                    return valuesList.ListValue.Values.Select(v => (float)v.NumberValue).ToArray();
                }
            }
            return System.Array.Empty<float>();
        }

        public async Task<string> GenerateCourseStructureAsync(string documentsContent, string userGoal = "")
        {
            var prompt = $@"You are an expert educational course designer. Based on the following documents content, create a comprehensive course structure.

Documents Content:
{documentsContent}

User's Learning Goal (if provided): {userGoal}

Please analyze the content and create a well-structured course outline with the following JSON format:
{{
  ""courseTitle"": ""Suggested course title based on content"",
  ""courseDescription"": ""Brief description of what students will learn"",
  ""topics"": [
    {{
      ""title"": ""Topic 1 Title"",
      ""description"": ""What this topic covers"",
      ""content"": ""Detailed content summary for this topic"",
      ""estimatedTimeMinutes"": 30,
      ""subtopics"": [
        {{
          ""title"": ""Subtopic 1.1"",
          ""description"": ""What this subtopic covers"",
          ""content"": ""Detailed content for subtopic"",
          ""estimatedTimeMinutes"": 15
        }}
      ]
    }}
  ]
}}

Guidelines:
1. Create 3-7 main topics that logically organize the content
2. Each main topic can have 0-5 subtopics
3. Estimate realistic time needed for each topic/subtopic
4. Make sure topics flow logically from basics to advanced
5. Extract and summarize relevant content for each topic from the documents
6. Keep descriptions and content concise (1-3 sentences each)
7. Return ONLY valid JSON, no additional text or explanation
8. IMPORTANT: Complete the entire JSON structure properly - do not truncate

Generate the course structure now:";

            return await PredictTextAsync(prompt, temperature: 0.3, maxTokens: 8000);
        }
    }
}
