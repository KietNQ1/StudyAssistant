# 👥 Hướng dẫn Setup cho Team

## 📋 Tổng quan
Dự án này cần setup:
1. ✅ GitHub Repository Access
2. ✅ Google Cloud Platform (GCP) Access
3. ✅ Local Development Environment
4. ✅ Secrets & Environment Variables

---

## 1️⃣ GITHUB REPOSITORY SETUP

### Bước 1: Owner (Bạn) - Invite team members

```bash
# Trên GitHub Repository: https://github.com/KietNQ1/StudyAssistant

1. Vào tab "Settings"
2. Chọn "Collaborators" (bên trái)
3. Click "Add people"
4. Nhập email GitHub của từng thành viên
5. Chọn quyền:
   - "Write" - Cho developers (có thể push code)
   - "Admin" - Cho tech leads
```

### Bước 2: Team Members - Accept & Clone

```bash
# Mỗi thành viên làm:
1. Check email và accept invitation
2. Clone repo:
   git clone https://github.com/KietNQ1/StudyAssistant.git
   cd StudyAssistant
```

---

## 2️⃣ GOOGLE CLOUD PLATFORM (GCP) SETUP

### A. Owner (Bạn) - Add Team Members to GCP Project

#### Truy cập Google Cloud Console:
👉 https://console.cloud.google.com/

#### Grant IAM Roles cho từng thành viên:

```
1. Vào project: mystudyapp-475401
2. Menu "IAM & Admin" → "IAM"
3. Click "GRANT ACCESS"
4. Nhập email Google của thành viên
5. Gán các roles sau:

✅ RECOMMENDED ROLES FOR DEVELOPERS:
   - Vertex AI User
   - Storage Object Admin
   - Document AI API User
   - Service Account User

✅ CHI TIẾT:
   Role: "Vertex AI User"
   - Cho phép call Vertex AI APIs (Gemini models)
   
   Role: "Storage Object Admin" 
   - Cho phép upload/download files từ Cloud Storage
   
   Role: "Document AI API User"
   - Cho phép process documents với Document AI
   
   Role: "Service Account User"
   - Cho phép dùng service account credentials

6. Click "SAVE"
```

#### Screenshot guide:
```
IAM → GRANT ACCESS → Add principals:
  Email: member@gmail.com
  Roles: 
    ☑ Vertex AI User
    ☑ Storage Object Admin
    ☑ Document AI API User
    ☑ Service Account User
```

---

### B. Team Members - Setup GCP Authentication

Mỗi thành viên cần setup authentication để call Google Cloud APIs:

#### Option 1: Application Default Credentials (RECOMMENDED)

```bash
# Install Google Cloud CLI
# Windows: Download from https://cloud.google.com/sdk/docs/install
# Mac: brew install google-cloud-sdk
# Linux: Follow https://cloud.google.com/sdk/docs/install

# Login với Google account đã được grant access
gcloud auth application-default login

# Chọn project
gcloud config set project mystudyapp-475401

# Verify
gcloud auth list
```

#### Option 2: Service Account Key (Alternative)

```bash
# Owner tạo service account key và share cho team:

1. GCP Console → "IAM & Admin" → "Service Accounts"
2. Chọn service account (hoặc tạo mới)
3. Tab "Keys" → "ADD KEY" → "Create new key"
4. Format: JSON
5. Download key file

# Share file này SECURELY với team (qua encrypted channel)
# KHÔNG commit file này vào Git!

# Team members set environment variable:
# Windows PowerShell:
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"

# Mac/Linux:
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

---

## 3️⃣ LOCAL DEVELOPMENT SETUP

### Prerequisites
- ✅ .NET 9 SDK
- ✅ Node.js 18+ & npm
- ✅ Git
- ✅ VS Code (hoặc Visual Studio)

### Bước 1: Clone & Install Dependencies

```bash
# Backend
cd StudyAssistant
dotnet restore
dotnet tool restore

# Frontend
cd frontend
npm install
```

### Bước 2: Setup User Secrets (QUAN TRỌNG!)

**KHÔNG commit secrets vào Git!** Mỗi developer cần setup riêng:

```bash
# Ở root folder (StudyAssistant/)
dotnet user-secrets init

# Set JWT Key (TẤT CẢ TEAM DÙNG CÙNG KEY này cho development)
dotnet user-secrets set "Jwt:Key" "StudyAssistantDevKey2024SecretAtLeast32Chars!@#"

# ⚠️ QUAN TRỌNG: Tất cả team members PHẢI dùng CHÍNH XÁC key này!
# Để token có thể hoạt động đồng bộ trên tất cả máy dev

# KHÔNG cần set Google Cloud credentials nếu dùng gcloud auth
# Google Cloud SDK tự động dùng credentials từ gcloud auth
```

### Bước 3: Database Setup

```bash
# Chạy migrations để tạo database local
dotnet ef database update

