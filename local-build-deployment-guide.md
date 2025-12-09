# Hướng Dẫn Triển Khai Local Build

> Áp dụng cho server cấu hình thấp (2GB RAM), build frontend ở local, chỉ deploy backend trên server

---

## 📋 Ưu Điểm Của Phương Án

- ✅ **Tiết kiệm tài nguyên server**：Không build trên server，tiết kiệm RAM và CPU
- ✅ **Tốc độ build nhanh**：Hiệu suất máy tính local thường tốt hơn server
- ✅ **Triển khai đơn giản**：Server chỉ cần deploy backend，thao tác đơn giản
- ✅ **Phù hợp server cấu hình thấp**：2GB RAM vẫn chạy mượt

---

## 🎯 Tổng Quan Quy Trình Triển Khai

```
Máy tính local                           Server
   │                               │
   ├─ 1. Clone code                  │
   ├─ 2. Cài đặt dependencies                  │
   ├─ 3. Build frontend                  │
   ├─ 4. Đóng gói dist                 │
   │                               │
   └─ 5. Upload dist ──────────────> ├─ 6. Giải nén dist
                                   ├─ 7. Cài đặt backend dependencies
                                   ├─ 8. Khởi động backend service
                                   └─ 9. Cấu hình Nginx
```

---

## Phần Một：Build Local（Trên Máy Tính Của Bạn）

### Yêu Cầu Trước

- ✅ Đã cài đặt Node.js（16.x hoặc phiên bản cao hơn）
- ✅ Đã cài đặt Git
- ✅ Kết nối mạng bình thường

### Bước 1：Clone Dự Án Về Local

#### Người Dùng Windows：

1. Mở Command Prompt（CMD）hoặc PowerShell
2. Vào thư mục bạn muốn lưu dự án，ví dụ：
   ```cmd
   cd D:\Projects
   ```
3. Clone dự án：
   ```cmd
   git clone https://github.com/mrtinhnguyen/CRM.git
   cd CRM
   ```

#### Người Dùng Mac/Linux：

```bash
cd ~/Projects
git clone https://github.com/mrtinhnguyen/CRM.git
cd CRM
```

### Bước 2：Cấu Hình Biến Môi Trường

Chỉnh sửa file `.env.production`（nếu không tồn tại，sao chép từ `.env.example`）：

```env
# Cấu hình production
VITE_API_BASE_URL=/api
VITE_APP_TITLE=Hệ Thống Quản Lý CRM
NODE_ENV=production
VITE_USE_REAL_API=true
```

**Quan trọng**：`VITE_API_BASE_URL=/api` sử dụng relative path là được，Nginx sẽ xử lý reverse proxy.

### Bước 3：Chạy Script Build

#### Người Dùng Windows：

Double-click chạy file `build-local.bat`，hoặc chạy trong command line：

```cmd
build-local.bat
```

#### Người Dùng Mac/Linux：

```bash
chmod +x build-local.sh
./build-local.sh
```

### Bước 4：Chờ Build Hoàn Thành

Quá trình build bao gồm：
1. ✅ Cấu hình npm mirror
2. ✅ Cài đặt dependencies（khoảng 3-5 phút）
3. ✅ Kiểm tra file cấu hình
4. ✅ Build frontend（khoảng 2-3 phút）
5. ✅ Đóng gói file build

**Thấy thông tin sau là thành công**：
```
✅ Local build hoàn thành！
📁 Vị trí file build: D:\Projects\CRM\dist
```

### Bước 5：Chuẩn Bị File Upload

Sau khi build xong，bạn sẽ có：
- Thư mục `dist`（chứa tất cả file frontend）
- `dist.zip`（nếu tự động đóng gói thành công）

---

## Phần Hai：Upload Lên Server

### Phương Pháp 1：Sử Dụng Bảng Điều Khiển Bảo Tháp Upload（Khuyến nghị）

#### 1. Đóng gói thư mục dist

**Windows**：
- Right-click thư mục `dist`
- Chọn "Send to" → "Compressed (zipped) folder"
- Được `dist.zip`

