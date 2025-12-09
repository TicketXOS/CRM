# Hướng Dẫn Cập Nhật Code GitHub

## 📋 Mục Lục
- [Phương pháp 1：Cập nhật thủ công](#phương-pháp-1cập-nhật-thủ-công)
- [Phương pháp 2：Sử dụng script cập nhật](#phương-pháp-2sử-dụng-script-cập-nhật)
- [Phương pháp 3：Kế hoạch tác vụ Bảo Tháp](#phương-pháp-3kế-hoạch-tác-vụ-bảo-tháp)
- [Câu hỏi thường gặp](#câu-hỏi-thường-gặp)

---

## Phương Pháp 1：Cập Nhật Thủ Công

### Tình Huống Áp Dụng
- Lần đầu cập nhật
- Cần xem quá trình cập nhật chi tiết
- Gặp vấn đề cần kiểm tra thủ công

### Các Bước Thao Tác

#### 1. Mở terminal Bảo Tháp
Ở góc trên bên phải bảng điều khiển Bảo Tháp click nút **"Terminal"**

#### 2. Vào thư mục dự án
```bash
cd /www/wwwroot/CRM
```

#### 3. Xem phiên bản hiện tại
```bash
git log --oneline -1
```

#### 4. Pull code mới nhất
```bash
git pull origin main
```

#### 5. Xem nội dung cập nhật
```bash
git log --oneline -5
```

#### 6. Cập nhật dependencies
```bash
# Cập nhật dependencies frontend
npm install

# Cập nhật dependencies backend
cd backend
npm install
cd ..
```

#### 7. Build lại frontend
```bash
npm run build
```

#### 8. Khởi động lại dịch vụ backend
```bash
pm2 restart crm-backend
```

#### 9. Xác minh cập nhật
```bash
# Xem trạng thái dịch vụ
pm2 list

# Xem log
pm2 logs crm-backend --lines 20
```

---

## Phương Pháp 2：Sử Dụng Script Cập Nhật

### Tình Huống Áp Dụng
- Cập nhật hàng ngày
- Cập nhật nhanh
- Cập nhật tự động

### Thiết Lập Lần Đầu

#### 1. Upload script cập nhật
Upload file `update.sh` lên thư mục `/www/wwwroot/CRM`

#### 2. Cấp quyền thực thi cho script
```bash
cd /www/wwwroot/CRM
chmod +x update.sh
```

### Cách Sử Dụng

#### Mỗi lần cập nhật chỉ cần thực thi：
```bash
cd /www/wwwroot/CRM
./update.sh
```

### Chức Năng Script
- ✅ Tự động backup file cấu hình
- ✅ Pull code mới nhất
- ✅ Khôi phục file cấu hình
- ✅ Cập nhật dependencies
- ✅ Build frontend
- ✅ Khởi động lại backend
- ✅ Hiển thị log cập nhật

---

## Phương Pháp 3：Kế Hoạch Tác Vụ Bảo Tháp

### Tình Huống Áp Dụng
- Cập nhật tự động định kỳ
- Không cần thao tác thủ công

### Các Bước Thiết Lập

#### 1. Vào kế hoạch tác vụ
Trong bảng điều khiển Bảo Tháp，click bên trái **"Kế hoạch tác vụ"**

#### 2. Thêm tác vụ
- **Loại tác vụ**：Shell script
- **Tên tác vụ**：Cập nhật code CRM
- **Chu kỳ thực thi**：Chọn theo nhu cầu（ví dụ：2 giờ sáng mỗi ngày）
- **Nội dung script**：
```bash
#!/bin/bash
cd /www/wwwroot/CRM
./update.sh >> /www/wwwroot/CRM/update.log 2>&1
```

#### 3. Lưu và test
Click nút **"Thực thi"** để test xem tác vụ có bình thường không

---

## 🔍 Kiểm Tra Trước Khi Cập Nhật

### 1. Xem nội dung cập nhật từ xa
```bash
cd /www/wwwroot/CRM
git fetch origin
git log HEAD..origin/main --oneline
```

### 2. Xem sửa đổi local
```bash
git status
```

### 3. Backup dữ liệu quan trọng
```bash
# Backup database
mysqldump -u tên_người_dùng -p tên_database > backup_$(date +%Y%m%d).sql

# Backup file cấu hình
cp backend/.env backend/.env.backup
```

---

## 🔄 Xác Minh Sau Khi Cập Nhật

### 1. Kiểm tra trạng thái dịch vụ
```bash
pm2 list
```
Nên thấy trạng thái `crm-backend` là `online`

### 2. Xem log
```bash
pm2 logs crm-backend --lines 50
```
Kiểm tra xem có thông tin lỗi không

### 3. Truy cập website
Truy cập website của bạn trong trình duyệt，test xem chức năng có bình thường không

### 4. Test chức năng quan trọng
- ✅ Chức năng đăng nhập
- ✅ Truy vấn dữ liệu
- ✅ Thêm dữ liệu
- ✅ Sửa đổi dữ liệu

---

## ⚠️ Câu Hỏi Thường Gặp

### Vấn Đề 1：Xung Đột Code

**Hiện tượng**：
```
error: Your local changes to the following files would be overwritten by merge
```

**Giải pháp**：
```bash
# Phương án A：Lưu sửa đổi local
git stash
git pull origin main
git stash pop

# Phương án B：Bỏ sửa đổi local
git reset --hard
git pull origin main

# Phương án C：Xem file xung đột
git status
# Xử lý thủ công file xung đột
```

---

### Vấn Đề 2：Cài Đặt Dependencies Thất Bại

**Hiện tượng**：
```
npm ERR! code ELIFECYCLE
```

**Giải pháp**：
```bash
# Xóa cache
npm cache clean --force

# Xóa node_modules
rm -rf node_modules
rm -rf backend/node_modules

# Cài đặt lại
npm install
cd backend && npm install
```

---

### Vấn Đề 3：Build Thất Bại

**Hiện tượng**：
```
Build failed with errors
```

**Giải pháp**：
```bash
# Xem lỗi chi tiết
npm run build

# Kiểm tra phiên bản Node.js
node -v
# Nên là 16.x hoặc cao hơn

# Kiểm tra dung lượng ổ đĩa
df -h
```

---

### Vấn Đề 4：PM2 Khởi Động Lại Thất Bại

**Hiện tượng**：
```
[PM2] Process not found
```

**Giải pháp**：
```bash
# Xem tất cả process
pm2 list

# Xóa process cũ
pm2 delete crm-backend

# Khởi động lại
cd /www/wwwroot/CRM/backend
pm2 start npm --name "crm-backend" -- start

# Lưu cấu hình
pm2 save
```

---

### Vấn Đề 5：Sau Khi Cập Nhật Trang Trắng

**Nguyên nhân có thể**：
- Build frontend thất bại
- Cấu hình Nginx sai
- Vấn đề cache

**Giải pháp**：
```bash
# 1. Kiểm tra file build
ls -la /www/wwwroot/CRM/dist

# 2. Build lại
cd /www/wwwroot/CRM
npm run build

# 3. Xóa cache trình duyệt
# Nhấn Ctrl + Shift + Delete

# 4. Khởi động lại Nginx
systemctl restart nginx
```

---

## 🔙 Rollback Về Phiên Bản Trước

### Nếu sau khi cập nhật có vấn đề，có thể rollback：

```bash
# 1. Xem lịch sử commit
cd /www/wwwroot/CRM
git log --oneline -10

# 2. Rollback về phiên bản chỉ định
git reset --hard CommitID

# 3. Build lại và khởi động lại
npm install
npm run build
cd backend && npm install
pm2 restart crm-backend
```

---

## 📊 Xem Log Cập Nhật

### Xem cập nhật gần đây
```bash
cd /www/wwwroot/CRM
git log --oneline -10
```

### Xem nội dung cập nhật chi tiết
```bash
git log -p -2
```

### Xem lịch sử sửa đổi của một file
```bash
git log --follow -- đường_dẫn_file
```

---

## 🔐 Khuyến Nghị Bảo Mật

### 1. Backup trước khi cập nhật
- Backup database
- Backup file cấu hình
- Backup dữ liệu quan trọng

### 2. Test ở môi trường test trước
- Nếu có môi trường test，cập nhật ở môi trường test trước
- Xác nhận không có vấn đề rồi mới cập nhật môi trường production

### 3. Chọn thời gian cập nhật phù hợp
- Tránh giờ cao điểm nghiệp vụ
- Khuyến nghị cập nhật vào lúc sáng sớm hoặc giờ thấp điểm nghiệp vụ

### 4. Thông báo người dùng
- Thông báo trước cho người dùng thời gian bảo trì hệ thống
- Thông báo cho người dùng sau khi cập nhật xong

---

## 📝 Danh Sách Kiểm Tra Cập Nhật

Trước khi cập nhật：
- [ ] Xem nội dung cập nhật
- [ ] Backup database
- [ ] Backup file cấu hình
- [ ] Thông báo người dùng（nếu cần）

Trong khi cập nhật：
- [ ] Pull code mới nhất
- [ ] Cập nhật dependencies
- [ ] Build frontend
- [ ] Khởi động lại backend

Sau khi cập nhật：
- [ ] Kiểm tra trạng thái dịch vụ
- [ ] Xem log
- [ ] Test chức năng quan trọng
- [ ] Giám sát vận hành hệ thống

---

## 🎯 Tham Khảo Lệnh Nhanh

```bash
# Cập nhật code
cd /www/wwwroot/CRM && git pull origin main

# Cập nhật một lần（sử dụng script）
cd /www/wwwroot/CRM && ./update.sh

# Xem trạng thái dịch vụ
pm2 list

# Xem log
pm2 logs crm-backend

# Khởi động lại dịch vụ
pm2 restart crm-backend

# Xem lịch sử cập nhật
git log --oneline -10

# Rollback phiên bản
git reset --hard CommitID
```

---

## 💡 Thực Hành Tốt Nhất

### 1. Cập nhật định kỳ
- Khuyến nghị kiểm tra cập nhật mỗi tuần một lần
- Cập nhật quan trọng áp dụng kịp thời

### 2. Giữ file cấu hình độc lập
- Không sửa `.env.example`
- Chỉ sửa file `.env`
- File `.env` sẽ không bị Git ghi đè

### 3. Sử dụng version tag
```bash
# Xem tất cả version tag
git tag

# Chuyển sang phiên bản chỉ định
git checkout v1.0.0
```

### 4. Giám sát cập nhật
- Theo dõi trang Release của GitHub repository
- Đăng ký thông báo cập nhật

---

## 📞 Cần Giúp Đỡ？

Nếu gặp vấn đề trong quá trình cập nhật：

1. Xem log lỗi
2. Tham khảo phần câu hỏi thường gặp
3. Submit Issue trên GitHub
4. Liên hệ hỗ trợ kỹ thuật

---

**Phiên bản**：v1.0  
**Ngày cập nhật**：2024-11-23  
**Áp dụng cho**：Hệ thống CRM v1.8.3+