# Sẽ tạo file: myapp.db (SQLite local database)
```

### Bước 4: Run & Test

```bash
# Terminal 1 - Backend
dotnet run
# API chạy tại: https://localhost:7156

# Terminal 2 - Frontend
cd frontend
npm run dev
# Frontend chạy tại: http://localhost:5173
```

---

## 4️⃣ CONFIGURATION FILES

### Files CẦN commit vào Git:
✅ `appsettings.json` - Config template (NO secrets)
✅ `myapp.csproj` - Project file
✅ `frontend/package.json` - Dependencies
✅ `.gitignore` - Ignore sensitive files

### Files KHÔNG được commit (đã có trong .gitignore):
❌ `appsettings.Development.json` - Local overrides
❌ `myapp.db` - Local database
❌ `*.json` (service account keys)
❌ `node_modules/`
❌ `bin/`, `obj/`

### File `.gitignore` nên có:

```gitignore
## Secrets
appsettings.Development.json
*.db
*.db-shm
*.db-wal
*service-account*.json
.env

## Build
bin/
obj/
dist/
node_modules/

## IDE
.vs/
.vscode/
.idea/
```

---

## 5️⃣ GOOGLE CLOUD STORAGE BUCKET

### Owner Setup (ONE TIME):

```bash
# Bucket đã tồn tại: mystudyapp
# Đảm bảo team members có quyền truy cập:

1. GCP Console → Cloud Storage → Buckets
2. Click bucket "mystudyapp"
3. Tab "PERMISSIONS"
4. Verify team members có role "Storage Object Admin"
```

### Team Members - Test Access:

```bash
# Test upload một file:
gcloud storage cp test.txt gs://mystudyapp/test.txt

# Nếu success → Setup đúng! ✅
```

---

## 6️⃣ WORKFLOW LÀM VIỆC NHÓM

### Git Branching Strategy:

```bash
# Main branches
main          # Production code (protected)
develop       # Development integration

# Feature branches
feature/[tên-tính-năng]   # Ví dụ: feature/quiz-ai-grading
bugfix/[tên-lỗi]          # Ví dụ: bugfix/login-error
```

### Workflow:

```bash
# 1. Create branch từ develop
git checkout develop
git pull
git checkout -b feature/your-feature

# 2. Code & commit
git add .
git commit -m "Add: Your feature description"

# 3. Push lên GitHub
git push origin feature/your-feature

# 4. Tạo Pull Request trên GitHub
# - Base: develop
# - Compare: feature/your-feature
# - Assign reviewers
# - Wait for approval & merge
```

---

## 7️⃣ TESTING CHECKLIST

Mỗi developer sau khi setup xong, test các chức năng:

```bash
✅ Backend running: https://localhost:7156
✅ Frontend running: http://localhost:5173
✅ Login/Register works
✅ Upload document (test Google Cloud Storage)
✅ Document processing (test Document AI)
✅ AI Chat (test Vertex AI)
✅ Generate Quiz (test AI generation)
```

---

## 8️⃣ TROUBLESHOOTING

### Lỗi: "Google Cloud credentials not found"
```bash
# Chạy lại:
gcloud auth application-default login
```

### Lỗi: "Unauthorized" khi call API
```bash
# Check JWT token:
# Frontend phải có token từ login
# Check localStorage: có key "token" không?
```

### Lỗi: Database migration failed
```bash
# Reset database local:
rm myapp.db
dotnet ef database update
```

### Lỗi: "Project mystudyapp-475401 not found"
```bash
# Verify bạn đã được add vào project:
gcloud projects list
# Nếu không thấy → Liên hệ owner để add vào IAM
```

---

## 9️⃣ CONTACTS & SUPPORT

**Project Owner**: [Tên bạn]
- Email: [Email của bạn]
- Discord/Slack: [Handle]

**GCP Project**: mystudyapp-475401
**Repository**: https://github.com/KietNQ1/StudyAssistant

---

## 🎯 CHECKLIST SETUP HOÀN TẤT

Developer name: _______________

- [ ] Được add vào GitHub repository
- [ ] Được grant IAM roles trên GCP
- [ ] Cài đặt Google Cloud SDK
- [ ] Chạy `gcloud auth application-default login`
- [ ] Clone repository
- [ ] `dotnet restore` thành công
- [ ] `npm install` thành công
- [ ] Setup user secrets
- [ ] Database migration thành công
- [ ] Backend chạy được
- [ ] Frontend chạy được
- [ ] Test upload document thành công
- [ ] Test AI features thành công

✅ **DONE!** Ready to code! 🚀

---

## 📚 ADDITIONAL RESOURCES

- [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/)
- [React Docs](https://react.dev/)
- [Google Vertex AI](https://cloud.google.com/vertex-ai/docs)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)

**Last Updated**: [Date]