**Mac**：
- Right-click thư mục `dist`
- Chọn "Compress"
- Được `dist.zip`

#### 2. Upload lên Bảo Tháp

1. Đăng nhập Bảng Điều Khiển Bảo Tháp
2. Click bên trái "File"
3. Vào `/www/wwwroot/abc789.cn`
4. Click nút "Upload"
5. Chọn file `dist.zip`
6. Chờ upload hoàn thành

#### 3. Giải nén file

1. Tìm `dist.zip` trong danh sách file
2. Click nút "Extract" bên phải
3. Đường dẫn giải nén chọn：`/www/wwwroot/abc789.cn`
4. Click nút "Extract"
5. Sau khi giải nén xong，xóa `dist.zip`

### Phương Pháp 2：Sử Dụng FTP Upload

1. Sử dụng FileZilla hoặc công cụ FTP khác
2. Kết nối đến server
3. Upload toàn bộ thư mục `dist` lên `/www/wwwroot/abc789.cn/dist`

### Phương Pháp 3：Sử Dụng Lệnh SCP（Mac/Linux）

```bash
# Nén thư mục dist
cd /path/to/CRM
tar -czf dist.tar.gz dist/

# Upload lên server
scp dist.tar.gz root@IP_server_của_bạn:/www/wwwroot/abc789.cn/

# SSH đăng nhập server
ssh root@IP_server_của_bạn

# Giải nén
cd /www/wwwroot/abc789.cn
tar -xzf dist.tar.gz
rm dist.tar.gz
```

---

## Phần Ba：Triển Khai Server（Chỉ Backend）

### Bước 1：Upload Script Triển Khai

Upload file `deploy-server-only.sh` lên thư mục `/www/wwwroot/abc789.cn` của server.

### Bước 2：Cấu Hình Biến Môi Trường Backend

Trong Bảng Điều Khiển Bảo Tháp，chỉnh sửa file `/www/wwwroot/abc789.cn/backend/.env`：

```env
# Cấu hình database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=Tên_user_database_của_bạn
DB_PASSWORD=Mật_khẩu_database_của_bạn
DB_DATABASE=Tên_database_của_bạn
DB_CHARSET=utf8mb4
DB_TIMEZONE=+08:00

# Cấu hình server
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Cấu hình JWT
JWT_SECRET=Secret_key_ngẫu_nhiên_bạn_tạo
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Cấu hình CORS
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

### Bước 3：Chạy Script Triển Khai

Trong terminal Bảo Tháp thực thi：

```bash
# Vào thư mục dự án
cd /www/wwwroot/abc789.cn

# Cấp quyền thực thi cho script
chmod +x deploy-server-only.sh

# Chạy script triển khai
./deploy-server-only.sh
```

### Bước 4：Xác Minh Triển Khai

Script sẽ tự động hoàn thành：
1. ✅ Kiểm tra file build frontend
2. ✅ Cấu hình npm mirror
3. ✅ Cài đặt backend dependencies（chỉ production）
4. ✅ Khởi động backend service

**Thấy thông tin sau là thành công**：
```
✅ Triển khai hoàn thành！
📊 Trạng thái service：
┌─────┬──────────────┬─────────┬─────────┐
│ id  │ name         │ status  │ restart │
├─────┼──────────────┼─────────┼─────────┤
│ 0   │ crm-backend  │ online  │ 0       │
└─────┴──────────────┴─────────┴─────────┘
```

---

## Phần Bốn：Cấu Hình Nginx

### Bước 1：Tạo Website

1. Trong Bảng Điều Khiển Bảo Tháp，click bên trái "Website"
2. Click "Thêm site"
3. Điền thông tin：
   - **Domain**：Domain hoặc IP của bạn
   - **Thư mục gốc**：`/www/wwwroot/abc789.cn/dist`
   - **Phiên bản PHP**：Tĩnh thuần
4. Click "Gửi"

### Bước 2：Cấu Hình Reverse Proxy

1. Tìm website vừa tạo trong danh sách website
2. Click "Cài đặt"
3. Click tab "Reverse proxy"
4. Click "Thêm reverse proxy"
5. Điền：
   - **Tên proxy**：`api`
   - **URL đích**：`http://127.0.0.1:3000`
   - **Gửi domain**：`$host`
