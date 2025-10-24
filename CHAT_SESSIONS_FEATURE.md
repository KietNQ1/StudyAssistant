# Tính năng Chat Sessions Cá nhân hóa

## 📝 Tổng quan

Tính năng Chat Sessions cho phép người dùng:
- ✅ Tạo nhiều phiên chat riêng biệt
- ✅ Quản lý danh sách tất cả các phiên chat
- ✅ Truy cập lại lịch sử chat cũ
- ✅ Đổi tên phiên chat
- ✅ Xóa phiên chat không cần thiết
- ✅ Bảo mật: Chỉ chủ sở hữu mới truy cập được sessions của mình

---

## 🚀 Cách sử dụng

### 1. **Truy cập trang quản lý Chat Sessions**

Từ thanh navigation, click vào **"💬 My Chats"**

Hoặc truy cập trực tiếp: `http://localhost:5173/chat-sessions`

### 2. **Tạo Chat Session mới**

1. Click button **"New Chat"** (góc trên bên phải)
2. Nhập tiêu đề cho chat session (ví dụ: "Help with React Hooks")
3. Click **"Create Chat"**
4. Bạn sẽ được chuyển tự động đến phiên chat mới

### 3. **Xem danh sách Chat Sessions**

Trang **Chat Sessions** hiển thị:
- **Tiêu đề** của mỗi session
- **Preview tin nhắn cuối cùng** (User hoặc AI)
- **Số lượng tin nhắn** trong session
- **Thời gian** tin nhắn cuối (ví dụ: "5m ago", "2h ago", "Yesterday")
- **Course/Document** liên quan (nếu có)

### 4. **Truy cập Chat Session**

Click vào bất kỳ session nào trong danh sách để mở lại và tiếp tục trò chuyện.

### 5. **Đổi tên Chat Session**

1. Hover vào session muốn đổi tên
2. Click icon **Pencil (✏️)** bên phải
3. Nhập tên mới
4. Click **"Save"** hoặc **"Cancel"** để hủy

### 6. **Xóa Chat Session**

1. Hover vào session muốn xóa
2. Click icon **Trash (🗑️)** bên phải
3. Confirm trong popup
4. Session sẽ bị xóa vĩnh viễn (bao gồm tất cả tin nhắn)

---

## 🔧 API Endpoints (Backend)

### **GET /api/ChatSessions/my-sessions**
Lấy danh sách tất cả sessions của user hiện tại

**Authorization:** Required (JWT Token)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Help with React Hooks",
    "createdAt": "2025-10-24T10:30:00Z",
    "updatedAt": "2025-10-24T11:45:00Z",
    "lastMessageAt": "2025-10-24T11:45:00Z",
    "courseId": null,
    "courseName": null,
    "documentId": null,
    "documentName": null,
    "messageCount": 12,
    "lastMessage": {
      "role": "assistant",
      "content": "Sure, I can help you with that...",
      "createdAt": "2025-10-24T11:45:00Z"
    }
  }
]
```

### **POST /api/ChatSessions**
Tạo chat session mới

**Authorization:** Required

**Request Body:**
```json
{
  "title": "My New Chat",
  "courseId": null,
  "documentId": null
}
```

**Note:** `userId` được tự động lấy từ JWT token, không cần gửi trong body.

### **GET /api/ChatSessions/{id}**
Lấy thông tin chi tiết session (bao gồm tất cả messages)

**Authorization:** Required (chỉ owner)

### **PUT /api/ChatSessions/{id}**
Cập nhật session (ví dụ: đổi tên)

**Authorization:** Required (chỉ owner)

**Request Body:**
```json
{
  "id": 1,
  "title": "New Title"
}
```

### **DELETE /api/ChatSessions/{id}**
Xóa session

**Authorization:** Required (chỉ owner)

---

## 🔒 Bảo mật

### **Authorization Checks**

Tất cả endpoints đều có kiểm tra quyền:

1. **User Authentication**: Phải đăng nhập (JWT token)
2. **Ownership Verification**: Chỉ chủ sở hữu mới có quyền:
   - Xem session
   - Gửi tin nhắn trong session
   - Đổi tên session
   - Xóa session

**Ví dụ Code (Backend):**
```csharp
var userId = GetCurrentUserId(); // From JWT
var session = await _context.ChatSessions.FindAsync(id);

