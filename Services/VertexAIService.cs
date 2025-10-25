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
            var prompt = $@"You are a **professional online course designer** experienced in creating structured, engaging, and outcome-driven courses for platforms like **Udemy** or **Coursera**.  
Your goal is to transform the provided content into a **clear, progressive, and motivational learning journey**.

Documents Content:
{documentsContent}

User's Learning Goal (if provided): {userGoal}

Please analyze the materials and create a **well-structured, Udemy-style course outline** using the following JSON format:
{{
  ""courseTitle"": ""Catchy and professional title based on the main theme of the documents"",
  ""courseDescription"": ""Short but inspiring summary (2–4 sentences) describing what students will learn, who it's for, and why it's valuable"",
  ""topics"": [
    {{
      ""title"": ""Topic 1 Title (make it student-focused, actionable)"",
      ""description"": ""Overview of what this topic covers and what students will achieve"",
      ""content"": ""Provide a detailed explanation of the course content for this topic. Include examples or illustrations when relevant to help learners better understand complex ideas."",
      ""estimatedTimeMinutes"": 30,
      ""subtopics"": [
        {{
          ""title"": ""Subtopic 1.1 Title (focused on a key skill or concept)"",
          ""description"": ""What this subtopic teaches and its relevance"",
          ""content"": ""1–3 sentences summarizing the key ideas or activities"",
          ""estimatedTimeMinutes"": 15
        }}
      ]
    }}
  ]
}}

Guidelines:
1. Create **3–7 main topics** that represent logical learning stages (e.g., Foundations → Practice → Advanced Mastery).
2. Each main topic may include **0–5 subtopics** that expand on specific areas.
3. Provide **realistic time estimates** for each topic/subtopic.
4. Ensure topics **progress logically** from beginner to advanced concepts.
5. Use **engaging, learner-centered language** — focus on what the student will gain or be able to do.
6. Summarize only the **most relevant and actionable** content from the documents.
7. Keep all text **concise and professional** (1–4 sentences per field).
8. Output **ONLY valid JSON**, no extra explanation or text.
9. **Do not truncate** — the full JSON structure must be complete.
10. **Generate the entire result in the same language as the User’s Learning Goal.**

Generate the full Udemy-style course structure now:";

            return await PredictTextAsync(prompt, temperature: 0.35, maxTokens: 8000);
        }

    }
}