6. Click "Lưu"

### Bước 3：Cấu Hình URL Rewrite

1. Trong cài đặt website，click tab "File cấu hình"
2. Tìm phần `location /`，sửa thành：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

3. Click "Lưu"

---

## Phần Năm：Test Xác Minh

### 1. Kiểm Tra Backend Service

```bash
pm2 list
pm2 logs crm-backend --lines 20
```

### 2. Truy Cập Website

Trong trình duyệt nhập：`http://IP_hoặc_domain_của_bạn`

Nên thấy trang đăng nhập.

### 3. Test Đăng Nhập

Sử dụng tài khoản mặc định：
- Tên đăng nhập：`superadmin`
- Mật khẩu：`super123456`

### 4. Test Chức Năng

- ✅ Xem dashboard
- ✅ Quản lý khách hàng
- ✅ Quản lý đơn hàng
- ✅ Truy vấn dữ liệu

---

## 🔄 Quy Trình Cập Nhật Sau Này

Khi code cập nhật，chỉ cần lặp lại các bước sau：

### Ở Local：

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Build lại
./build-local.sh  # hoặc build-local.bat

# 3. Upload thư mục dist mới
```

### Ở Server：

```bash
# 1. Backup file cũ（tùy chọn）
mv dist dist.backup

# 2. Giải nén thư mục dist mới

# 3. Nếu backend code có cập nhật
cd /www/wwwroot/abc789.cn/backend
git pull origin main
npm install --production
pm2 restart crm-backend
```

---

## 📊 So Sánh Sử Dụng Tài Nguyên

| Phương thức triển khai | Sử dụng RAM | Thời gian build | Cấu hình phù hợp |
|---------|---------|---------|---------|
| **Build trên server** | 1.5-2GB | 10-20 phút | 4GB+ |
| **Build local** | 200-500MB | 2-5 phút | 2GB+ ✅ |

---

## 🔧 Câu Hỏi Thường Gặp

### Vấn Đề 1：Local Build Thất Bại

**Giải pháp**：
```bash
# Xóa cache
rm -rf node_modules
rm -rf package-lock.json

# Cài đặt lại
npm install

# Build lại
npm run build
```

### Vấn Đề 2：File Upload Quá Lớn

**Giải pháp**：
- Trong Bảng Điều Khiển Bảo Tháp → Cài đặt → Giới hạn upload，điều chỉnh thành 500MB
- Hoặc sử dụng FTP/SCP upload

### Vấn Đề 3：Backend Khởi Động Thất Bại

**Giải pháp**：
```bash
# Xem log chi tiết
pm2 logs crm-backend

# Kiểm tra file cấu hình
cat backend/.env

# Kiểm tra port bị chiếm dụng
netstat -tunlp | grep 3000
```

### Vấn Đề 4：Trang Trắng

**Giải pháp**：
1. Kiểm tra file dist có đầy đủ không
2. Kiểm tra cấu hình Nginx có đúng không
3. Nhấn F12 xem lỗi trong console trình duyệt

---

## 💡 Khuyến Nghị Tối Ưu

### 1. Thêm Swap Virtual Memory

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Tối Ưu Cấu Hình PM2

Tạo `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'crm-backend',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/abc789.cn/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### 3. Dọn Dẹp Log Định Kỳ

```bash
# Dọn log PM2
pm2 flush

# Dọn system log
sudo journalctl --vacuum-time=7d
```

---

## 📞 Cần Giúp Đỡ？

Nếu gặp vấn đề：

1. Xem phần câu hỏi thường gặp trong tài liệu này
2. Xem log PM2：`pm2 logs crm-backend`
3. Xem log Nginx：`/www/wwwlogs/`
4. Submit Issue trên GitHub

---

**Phiên bản**：v1.0  
**Ngày cập nhật**：2024-11-23  
**Áp dụng cho**：Hệ thống CRM v1.8.3+  
**Cấu hình khuyến nghị**：Server 2GB+ RAM
