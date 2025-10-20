# Study Assistant

## Overview
Study Assistant is a .NET and React platform that delivers an AI-powered learning companion. It ingests course documents, powers retrieval-augmented chat, generates quizzes, grades responses, and tracks study progress in real time.

## Highlighted Features
- JWT-secured authentication supporting email/password and Google OAuth.
- Course and document management backed by Google Cloud Storage plus Document AI text extraction.
- Retrieval-augmented chatbot that ranks pgvector embeddings before invoking Vertex AI (Gemini models).
- Automated quiz generation and grading pipelines powered by Vertex AI.
- Progress, streak, points, and achievement tracking via dedicated analytics endpoints.
- Hangfire background jobs for document ingestion and processing.
- SignalR hub broadcasting real-time AI responses to clients.

## Tech Stack
| Layer      | Technologies                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| Backend    | ASP.NET Core 9, Entity Framework Core, SQLite (dev) / PostgreSQL-ready, Hangfire |
| AI & Cloud | Google Vertex AI, Google Document AI, Google Cloud Storage                    |
| Realtime   | ASP.NET Core SignalR                                                          |
| Frontend   | React 19, Vite, Tailwind CSS, React Router, @microsoft/signalr               |

## Project Structure
`	ext
StudyApp/
+-- Controllers/      # REST controllers (auth, courses, chat, quizzes, analytics, etc.)
+-- Data/             # ApplicationDbContext and EF Core migrations
+-- Hubs/             # SignalR ChatHub definition
+-- Models/           # Domain entities and DTOs
+-- Services/         # Google Cloud, Vertex AI, background job services
+-- frontend/         # React client (Vite)
+-- Program.cs        # ASP.NET Core bootstrap & configuration
`

## Prerequisites
- .NET SDK 9.x
- Node.js 20+ with npm
- Google Cloud project configured with Vertex AI, Document AI, and Cloud Storage
- Google service account JSON credentials (exported via GOOGLE_APPLICATION_CREDENTIALS)

## Configuration
1. Copy ppsettings.json to ppsettings.Development.json for local overrides (git-ignored).
2. Supply configuration values through environment variables or user secrets:
   - Jwt:Key, Jwt:Issuer, Jwt:Audience
   - GoogleCloudStorage:BucketName
   - GoogleDocumentAI:{ProjectId,Location,ProcessorId}
   - GoogleVertexAI:{ProjectId,Location,Model,EmbeddingModel}
   - Google:ClientId
3. Ensure GOOGLE_APPLICATION_CREDENTIALS points to the service account JSON file used by Google SDKs.

## Database
- Default connection string targets myapp.db (SQLite) for development.
- Apply migrations:
  `ash
  dotnet ef database update
  `
- For production, swap to PostgreSQL (with pgvector enabled) and update the EF Core provider plus connection string.

## Backend Setup
`ash
cd E:\Study\Semester6\Project\StudyApp
dotnet restore
dotnet ef database update
dotnet run
`
- API listens on http://localhost:5232 (see launchSettings.json).
- Swagger UI is available when ASPNETCORE_ENVIRONMENT=Development.

## Frontend Setup
`ash
cd E:\Study\Semester6\Project\StudyApp\frontend
npm install
npm run dev
`
- Vite serves the client at http://localhost:5173 and proxies /api plus /chathub to the backend (see ite.config.js).

## Document Processing Pipeline
1. Authenticated users upload files through DocumentsController.
2. Files are stored in Google Cloud Storage.
3. A Hangfire job calls Document AI to extract raw text.
4. Text is chunked, embeddings are generated with Vertex AI, and records are saved to DocumentChunks.
5. Chat requests retrieve relevant chunks before composing grounded answers with Vertex AI.

## Real-time Chat
- Clients connect to /chathub using JWT tokens.
- User messages are persisted, AI replies are generated and cited, and SignalR broadcasts updates to session participants.
- rontend/src/pages/ChatPage.jsx handles history loading, optimistic UI, and live updates.

## Quiz Generation & Grading
- QuizzesController can synthesize quizzes from course documents or topics via Vertex AI prompts.
- QuizAttemptsController stores submissions and leverages Vertex AI for evaluating free-form answers.

## Analytics & Gamification
Controllers expose metrics for course progress, document progress, learning activities, streaks, points, achievements, notifications, and study reminders to power dashboards.

## Production Considerations
- Replace SQLite with PostgreSQL and configure durable Hangfire storage.
- Enable HTTPS, reverse proxy headers, and persistent storage for uploaded assets.
- Securely manage JWT secrets and rotate Google credentials periodically.
- Monitor Hangfire worker health and plan SignalR scaling for concurrent sessions.

## Troubleshooting
- **Chat history missing:** verify requests include a valid JWT token; unauthorized calls return 401/404.
- **Document stuck in processing:** confirm Document AI credentials and supported MIME types.
- **SignalR failures:** double-check CORS and Vite proxy configuration for /chathub.

## License
No license has been specified; treat the repository as private.
