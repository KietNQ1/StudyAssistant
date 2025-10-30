# 🗄️ DATABASE DOCUMENTATION - Study Assistant

> **Comprehensive Database Schema Documentation**  
> **Total Tables**: 28  
> **Database Type**: SQL Server with EF Core  
> **Version**: 1.0 (2025-10-28)

---

## 📋 MỤC LỤC

1. [Tổng Quan Database](#-tổng-quan-database)
2. [ERD Diagram](#-erd-diagram)
3. [Core Entities (User & Profile)](#-core-entities)
4. [Learning Content (Courses, Topics, Documents)](#-learning-content)
5. [AI Chat System](#-ai-chat-system)
6. [Quiz & Assessment System](#-quiz--assessment-system)
7. [Progress & Analytics](#-progress--analytics)
8. [AI Configuration & Notifications](#-ai-configuration--notifications)
9. [Relationships Summary](#-relationships-summary)
10. [Database Statistics](#-database-statistics)

---

## 🎯 TỔNG QUAN DATABASE

### Mục Đích

Database **Study Assistant** được thiết kế để hỗ trợ một hệ thống học tập thông minh với:
- 📚 Quản lý khóa học và tài liệu
- 🤖 AI-powered chat với RAG (Retrieval-Augmented Generation)
- 📝 Quiz & assessment tự động
- 📊 Tracking tiến độ học tập
- 🏆 Gamification (achievements, streaks, points)
- 🔔 Notifications & reminders

### Kiến Trúc

Database được chia thành **7 nhóm chính**:

| Nhóm | Số Bảng | Mục Đích |
|------|---------|----------|
| **Core Entities** | 2 | User authentication & profiles |
| **Learning Content** | 4 | Courses, topics, documents |
| **AI Chat System** | 4 | RAG-based chat với citations |
| **Quiz System** | 6 | Assessment & testing |
| **Progress & Analytics** | 7 | Tracking & gamification |
| **AI Configuration** | 2 | AI settings & usage logs |
| **Notifications** | 2 | Reminders & notifications |

---

## 🖼️ ERD DIAGRAM

File ERD đã được tạo: **`DATABASE_ERD.puml`**

Bạn có thể render diagram này bằng:
- **PlantUML Online Editor**: http://www.plantuml.com/plantuml/uml/
- **VS Code Extension**: PlantUML extension
- **IntelliJ IDEA**: Built-in PlantUML support

---

## 👤 CORE ENTITIES

### 1. **Users** (Bảng Người Dùng)

**Mục đích**: Quản lý tài khoản người dùng, authentication, và authorization

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key tự tăng |
| `Email` | string | Required, Unique | Email đăng nhập (duy nhất) |
| `PasswordHash` | string | Required | Mật khẩu đã hash (BCrypt/Argon2) |
| `FullName` | string? | Nullable | Họ tên đầy đủ |
| `AvatarUrl` | string? | Nullable | URL ảnh đại diện |
| `Role` | string? | Nullable | Vai trò: student/teacher/admin |
| `SubscriptionTier` | string? | Nullable | Gói dịch vụ: free/premium/enterprise |
| `CreatedAt` | datetime | Default: UtcNow | Ngày tạo tài khoản |
| `UpdatedAt` | datetime | Default: UtcNow | Ngày cập nhật cuối |
| `LastLoginAt` | datetime? | Nullable | Lần đăng nhập cuối |

**Relationships**:
- 1:1 với `StudentProfiles` (một user có một profile)
- 1:N với `Courses` (một user tạo nhiều courses)
- 1:N với `ChatSessions`, `QuizAttempts`, `Notifications`, etc.

**Business Logic**:
- Email phải unique (không duplicate)
- Role mặc định: "student"
- SubscriptionTier mặc định: "free"

---

### 2. **StudentProfiles** (Hồ Sơ Học Viên)

**Mục đích**: Lưu thông tin chi tiết về học viên (preferences, learning style)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users, Unique | Liên kết với user (1:1) |
| `GradeLevel` | string? | Nullable | Cấp độ: high_school/undergrad/grad |
| `Major` | string? | Nullable | Chuyên ngành: CS/Business/Engineering |
| `LearningStyle` | string? | Nullable | Phong cách học: visual/auditory/kinesthetic |
| `Goals` | string? | Nullable | Mục tiêu học tập |
| `Preferences` | string? | Nullable | Tùy chọn khác (JSON format) |

**Relationships**:
- 1:1 với `Users` (mỗi profile thuộc một user)

**Business Logic**:
- LearningStyle dùng để AI cá nhân hóa nội dung
- Preferences lưu JSON: `{"theme": "dark", "notifications": true}`

---

## 📚 LEARNING CONTENT

### 3. **Courses** (Khóa Học)

**Mục đích**: Quản lý các khóa học do giáo viên/user tạo ra

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | Người tạo khóa học |
| `Title` | string | Required, MaxLength(255) | Tên khóa học |
| `Description` | string? | Nullable | Mô tả chi tiết |
| `Subject` | string? | MaxLength(100) | Môn học: Math/CS/History |
| `ThumbnailUrl` | string? | Nullable | Ảnh thumbnail |
| `IsPublic` | bool | Default: false | Public/private |
| `CreatedAt` | datetime | Default: UtcNow | Ngày tạo |
| `UpdatedAt` | datetime | Default: UtcNow | Ngày cập nhật |

**Relationships**:
- N:1 với `Users` (nhiều courses thuộc một user)
- 1:N với `Topics` (một course có nhiều topics)
- 1:N với `Documents` (một course có nhiều documents)
- 1:N với `Quizzes` (một course có nhiều quizzes)
- 1:1 với `AICourseSettings` (mỗi course có settings riêng)

**Business Logic**:
- IsPublic = false → chỉ creator và enrollees xem được
- DeleteBehavior.Restrict → không xóa user nếu còn courses

**Use Cases**:
- Teacher tạo course "Advanced React Development"
- Student enroll vào course → tạo `CourseProgress` record

---

### 4. **Topics** (Chủ Đề/Module)

**Mục đích**: Chia nhỏ khóa học thành các topics/modules có cấu trúc phân cấp

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `CourseId` | int | FK → Courses | Thuộc khóa học nào |
| `ParentTopicId` | int? | FK → Topics (self) | Parent topic (cấu trúc cây) |
| `Title` | string | Required, MaxLength(255) | Tên topic |
| `Description` | string? | Nullable | Mô tả ngắn |
| `Content` | string? | Nullable | Nội dung rich text |
| `OrderIndex` | int | Required | Thứ tự hiển thị (0, 1, 2...) |
| `EstimatedTimeMinutes` | int | Default: 0 | Thời gian học dự kiến (phút) |
| `IsCompleted` | bool | Default: false | User đã hoàn thành chưa |

**Relationships**:
- N:1 với `Courses` (nhiều topics thuộc một course)
- Self-referencing: N:1 với `Topics` (parent-child hierarchy)
- 1:N với `Quizzes` (mỗi topic có thể có nhiều quizzes)

**Business Logic**:
- **Hierarchical structure**: 
  - Main topic: `ParentTopicId = NULL`
  - Subtopic: `ParentTopicId = {ParentId}`
- OrderIndex dùng để sắp xếp hiển thị
- DeleteBehavior.Restrict → không xóa parent nếu còn children

**Example Structure**:
```
Course: "React Development"
├─ Topic 1: "Introduction" (ParentTopicId=NULL, OrderIndex=0)
│  ├─ Subtopic 1.1: "What is React?" (ParentTopicId=1, OrderIndex=0)
│  └─ Subtopic 1.2: "Setup Environment" (ParentTopicId=1, OrderIndex=1)
└─ Topic 2: "Hooks" (ParentTopicId=NULL, OrderIndex=1)
   ├─ Subtopic 2.1: "useState" (ParentTopicId=2, OrderIndex=0)
   └─ Subtopic 2.2: "useEffect" (ParentTopicId=2, OrderIndex=1)
```

---

### 5. **Documents** (Tài Liệu)

**Mục đích**: Lưu trữ tài liệu học tập (PDF, DOCX, videos) đã upload

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `CourseId` | int | FK → Courses | Thuộc khóa học nào |
| `Title` | string | Required, MaxLength(255) | Tên file |
| `FileType` | string? | MaxLength(50) | Loại: pdf/docx/pptx/video/audio |
| `FileUrl` | string | Required | URL lưu trữ (Azure Blob/S3) |
| `FileSize` | long | Default: 0 | Kích thước file (bytes) |
| `ProcessingStatus` | string | Default: "pending" | pending/processing/completed/failed |
| `ExtractedText` | string? | Nullable | Text đã extract (full-text search) |
| `PageCount` | int | Default: 0 | Số trang (PDF) |
| `UploadedAt` | datetime | Default: UtcNow | Ngày upload |
| `ProcessedAt` | datetime? | Nullable | Ngày xử lý xong |

**Relationships**:
- N:1 với `Courses` (nhiều documents thuộc một course)
- 1:N với `DocumentChunks` (một document chia thành nhiều chunks)
- M:N với `ChatSessions` qua `ChatSessionDocuments`

**Business Logic**:
- **Processing Pipeline**:
  1. Upload → `ProcessingStatus = "pending"`
  2. Background job → extract text → `ProcessingStatus = "processing"`
  3. Text extraction done → `ExtractedText` filled → `ProcessingStatus = "completed"`
  4. Create embeddings → save to `DocumentChunks`
- DeleteBehavior.Cascade → xóa course → xóa documents

**Use Cases**:
- User upload "React Hooks Guide.pdf"
- System extracts text → chia thành chunks → tạo embeddings
- User chat với AI → RAG system query chunks

---

### 6. **DocumentChunks** (Các Đoạn Tài Liệu)

**Mục đích**: Chia nhỏ documents thành chunks để RAG (Retrieval-Augmented Generation)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `DocumentId` | int | FK → Documents | Thuộc document nào |
| `Content` | string | Required | Nội dung text của chunk |
| `ChunkIndex` | int | Default: 0 | Thứ tự chunk (0, 1, 2...) |
| `PageNumber` | int | Default: 0 | Số trang (trong PDF) |
| `EmbeddingVector` | float[]? | vector(1536) | Vector embedding (OpenAI/Vertex) |
| `TokenCount` | int | Default: 0 | Số tokens trong chunk |
| `Metadata` | string? | Nullable | Metadata khác (JSON) |

**Relationships**:
- N:1 với `Documents` (nhiều chunks thuộc một document)
- 1:N với `MessageCitations` (chunks được cite trong chat)

**Business Logic**:
- **Chunking Strategy**:
  - Size: ~500-1000 tokens/chunk
  - Overlap: 50-100 tokens (maintain context)
- **Embedding**:
  - Model: `text-embedding-004` (Google) hoặc `text-embedding-ada-002` (OpenAI)
  - Dimension: 1536
- **Semantic Search**:
  - User question → generate query embedding
  - Cosine similarity search → top K chunks
  - Pass to AI for answer generation

**Example**:
```
Document: "React Hooks Guide.pdf" (10 pages)
├─ Chunk 0: Page 1, content="Introduction to React Hooks...", tokens=512
├─ Chunk 1: Page 1-2, content="useState is the most...", tokens=498
├─ Chunk 2: Page 2-3, content="useEffect handles side effects...", tokens=520
└─ ...
```

---

## 🤖 AI CHAT SYSTEM

### 7. **ChatSessions** (Phiên Chat)

**Mục đích**: Quản lý các phiên chat giữa user và AI assistant

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User sở hữu session |
| `CourseId` | int? | FK → Courses | Liên quan đến course nào (optional) |
| `DocumentId` | int? | FK → Documents | **DEPRECATED** (dùng ChatSessionDocuments) |
| `Title` | string | Required, MaxLength(255) | Tiêu đề session (auto-gen) |
| `CreatedAt` | datetime | Default: UtcNow | Ngày tạo |
| `UpdatedAt` | datetime | Default: UtcNow | Ngày cập nhật |
| `LastMessageAt` | datetime? | Nullable | Thời gian message cuối |

**Relationships**:
- N:1 với `Users` (nhiều sessions thuộc một user)
- N:1 với `Courses` (optional context)
- 1:N với `ChatMessages` (một session có nhiều messages)
- M:N với `Documents` qua `ChatSessionDocuments`

**Business Logic**:
- Title tự động generate từ message đầu tiên
- LastMessageAt update mỗi khi có message mới
- Multi-document support: dùng `ChatSessionDocuments` thay vì `DocumentId`

**Use Cases**:
- User tạo chat session mới → Title: "Untitled Session"
- User gửi message đầu: "What is React Hooks?"
- System auto-rename session → Title: "React Hooks Overview"

---

### 8. **ChatMessages** (Tin Nhắn Chat)

**Mục đích**: Lưu trữ từng tin nhắn trong chat session (user + AI)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `SessionId` | int | FK → ChatSessions | Thuộc session nào |
| `Role` | string | Required, MaxLength(50) | user/assistant/system |
| `Content` | string | Required | Nội dung tin nhắn |
| `TokensUsed` | int | Default: 0 | Số tokens sử dụng |
| `ModelVersion` | string? | Nullable | Model AI: gemini-1.5-flash-002 |
| `CreatedAt` | datetime | Default: UtcNow | Thời gian gửi |

**Relationships**:
- N:1 với `ChatSessions` (nhiều messages thuộc một session)
- 1:N với `MessageCitations` (một message có nhiều citations)

**Business Logic**:
- **Role**:
  - `user`: Tin nhắn từ người dùng
  - `assistant`: Tin nhắn từ AI
  - `system`: Tin nhắn hệ thống (instructions)
- TokensUsed dùng để tracking cost/usage

**Example Conversation**:
```
Message 1: Role=user, Content="What is useState?"
Message 2: Role=assistant, Content="useState is a React Hook that...", TokensUsed=245
Message 3: Role=user, Content="Show me an example"
Message 4: Role=assistant, Content="Here's an example...", TokensUsed=320
```

---

### 9. **MessageCitations** (Trích Dẫn)

**Mục đích**: Lưu references/citations của AI responses (RAG transparency)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `MessageId` | int | FK → ChatMessages | Thuộc message nào |
| `DocumentChunkId` | int? | FK → DocumentChunks | Chunk được cite |
| `DocumentId` | int? | FK → Documents | Document nguồn |
| `CitedText` | string? | Nullable | Đoạn text được trích dẫn |
| `PageNumber` | int? | Nullable | Số trang (trong PDF) |
| `Relevance` | float? | Nullable | Độ liên quan (0-1) |
| `CreatedAt` | datetime | Default: UtcNow | Ngày tạo |

**Relationships**:
- N:1 với `ChatMessages` (nhiều citations cho một message)
- N:1 với `DocumentChunks` (cite từ chunk nào)
- N:1 với `Documents` (cite từ document nào)

**Business Logic**:
- **RAG Flow**:
  1. User question → search relevant chunks
  2. Top 3-5 chunks → pass to AI prompt
  3. AI generates answer → create citations
  4. Citations show source cho user (transparency)
- Relevance score: cosine similarity (0-1)

**Example**:
```
User: "What is useState?"
AI Response: "useState is a React Hook that lets you add state..."
Citations:
  - Chunk #42 from "React Hooks Guide.pdf", Page 5
  - Chunk #43 from "React Hooks Guide.pdf", Page 6
  - Relevance: 0.92, 0.87
```

---

### 10. **ChatSessionDocuments** (Many-to-Many Table)

**Mục đích**: Liên kết chat sessions với nhiều documents (M:N relationship)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `ChatSessionId` | int | FK → ChatSessions | Session nào |
| `DocumentId` | int | FK → Documents | Document nào |
| `AddedAt` | datetime | Default: UtcNow | Thời gian thêm |

**Relationships**:
- N:1 với `ChatSessions`
- N:1 với `Documents`

**Business Logic**:
- User có thể chat với nhiều documents cùng lúc
- RAG search across tất cả documents đã link

**Use Cases**:
- User tạo chat session
- User add 3 documents: "React Basics.pdf", "Hooks Guide.pdf", "State Management.pdf"
- User hỏi → AI search trong cả 3 documents

---

## 📝 QUIZ & ASSESSMENT SYSTEM

### 11. **Quizzes** (Bài Quiz)

**Mục đích**: Quản lý các bài quiz/test trong khóa học

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `CourseId` | int | FK → Courses | Thuộc course nào |
| `TopicId` | int? | FK → Topics | Thuộc topic nào (optional) |
| `CreatedBy` | int | FK → Users | Người tạo quiz |
| `Title` | string | Required, MaxLength(255) | Tên quiz |
| `Description` | string? | Nullable | Mô tả |
| `TimeLimitMinutes` | int | Default: 0 | Thời gian làm (0 = không giới hạn) |
| `PassingScore` | int | Default: 0 | Điểm đạt (%) |
| `ShuffleQuestions` | bool | Default: false | Xáo trộn câu hỏi |
| `ShuffleOptions` | bool | Default: false | Xáo trộn đáp án |
| `IsPublished` | bool | Default: false | Published/draft |
| `CreatedAt` | datetime | Default: UtcNow | Ngày tạo |

**Relationships**:
- N:1 với `Courses` (nhiều quizzes thuộc một course)
- N:1 với `Topics` (optional)
- N:1 với `Users` (creator)
- M:N với `Questions` qua `QuizQuestions`
- 1:N với `QuizAttempts`

**Business Logic**:
- IsPublished = false → students không xem được
- PassingScore: threshold để pass (VD: 70%)
- Shuffle options tăng độ khó

---

### 12. **Questions** (Câu Hỏi)

**Mục đích**: Question bank - lưu trữ tất cả câu hỏi (manual + AI-generated)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `CourseId` | int? | FK → Courses | Liên quan đến course |
| `TopicId` | int? | FK → Topics | Liên quan đến topic |
| `DocumentId` | int? | FK → Documents | Sinh từ document nào |
| `QuestionType` | string | Required, MaxLength(50) | multiple_choice/true_false/short_answer/essay |
| `QuestionText` | string | Required | Nội dung câu hỏi |
| `DifficultyLevel` | string? | MaxLength(50) | easy/medium/hard |
| `Points` | int | Default: 1 | Điểm số |
| `Explanation` | string? | Nullable | Giải thích đáp án |
| `GeneratedByAi` | bool | Default: false | AI-generated? |
| `CreatedAt` | datetime | Default: UtcNow | Ngày tạo |

**Relationships**:
- N:1 với `Courses`, `Topics`, `Documents` (optional)
- 1:N với `QuestionOptions` (đáp án)
- M:N với `Quizzes` qua `QuizQuestions`

**Business Logic**:
- **Question Types**:
  - `multiple_choice`: có nhiều options, chọn 1
  - `true_false`: chỉ 2 options (True/False)
  - `short_answer`: nhập text ngắn
  - `essay`: nhập text dài (grading thủ công)
- GeneratedByAi = true → từ AI service

---

### 13. **QuestionOptions** (Đáp Án)

**Mục đích**: Lưu các đáp án cho multiple choice questions

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `QuestionId` | int | FK → Questions | Thuộc câu hỏi nào |
| `OptionText` | string | Required | Nội dung đáp án |
| `IsCorrect` | bool | Default: false | Đáp án đúng? |
| `OrderIndex` | int | Default: 0 | Thứ tự hiển thị |

**Relationships**:
- N:1 với `Questions` (nhiều options thuộc một question)

**Business Logic**:
- Multiple choice: 1 hoặc nhiều options có `IsCorrect = true`
- OrderIndex dùng để shuffle (nếu `ShuffleOptions = true`)

**Example**:
```
Question: "What is React?"
Options:
  - Option 1: "A JavaScript library" (IsCorrect=true)
  - Option 2: "A database" (IsCorrect=false)
  - Option 3: "A CSS framework" (IsCorrect=false)
  - Option 4: "A programming language" (IsCorrect=false)
```

---

### 14. **QuizQuestions** (Many-to-Many Table)

**Mục đích**: Liên kết quizzes với questions (M:N relationship)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `QuizId` | int | FK → Quizzes | Quiz nào |
| `QuestionId` | int | FK → Questions | Question nào |
| `OrderIndex` | int | Default: 0 | Thứ tự câu hỏi trong quiz |
| `Points` | int | Default: 1 | Điểm cho câu này (override) |

**Relationships**:
- N:1 với `Quizzes`
- N:1 với `Questions`

**Business Logic**:
- Một question có thể dùng trong nhiều quizzes
- Points có thể override default points của question

---

### 15. **QuizAttempts** (Lần Làm Quiz)

**Mục đích**: Tracking mỗi lần student làm quiz

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `QuizId` | int | FK → Quizzes | Quiz nào |
| `UserId` | int | FK → Users | Student nào |
| `StartedAt` | datetime | Default: UtcNow | Thời gian bắt đầu |
| `SubmittedAt` | datetime? | Nullable | Thời gian nộp bài |
| `TimeSpentSeconds` | int | Default: 0 | Thời gian làm (giây) |
| `Score` | double | Default: 0 | Tổng điểm đạt được |
| `TotalPoints` | double | Default: 0 | Tổng điểm tối đa |
| `Percentage` | double | Default: 0 | Phần trăm (%) |
| `Status` | string | Required, MaxLength(50) | in_progress/completed/abandoned |

**Relationships**:
- N:1 với `Quizzes` (nhiều attempts cho một quiz)
- N:1 với `Users` (student)
- 1:N với `QuizAnswers` (answers trong attempt này)

**Business Logic**:
- **Flow**:
  1. Student start quiz → create attempt với `Status = "in_progress"`
  2. Student answer questions → save to `QuizAnswers`
  3. Student submit → calculate score → `Status = "completed"`
- Percentage = (Score / TotalPoints) × 100
- Allow multiple attempts (không giới hạn)

---

### 16. **QuizAnswers** (Câu Trả Lời)

**Mục đích**: Lưu từng câu trả lời của student trong một attempt

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `AttemptId` | int | FK → QuizAttempts | Thuộc attempt nào |
| `QuestionId` | int | FK → Questions | Câu hỏi nào |
| `SelectedOptionId` | int? | FK → QuestionOptions | Đáp án đã chọn (MCQ) |
| `UserAnswer` | string? | Nullable | Text answer (short/essay) |
| `IsCorrect` | bool | Default: false | Trả lời đúng? |
| `PointsAwarded` | double | Default: 0 | Điểm được cộng |
| `TimeSpentSeconds` | int | Default: 0 | Thời gian trả lời câu này |
| `AnsweredAt` | datetime? | Nullable | Thời gian trả lời |

**Relationships**:
- N:1 với `QuizAttempts`
- N:1 với `Questions`
- N:1 với `QuestionOptions` (optional, cho MCQ)

**Business Logic**:
- **MCQ**: lưu `SelectedOptionId`, check với `IsCorrect` của option
- **Short answer/Essay**: lưu `UserAnswer`, grading manual hoặc AI
- Auto-calculate `IsCorrect` và `PointsAwarded`

---

## 📊 PROGRESS & ANALYTICS

### 17. **CourseProgresses** (Tiến Độ Khóa Học)

**Mục đích**: Tracking tiến độ của student trong từng khóa học

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | Student nào |
| `CourseId` | int | FK → Courses | Khóa học nào |
| `EnrollmentDate` | datetime | Default: UtcNow | Ngày enroll |
| `LastAccessedAt` | datetime? | Nullable | Lần truy cập cuối |
| `CompletionPercentage` | double | Default: 0 | % hoàn thành (0-100) |
| `TimeSpentMinutes` | int | Default: 0 | Tổng thời gian học (phút) |
| `Status` | string | Required, MaxLength(50) | not_started/in_progress/completed |

**Relationships**:
- N:1 với `Users`
- N:1 với `Courses`

**Business Logic**:
- **Enrollment**: Student enroll → tạo record mới
- **Completion Calculation**:
  - Count completed topics / total topics
  - Update CompletionPercentage
- Status = "completed" khi CompletionPercentage = 100%

---

### 18. **DocumentProgresses** (Tiến Độ Tài Liệu)

**Mục đích**: Tracking đến trang nào, đọc bao nhiêu % document

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | Student nào |
| `DocumentId` | int | FK → Documents | Document nào |
| `LastPageViewed` | int | Default: 0 | Trang cuối xem |
| `CompletionPercentage` | double | Default: 0 | % đã đọc |
| `TimeSpentMinutes` | int | Default: 0 | Thời gian đọc (phút) |
| `LastAccessedAt` | datetime? | Nullable | Lần xem cuối |

**Relationships**:
- N:1 với `Users`
- N:1 với `Documents`

**Business Logic**:
- Update `LastPageViewed` khi user scroll/navigate pages
- CompletionPercentage = (LastPageViewed / TotalPages) × 100

---

### 19. **LearningActivities** (Hoạt Động Học Tập)

**Mục đích**: Log tất cả hoạt động học tập (view, read, quiz) → analytics

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User nào |
| `CourseId` | int? | FK → Courses | Liên quan course |
| `DocumentId` | int? | FK → Documents | Liên quan document |
| `QuizId` | int? | FK → Quizzes | Liên quan quiz |
| `ActivityType` | string | Required, MaxLength(50) | view_course/read_document/take_quiz/chat |
| `Duration` | int | Default: 0 | Thời lượng (giây) |
| `PointsEarned` | int | Default: 0 | Điểm kiếm được |
| `CreatedAt` | datetime | Default: UtcNow | Thời gian hoạt động |

**Relationships**:
- N:1 với `Users`
- N:1 với `Courses`, `Documents`, `Quizzes` (optional)

**Business Logic**:
- Log mọi interaction để analytics
- Calculate daily/weekly active users
- Gamification: earn points từ activities

**Use Cases**:
- User xem course → log "view_course", Duration=300s
- User đọc document → log "read_document", Duration=600s
- User làm quiz → log "take_quiz", PointsEarned=85

---

### 20. **UserStreaks** (Chuỗi Học Liên Tiếp)

**Mục đích**: Gamification - tracking streak (học liên tục mỗi ngày)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users, Unique | User nào (1:1) |
| `CurrentStreak` | int | Default: 0 | Streak hiện tại (ngày) |
| `LongestStreak` | int | Default: 0 | Streak dài nhất |
| `LastActivityDate` | datetime? | Nullable | Ngày hoạt động cuối |

**Relationships**:
- 1:1 với `Users` (mỗi user có một streak record)

**Business Logic**:
- **Streak calculation**:
  - User hoạt động hôm nay → check LastActivityDate
  - Nếu LastActivityDate = yesterday → CurrentStreak++
  - Nếu LastActivityDate < yesterday → Reset CurrentStreak = 1
- Update LongestStreak nếu CurrentStreak > LongestStreak

**Example**:
```
Day 1: Activity → CurrentStreak = 1
Day 2: Activity → CurrentStreak = 2
Day 3: No activity → CurrentStreak = 2 (unchanged)
Day 4: Activity → CurrentStreak = 1 (reset vì missed Day 3)
```

---

### 21. **UserPoints** (Điểm Thưởng)

**Mục đích**: Gamification - tracking points từ các hoạt động

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User nào |
| `CourseId` | int? | FK → Courses | Từ course nào (optional) |
| `Points` | int | Default: 0 | Số điểm |
| `Source` | string | Required, MaxLength(50) | quiz_completed/course_completed/streak |
| `Description` | string? | Nullable | Mô tả chi tiết |
| `CreatedAt` | datetime | Default: UtcNow | Ngày kiếm điểm |

**Relationships**:
- N:1 với `Users`
- N:1 với `Courses` (optional)

**Business Logic**:
- **Point sources**:
  - Quiz completed: 10-100 points (based on score)
  - Course completed: 500 points
  - Daily streak: 5 points
  - Read document: 10 points
- Tính tổng điểm: `SUM(Points) WHERE UserId = X`

---

### 22. **Achievements** (Thành Tựu)

**Mục đích**: Master list các achievements có thể unlock

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `Name` | string | Required, MaxLength(255) | Tên achievement |
| `Description` | string? | Nullable | Mô tả |
| `IconUrl` | string? | Nullable | Icon/badge URL |
| `Category` | string? | MaxLength(50) | streak/quiz/course |
| `PointsRequired` | int | Default: 0 | Điểm cần để unlock |

**Relationships**:
- 1:N với `UserAchievements` (nhiều users unlock)

**Business Logic**:
- **Examples**:
  - "First Steps" (Complete first course) - 100 points
  - "Quiz Master" (Score 100% on 10 quizzes) - 500 points
  - "7-Day Streak" (Study 7 days in a row) - 200 points
  - "Knowledge Seeker" (Read 50 documents) - 300 points

---

### 23. **UserAchievements** (Thành Tựu Đã Mở)

**Mục đích**: Tracking achievements mà user đã unlock

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User nào |
| `AchievementId` | int | FK → Achievements | Achievement nào |
| `UnlockedAt` | datetime | Default: UtcNow | Ngày unlock |

**Relationships**:
- N:1 với `Users`
- N:1 với `Achievements`

**Business Logic**:
- Check conditions → unlock achievement
- Tạo notification cho user

---

### 24. **SkillMasteries** (Kỹ Năng Thành Thạo)

**Mục đích**: Tracking skill proficiency của user trong từng lĩnh vực

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User nào |
| `CourseId` | int? | FK → Courses | Từ course nào (optional) |
| `SkillName` | string | Required, MaxLength(255) | Tên skill: React/Python/Math |
| `MasteryLevel` | string? | MaxLength(50) | beginner/intermediate/advanced/expert |
| `MasteryPercentage` | double | Default: 0 | % thành thạo (0-100) |
| `PracticeCount` | int | Default: 0 | Số lần practice |
| `LastPracticedAt` | datetime? | Nullable | Lần practice cuối |

**Relationships**:
- N:1 với `Users`
- N:1 với `Courses` (optional)

**Business Logic**:
- **Level progression**:
  - 0-25%: beginner
  - 26-50%: intermediate
  - 51-75%: advanced
  - 76-100%: expert
- Update dựa trên quiz scores, course completion

---

## ⚙️ AI CONFIGURATION & NOTIFICATIONS

### 25. **AICourseSettings** (Cấu Hình AI)

**Mục đích**: Cấu hình AI features cho từng khóa học

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `CourseId` | int | FK → Courses, Unique | Course nào (1:1) |
| `EnableAiChat` | bool | Default: true | Bật AI chat? |
| `EnableAiQuiz` | bool | Default: true | Bật AI quiz generation? |
| `EnableAiSummary` | bool | Default: true | Bật AI summary? |
| `Model` | string? | MaxLength(100) | Model: gemini-1.5-flash-002 |
| `Temperature` | float? | Nullable | Temperature (0-1) |
| `MaxTokens` | int? | Nullable | Max tokens per request |
| `CustomInstructions` | string? | Nullable | Custom system prompt |

**Relationships**:
- 1:1 với `Courses` (mỗi course có một settings)

**Business Logic**:
- Teacher có thể tùy chỉnh AI behavior
- Default: enable all features

---

### 26. **AIUsageLogs** (Log Sử Dụng AI)

**Mục đích**: Tracking AI usage (tokens, cost) → billing & analytics

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User nào |
| `CourseId` | int? | FK → Courses | Trong course nào |
| `Feature` | string | Required, MaxLength(50) | chat/quiz_generation/summary |
| `Model` | string? | MaxLength(100) | Model đã dùng |
| `TokensUsed` | int | Default: 0 | Số tokens |
| `Cost` | decimal? | Nullable | Chi phí ($) |
| `CreatedAt` | datetime | Default: UtcNow | Thời gian |

**Relationships**:
- N:1 với `Users`
- N:1 với `Courses` (optional)

**Business Logic**:
- Log mỗi AI request
- Calculate monthly cost
- Billing cho premium users

---

### 27. **Notifications** (Thông Báo)

**Mục đích**: Push notifications cho users (achievements, reminders, etc.)

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User nào |
| `Type` | string | Required, MaxLength(50) | achievement/reminder/announcement |
| `Title` | string | Required, MaxLength(255) | Tiêu đề |
| `Message` | string? | Nullable | Nội dung |
| `IsRead` | bool | Default: false | Đã đọc chưa |
| `ReadAt` | datetime? | Nullable | Thời gian đọc |
| `CreatedAt` | datetime | Default: UtcNow | Ngày tạo |

**Relationships**:
- N:1 với `Users`

**Business Logic**:
- **Notification types**:
  - `achievement`: "You unlocked 'Quiz Master'!"
  - `reminder`: "Time to study React Hooks"
  - `announcement`: "New course available"

---

### 28. **StudyReminders** (Nhắc Nhở Học Tập)

**Mục đích**: Schedule reminders cho users

**Columns**:

| Column | Type | Constraints | Mô Tả |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | Primary key |
| `UserId` | int | FK → Users | User nào |
| `CourseId` | int? | FK → Courses | Liên quan course nào |
| `RemindAt` | datetime | Required | Thời gian nhắc |
| `Message` | string? | Nullable | Nội dung nhắc |
| `IsActive` | bool | Default: true | Còn active? |
| `IsSent` | bool | Default: false | Đã gửi chưa |

**Relationships**:
- N:1 với `Users`
- N:1 với `Courses` (optional)

**Business Logic**:
- Background job check `RemindAt`
- Send notification → `IsSent = true`
- User có thể disable: `IsActive = false`

---

## 🔗 RELATIONSHIPS SUMMARY

### **User-Centric Relationships**

```
Users (1)
├─ 1:1 → StudentProfiles
├─ 1:N → Courses (creates)
├─ 1:N → ChatSessions (owns)
├─ 1:N → QuizAttempts (takes)
├─ 1:N → CourseProgresses (tracks)
├─ 1:N → LearningActivities (performs)
├─ 1:1 → UserStreaks
├─ 1:N → UserPoints (earns)
├─ 1:N → UserAchievements (unlocks)
├─ 1:N → SkillMasteries (masters)
├─ 1:N → Notifications (receives)
├─ 1:N → StudyReminders (sets)
└─ 1:N → AIUsageLogs (uses AI)
```

### **Course-Centric Relationships**

```
Courses (1)
├─ 1:N → Topics (contains)
├─ 1:N → Documents (has)
├─ 1:N → Quizzes (includes)
├─ 1:N → ChatSessions (context)
├─ 1:N → CourseProgresses (tracked)
├─ 1:N → LearningActivities (logged)
├─ 1:N → UserPoints (source)
├─ 1:N → SkillMasteries (teaches)
├─ 1:1 → AICourseSettings
└─ 1:N → AIUsageLogs
```

### **Many-to-Many Relationships**

| Table 1 | Junction Table | Table 2 |
|---------|----------------|---------|
| ChatSessions | ChatSessionDocuments | Documents |
| Quizzes | QuizQuestions | Questions |
| Users | UserAchievements | Achievements |

### **Self-Referencing Relationships**

- **Topics**: `ParentTopicId → Id` (hierarchical structure)

---

## 📈 DATABASE STATISTICS

### **Total Entities**: 28 tables

### **Tables by Category**:

| Category | Tables | % |
|----------|--------|---|
| Core | 2 | 7% |
| Learning Content | 4 | 14% |
| AI Chat | 4 | 14% |
| Quiz System | 6 | 21% |
| Progress & Analytics | 7 | 25% |
| AI Config | 2 | 7% |
| Notifications | 2 | 7% |
| Junction Tables | 3 | 11% |

### **Relationship Types**:

- **1:1**: 3 relationships (Users-StudentProfiles, Users-UserStreaks, Courses-AICourseSettings)
- **1:N**: ~50 relationships
- **M:N**: 3 relationships (via junction tables)
- **Self-ref**: 1 (Topics hierarchy)

### **Key Features**:

✅ **RAG Support**: DocumentChunks with vector embeddings  
✅ **Gamification**: Streaks, Points, Achievements  
✅ **AI Integration**: Chat, Quiz generation, Cost tracking  
✅ **Analytics**: Comprehensive progress tracking  
✅ **Scalability**: Normalized design, indexed foreign keys  

---

## 🎓 CONCLUSION


### **Use Cases Supported**:
- 📚 Online course platform (Udemy-style)
- 🤖 AI-powered study assistant
- 📊 Learning analytics dashboard
- 🏆 Gamified learning experience
- 💬 Document-based Q&A system (RAG)

### **Technology Highlights**:
- **Vector Search**: DocumentChunks với embeddings
- **SignalR**: Real-time chat
- **Background Jobs**: Document processing, reminders
- **Multi-tenancy**: User-based isolation

---

**Document Version**: 1.0  
**Last Updated**: October 28, 2025  
**Author**: Nguyễn Quang Kiệt  
**Database**: SQL Server + EF Core 8.0

*End of Database Documentation*
