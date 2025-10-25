# 🔍 RAG Status Check Guide

## 📋 **OVERVIEW**

Tôi đã tạo công cụ để kiểm tra xem RAG (Retrieval-Augmented Generation) đã hoạt động trong dự án chưa.

---

## 🚀 **CÁCH KIỂM TRA**

### **Method 1: Sử dụng HTML Page (ĐỀ XUẤT)**

1. **Start Backend:**
   ```bash
   cd C:\Users\Huan\Desktop\StudyAssistant
   dotnet run
   ```
   
   Backend sẽ chạy ở `http://localhost:5232`

2. **Mở RAG Check Page:**
   - Mở file: `frontend/rag-check.html` bằng browser
   - Hoặc navigate đến: `file:///C:/Users/Huan/Desktop/StudyAssistant/frontend/rag-check.html`

3. **Xem Kết Quả:**
   - Page tự động gọi API `/api/RAGCheck/status`
   - Hiển thị toàn bộ thông tin về RAG status
   - Có nút "Refresh" để check lại

### **Method 2: Sử dụng API Trực Tiếp**

1. **Start Backend**

2. **Gọi API:**
   ```bash
   # PowerShell
   Invoke-RestMethod -Uri "http://localhost:5232/api/RAGCheck/status" -Method GET
   
   # hoặc dùng browser:
   http://localhost:5232/api/RAGCheck/status
   ```

3. **Test Vector Search cho Document cụ thể:**
   ```
   http://localhost:5232/api/RAGCheck/test-vector-search/1
   ```
   (Thay `1` bằng DocumentId thực tế)

---

## 📊 **THÔNG TIN ĐƯỢC KIỂM TRA**

### **1. Documents** 📄
- ✅ Total documents uploaded
- ✅ Số documents đã processed (completed)
- ❌ Số documents failed
- ⏳ Số documents đang processing
- 📋 List 5 documents gần nhất

### **2. Document Chunks** 🧩
- ✅ Total chunks created
- ✅ Chunks có embeddings
- ❌ Chunks không có embeddings
- 📊 Phân bổ chunks theo document
- 📝 Sample chunk với embedding

### **3. Chat Sessions** 💬
- ✅ Total chat sessions
- 🔗 Sessions linked với document (để dùng RAG)
- Sessions không linked với document

### **4. RAG Status Summary** 🎯
- ✅ Documents Uploaded?
- ✅ Documents Processed?
- ✅ Chunks Created?
- ✅ Embeddings Generated?
- ✅ Chat Sessions Linked to Docs?
- **🎯 Final Verdict: RAG IS WORKING / NOT WORKING YET**

---

## ✅ **RAG HOẠT ĐỘNG KHI:**

Tất cả điều kiện sau đều TRUE:
1. ✅ **hasDocuments**: true
2. ✅ **hasProcessedDocs**: true
3. ✅ **hasChunks**: true
4. ✅ **hasEmbeddings**: true

→ **RAG IS WORKING** ✅

---

## ❌ **RAG CHƯA HOẠT ĐỘNG NẾU:**

Một trong các điều kiện FALSE:

### **Scenario 1: No Documents**
```
hasDocuments: false
→ Upload document lên course để bắt đầu
```

### **Scenario 2: Documents Not Processed**
```
hasDocuments: true
hasProcessedDocs: false
→ Check DocumentProcessorService
→ Check Google Document AI config
→ Check logs for processing errors
```

### **Scenario 3: No Chunks**
```
hasProcessedDocs: true
hasChunks: false
→ Check BackgroundJobService.ProcessDocumentAsync()
→ Verify chunking logic is running
```

### **Scenario 4: No Embeddings (CRITICAL)**
```
hasChunks: true
hasEmbeddings: false
→ Check VertexAIService.GenerateEmbeddingAsync()
→ Verify Google Vertex AI credentials
→ Check embedding model config: text-embedding-004
→ Check logs for API errors
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: Backend không chạy**
```bash
cd C:\Users\Huan\Desktop\StudyAssistant
dotnet restore
dotnet build
dotnet run
```

### **Problem: CORS Error trong browser**
Kiểm tra `Program.cs` có CORS config:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// ... sau khi app.UseRouting();
app.UseCors("AllowAll");
```