if (session.UserId != userId)
{
    return Forbid(); // HTTP 403
}
```

---

## 📊 Database Schema

### **ChatSessions Table**
```sql
CREATE TABLE ChatSessions (
    Id INT PRIMARY KEY,
    UserId INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    CourseId INT NULL,
    DocumentId INT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    LastMessageAt DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (CourseId) REFERENCES Courses(Id),
    FOREIGN KEY (DocumentId) REFERENCES Documents(Id)
);

-- Index cho performance
CREATE INDEX idx_chatsessions_userid ON ChatSessions(UserId);
CREATE INDEX idx_chatsessions_lastmessage ON ChatSessions(LastMessageAt DESC);
```

---

## 🎨 UI Components

### **ChatSessionsPage.jsx**
- Trang chính để quản lý sessions
- Features:
  - Grid layout hiển thị sessions
  - Modal tạo session mới
  - Inline editing cho rename
  - Confirmation dialog cho delete
  - Empty state khi chưa có sessions

### **ChatPage.jsx**
- Trang chat với real-time messaging
- Có button "Back to Sessions" để quay lại danh sách

---

## 🧪 Testing

### **Manual Testing Flow:**

1. **Tạo session mới:**
   ```
   ✅ Navigate to /chat-sessions
   ✅ Click "New Chat"
   ✅ Enter title "Test Session 1"
   ✅ Verify redirect to /chat/{id}
   ✅ Send a message
   ✅ Verify AI response
   ```

2. **Xem danh sách:**
   ```
   ✅ Click "Back to Sessions"
   ✅ Verify "Test Session 1" appears
   ✅ Verify message count = 2 (1 user + 1 AI)
   ✅ Verify last message preview shows
   ```

3. **Đổi tên session:**
   ```
   ✅ Click pencil icon
   ✅ Change title to "Renamed Session"
   ✅ Click Save
   ✅ Verify title updated
   ```

4. **Xóa session:**
   ```
   ✅ Click trash icon
   ✅ Confirm deletion
   ✅ Verify session removed from list
   ```

5. **Authorization test:**
   ```
   ✅ Login as User A
   ✅ Create session (note ID)
   ✅ Logout
   ✅ Login as User B
   ✅ Try to access User A's session via URL
   ✅ Verify 403 Forbidden
   ```

---

## 🚀 Deployment Notes

### **Production Checklist:**

- [ ] Đảm bảo JWT secret key được set trong production
- [ ] Test authorization với multiple users
- [ ] Kiểm tra performance với số lượng lớn sessions
- [ ] Implement pagination nếu user có > 50 sessions
- [ ] Add indexes vào database cho performance
- [ ] Test SignalR connection trong production environment
- [ ] Backup database trước khi deploy

---

## 📈 Future Enhancements

Các tính năng có thể thêm sau:

1. **Search/Filter Sessions**
   - Tìm kiếm theo title
   - Filter theo course/document
   - Filter theo date range

2. **Session Tags/Categories**
   - Tag sessions (e.g., "Work", "Study", "Personal")
   - Color coding

3. **Share Sessions**
   - Chia sẻ session với users khác (read-only hoặc collaborate)

4. **Export Chat History**
   - Export to PDF
   - Export to Text file

5. **Session Analytics**
   - Total tokens used
   - Average response time
   - Most active sessions

6. **Pin Important Sessions**
   - Pin sessions lên đầu list

7. **Archive Old Sessions**
   - Archive thay vì delete hoàn toàn

---

## 🐛 Known Issues & Solutions

### Issue 1: Sessions không sort theo thời gian
**Solution:** Backend đã sort theo `LastMessageAt DESC`

### Issue 2: Real-time không hoạt động sau reconnect
**Solution:** SignalR có `withAutomaticReconnect()`, sẽ tự động reconnect

### Issue 3: Race condition khi tạo nhiều sessions cùng lúc
**Solution:** Backend uses transactions, mỗi request độc lập

---

## 📞 Support

Nếu có vấn đề, check:
1. Console logs (F12) trong browser
2. Backend logs trong terminal
3. Network tab để xem API responses

---

## ✅ Hoàn thành!

Tính năng Chat Sessions đã hoàn chỉnh với:
- ✅ Backend API với full authorization
- ✅ Frontend UI hiện đại và responsive
- ✅ Real-time messaging integration
- ✅ Security best practices
- ✅ User-friendly experience

**Hãy test và enjoy! 🎉**
