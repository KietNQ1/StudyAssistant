# ⚡ Quick Team Setup Guide (Dành cho Owner)

## 📧 Danh sách Email cần thu thập:

**Mỗi thành viên team cần 2 loại email:**
1. ✉️ **GitHub email** - để add vào repository
2. ✉️ **Google email** - để add vào Google Cloud Project

### Template thu thập thông tin:

```
Thành viên 1:
- Họ tên: _______________
- GitHub email/username: _______________
- Google email: _______________
- Role: Developer / Tech Lead

Thành viên 2:
...
```

---

## 🚀 BƯỚC 1: ADD VÀO GITHUB (5 phút)

### Truy cập:
👉 https://github.com/KietNQ1/StudyAssistant/settings/access

### Làm:
1. Click **"Add people"**
2. Nhập **GitHub email/username** của thành viên
3. Chọn quyền:
   - ✅ **Write** - Cho developers
   - ✅ **Admin** - Cho tech leads
4. Click **"Add [username] to this repository"**
5. ✅ Thành viên sẽ nhận email invite

**Lặp lại cho tất cả thành viên.**

---

## ☁️ BƯỚC 2: ADD VÀO GOOGLE CLOUD (10 phút)

### Truy cập:
👉 https://console.cloud.google.com/iam-admin/iam?project=mystudyapp-475401

### Làm cho MỖI thành viên:

1. Click **"GRANT ACCESS"** (nút ở trên)

2. **Add principals:**
   - Nhập **Google email** của thành viên (VD: `member@gmail.com`)

3. **Assign roles** (chọn 4 roles sau):

   ```
   ☑ Vertex AI User
   ☑ Storage Object Admin  
   ☑ Document AI API User
   ☑ Service Account User
   ```

   **Cách chọn:**
   - Gõ tên role vào search box
   - Click role → sẽ được add vào list
   - Chọn đủ 4 roles trước khi save

4. Click **"SAVE"**

5. ✅ Xong! Thành viên đã có quyền truy cập GCP

**Lặp lại cho tất cả thành viên.**

---

## 📤 BƯỚC 3: GỬI HƯỚNG DẪN CHO TEAM

### Gửi cho mỗi thành viên:

**Subject:** Setup môi trường Study Assistant Project

**Message:**

```
Hi [Tên],

Mình đã add bạn vào:
✅ GitHub repository: https://github.com/KietNQ1/StudyAssistant
✅ Google Cloud Project: mystudyapp-475401

📖 Hướng dẫn setup đầy đủ:
https://github.com/KietNQ1/StudyAssistant/blob/main/TEAM_SETUP.md

⚡ Quick start:
1. Accept GitHub invite (check email)
2. Clone repo: git clone https://github.com/KietNQ1/StudyAssistant.git
3. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
4. Login: gcloud auth application-default login
5. Setup local: đọc TEAM_SETUP.md section 3

Có vấn đề gì contact mình nhé!

Thanks,
[Tên bạn]
```

---

## 🔐 BƯỚC 4: VERIFY ACCESS (Optional)

### Check GitHub:
👉 https://github.com/KietNQ1/StudyAssistant/settings/access
- Xem list collaborators
- Verify roles đúng

### Check GCP IAM:
👉 https://console.cloud.google.com/iam-admin/iam?project=mystudyapp-475401
- Xem list principals
- Verify mỗi người có đủ 4 roles

---

## 📋 CHECKLIST CHO BẠN (Owner)

Setup xong khi:

- [ ] Đã thu thập đủ email của tất cả thành viên
- [ ] Đã add tất cả vào GitHub repository
- [ ] Đã grant IAM roles cho tất cả trên GCP
- [ ] Đã gửi hướng dẫn setup cho team
- [ ] Đã có ít nhất 1 thành viên test được

---

## 🎯 ĐIỀU QUAN TRỌNG

### ✅ CẦN LÀM:
- Add IAM roles trên GCP cho TỪNG NGƯỜI
- Gửi TEAM_SETUP.md cho team
- Hỗ trợ troubleshoot nếu có lỗi

### ❌ KHÔNG NÊN:
- Share service account key files qua email/chat không mã hóa
- Commit secrets vào Git
- Dùng chung 1 tài khoản GCP cho cả team

---

## 🆘 SUPPORT

Nếu thành viên báo lỗi:

### "Cannot access repository"
→ Kiểm tra đã add vào GitHub chưa
→ Xem Settings → Collaborators

### "Google Cloud credentials not found"
→ Kiểm tra đã grant IAM roles chưa
→ Xem IAM → email có trong list không?
→ Thành viên cần chạy: `gcloud auth application-default login`

### "Unauthorized when calling API"
→ Check role "Vertex AI User" đã được gán chưa
→ Check role "Storage Object Admin" đã được gán chưa

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi setup xong:
- ✅ Team members clone được repo
- ✅ Chạy được `dotnet run` thành công
- ✅ Chạy được `npm run dev` thành công  
- ✅ Test upload document thành công
- ✅ Test AI features thành công

**Ready to collaborate! 🚀**

---

## 📞 CONTACT INFO

Cập nhật thông tin của bạn vào TEAM_SETUP.md:
- Tên
- Email
- Discord/Slack handle (nếu có)

Để team biết liên hệ ai khi cần support!