### **Problem: API trả về 404**
- Check route: `/api/RAGCheck/status` (case-sensitive!)
- Verify `RAGCheckController.cs` đã compile
- Run `dotnet build` lại

### **Problem: Database empty**
```bash
# Check database file exist
ls myapp.db

# Nếu không có, chạy migration:
dotnet ef database update
```

---

## 📈 **EXPECTED WORKFLOW**

### **Khi RAG CHƯA hoạt động:**

```
1. Upload Document
   ↓
2. BackgroundJobService processes document
   ↓
3. DocumentProcessorService extracts text (Google Document AI)
   ↓
4. Text được chia thành chunks (1000 chars mỗi chunk)
   ↓
5. Mỗi chunk → GenerateEmbeddingAsync (Google Vertex AI)
   ↓
6. Embeddings lưu vào DocumentChunks table
   ↓
7. RAG IS NOW WORKING ✅
```

### **Khi user hỏi AI:**

```
User: "React Hooks là gì?"
   ↓
1. Generate embedding cho query (fast)
   ↓
2. Vector search trong DocumentChunks:
   SELECT * FROM DocumentChunks
   ORDER BY EmbeddingVector <=> query_embedding
   LIMIT 5
   ↓
3. Get top 5 relevant chunks
   ↓
4. Build prompt: context + question
   ↓
5. Send to Gemini 2.5 Flash
   ↓
6. Return answer với citations
```

---

## 🎯 **KẾT QUẢ MẪU**

### **RAG IS WORKING ✅**
```json
{
  "documents": {
    "total": 5,
    "completed": 5,
    "failed": 0
  },
  "chunks": {
    "total": 247,
    "withEmbeddings": 247,
    "withoutEmbeddings": 0
  },
  "chatSessions": {
    "total": 8,
    "withDocument": 3
  },
  "ragStatus": {
    "hasDocuments": true,
    "hasProcessedDocs": true,
    "hasChunks": true,
    "hasEmbeddings": true,
    "isWorking": true ✅
  }
}
```

### **RAG NOT WORKING ❌**
```json
{
  "documents": {
    "total": 3,
    "completed": 0,
    "failed": 0,
    "processing": 3
  },
  "chunks": {
    "total": 0,
    "withEmbeddings": 0
  },
  "ragStatus": {
    "hasDocuments": true,
    "hasProcessedDocs": false, ❌
    "hasChunks": false, ❌
    "hasEmbeddings": false, ❌
    "isWorking": false ❌
  }
}
```

---

## 💡 **TIPS**

### **Để test RAG end-to-end:**

1. ✅ Upload document PDF lên course
2. ✅ Đợi processing hoàn thành (~30s - 2min)
3. ✅ Run RAG Check → verify embeddings exist
4. ✅ Create chat session linked với document đó
5. ✅ Ask question về nội dung trong document
6. ✅ Check response có cite correct chunks không

### **Monitoring:**

- Check logs khi upload document
- Monitor `BackgroundJobService` execution
- Watch for API errors (Document AI, Vertex AI)
- Verify database có data sau mỗi step

### **Performance:**

Nếu RAG đang hoạt động, monitor:
- Token usage (should be ~97% lower)
- Response latency (should be ~70% faster)
- Answer quality (should cite specific chunks)

---

## 🎉 **SUCCESS CRITERIA**

RAG implementation thành công khi:

✅ Upload document → Processed → Chunked → Embedded  
✅ Chat với document → Vector search → Relevant chunks retrieved  
✅ AI response dựa trên chunks (not full document)  
✅ Token usage giảm 95%+  
✅ Response có citations to source chunks  

---

## 📞 **NEXT STEPS**

1. **Run Check:**
   - Open `frontend/rag-check.html` in browser
   - Review results

2. **If RAG Not Working:**
   - Follow troubleshooting guide
   - Check logs
   - Verify configurations

3. **If RAG Working:**
   - Test end-to-end với real document
   - Monitor performance improvements
   - Consider advanced features (reranking, caching, hybrid search)

4. **Optimization:**
   - Implement reranking for better accuracy
   - Add caching layer for popular queries
   - Use contextual chunking for better coherence
   - Try hybrid search (vector + keyword)

---

**Giờ bạn có thể kiểm tra RAG status dễ dàng! 🚀**

Open `frontend/rag-check.html` và xem kết quả ngay.
