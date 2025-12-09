# Hướng Dẫn Triển Khai Nhanh Bảo Tháp（Hoàn thành trong 5 phút）

## Điều Kiện Tiên Quyết

- ✅ Đã cài đặt Bảng Điều Khiển Bảo Tháp 7.x+
- ✅ Đã cài đặt Nginx 1.20+
- ✅ Đã cài đặt MySQL 8.0+
- ✅ Đã cài đặt Node.js 18+ (Cài đặt qua Bảo Tháp Software Store)
- ✅ Đã cài đặt PM2 (Cài đặt qua Bảo Tháp Software Store)

---

## Các Bước Triển Khai Nhanh

### Bước Một：Upload Code（2 phút）

#### Cách 1：Sử Dụng Git（Khuyến nghị）
```bash
# 1. SSH kết nối đến server
ssh root@your-server-ip

# 2. Vào thư mục website
cd /www/wwwroot

# 3. Clone dự án
git clone https://github.com/mrtinhnguyen/CRM.git
cd CRM

# 4. Cài đặt dependencies（tự động thực thi）
npm install
cd backend && npm install && cd ..
```

#### Cách 2：Sử Dụng Bảng Điều Khiển Bảo Tháp Upload
1. Trong Bảng Điều Khiển Bảo Tháp → File → Upload file nén dự án
2. Giải nén vào `/www/wwwroot/CRM`

---

### Bước Hai：Tạo Database（1 phút）

1. Vào Bảng Điều Khiển Bảo Tháp → Database
2. Click "Thêm database"
3. Điền thông tin：
   - Tên database：`crm_db`
   - Tên người dùng：`crm_user`
   - Mật khẩu：Tự động tạo（nhớ mật khẩu này）
4. Click "Gửi"
5. Click tên database → Import → Upload `database/schema.sql`

---

### Bước Ba：Cấu Hình Biến Môi Trường（1 phút）

#### Cấu hình biến môi trường backend
Chỉnh sửa file `backend/.env`：
```env
# Cấu hình database
DB_HOST=localhost
DB_PORT=3306
DB_USER=crm_user
DB_PASSWORD=Mật_khẩu_database_của_bạn
DB_NAME=crm_db

# Cấu hình server
PORT=3000
NODE_ENV=production

# Cấu hình JWT（tạo ngẫu nhiên một cái）
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRES_IN=7d
```

#### Cấu hình biến môi trường frontend
Chỉnh sửa file `.env.production`：
```env
# Địa chỉ API（đổi thành domain của bạn）
VITE_API_BASE_URL=https://domain_của_bạn.com/api

# Sử dụng API thật
VITE_USE_REAL_API=true
```

---

### Bước Bốn：Build Frontend（1 phút）

```bash
cd /www/wwwroot/CRM
npm run build
```

Sau khi build xong，thư mục `dist` chứa file tĩnh.

---

### Bước Năm：Cấu Hình Nginx（1 phút）

#### 5.1 Tạo website
1. Bảng Điều Khiển Bảo Tháp → Website → Thêm site
2. Điền thông tin：
   - Domain：`domain_của_bạn.com`
   - Thư mục gốc：`/www/wwwroot/CRM/dist`
   - Phiên bản PHP：Tĩnh thuần
3. Click "Gửi"

#### 5.2 Cấu hình reverse proxy
1. Click tên website → Cài đặt → Reverse proxy
2. Thêm reverse proxy：
   - Tên proxy：`api`
   - URL đích：`http://127.0.0.1:3000`
   - Gửi domain：`$host`
3. Click "Lưu"

#### 5.3 Cấu hình URL rewrite
Click "File cấu hình"，thêm vào block `location /`：
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

Click "Lưu".

---

### Bước Sáu：Khởi Động Backend Service（30 giây）

```bash
cd /www/wwwroot/CRM/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Xem trạng thái chạy：
```bash
pm2 list
pm2 logs crm-backend
```

---

### Bước Bảy：Cấu Hình Thư Mục Upload Ảnh（Quan trọng！）

#### 7.1 Tạo thư mục upload
```bash
cd /www/wwwroot/CRM/backend
mkdir -p uploads/system uploads/products uploads/avatars uploads/orders uploads/services
chmod -R 755 uploads
```

#### 7.2 Cấu hình Nginx phục vụ file tĩnh
Thêm vào file cấu hình website（trước `location /api`）：
```nginx
# Phục vụ file tĩnh - Ảnh đã upload
location ^~ /uploads/ {
    alias /www/wwwroot/CRM/backend/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
}
```

#### 7.3 Mô tả cấu hình lưu trữ
Hệ thống hỗ trợ hai cách lưu trữ：
- **Lưu trữ local**（mặc định）：Ảnh lưu trong thư mục `backend/uploads/` trên server
- **Aliyun OSS**：Ảnh upload lên Aliyun Object Storage

Có thể chuyển đổi cách lưu trữ trong Cài đặt hệ thống → Cài đặt lưu trữ.

---

### Bước Tám：Cấu Hình SSL（Tùy chọn，1 phút）

1. Cài đặt website → SSL
2. Chọn "Let's Encrypt"
3. Click "Đăng ký"
4. Bật "Bắt buộc HTTPS"

---

### Bước Chín：Xác Minh Triển Khai（30 giây）

1. Truy cập `https://domain_của_bạn.com`
2. Sử dụng tài khoản test đăng nhập：
   - Tên đăng nhập：`admin`
   - Mật khẩu：`admin123`
3. Kiểm tra chức năng có bình thường không
4. Test chức năng upload ảnh（Cài đặt hệ thống → Upload QR code）

---

## Script Triển Khai Một Lần

Để tiện hơn，chúng tôi cung cấp script triển khai một lần：

```bash
# Tải và thực thi script triển khai
cd /www/wwwroot/CRM
chmod +x deploy.sh
./deploy.sh
```

Script sẽ tự động：
1. ✅ Kiểm tra dependencies đã cài đặt chưa
2. ✅ Cài đặt dependencies frontend và backend
3. ✅ Build frontend
4. ✅ Khởi động backend service
5. ✅ Hiển thị trạng thái triển khai

---

## Câu Hỏi Thường Gặp

### Q: Làm thế nào để kiểm tra dependencies đã cài đặt chưa？
```bash
# Kiểm tra dependencies frontend
ls node_modules | wc -l

# Kiểm tra dependencies backend
ls backend/node_modules | wc -l

# Nếu số lượng là 0，nghĩa là chưa cài đặt，thực thi：
npm install
cd backend && npm install
```

### Q: Làm thế nào để cài đặt lại dependencies？
```bash
# Xóa dependencies cũ
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# Cài đặt lại
npm install
cd backend && npm install
```

### Q: Backend khởi động thất bại phải làm sao？
```bash
# Xem log lỗi
pm2 logs crm-backend

# Vấn đề thường gặp：
# 1. Port bị chiếm dụng → Sửa PORT trong backend/.env
# 2. Kết nối database thất bại → Kiểm tra cấu hình database trong backend/.env
# 3. Thiếu dependencies → cd backend && npm install
```

### Q: Trang frontend trắng phải làm sao？
```bash
# 1. Kiểm tra build có thành công không
ls dist/

# 2. Kiểm tra cấu hình Nginx
nginx -t

# 3. Build lại
npm run build

# 4. Khởi động lại Nginx
systemctl restart nginx
```

### Q: API request 404 phải làm sao？
```bash
# 1. Kiểm tra backend có chạy không
pm2 list

# 2. Kiểm tra port có đang lắng nghe không
netstat -tlnp | grep 3000

# 3. Kiểm tra cấu hình reverse proxy Nginx
# Đảm bảo có cấu hình location /api
```

### Q: Upload ảnh thành công nhưng không hiển thị được（404）phải làm sao？
```bash
# 1. Kiểm tra thư mục upload có tồn tại không
ls -la /www/wwwroot/CRM/backend/uploads/

# 2. Kiểm tra quyền thư mục
chmod -R 755 /www/wwwroot/CRM/backend/uploads/

# 3. Kiểm tra cấu hình Nginx có bao gồm phục vụ file tĩnh /uploads không
# Đảm bảo có cấu hình sau：
# location ^~ /uploads/ {
#     alias /www/wwwroot/CRM/backend/uploads/;
# }

# 4. Khởi động lại Nginx
systemctl restart nginx

# 5. Test truy cập ảnh
curl -I https://domain_của_bạn.com/uploads/system/test.jpg
```

### Q: Làm thế nào để chuyển sang lưu trữ Aliyun OSS？
1. Đăng nhập hệ thống → Cài đặt hệ thống → Cài đặt lưu trữ
2. Chọn "Aliyun OSS"
3. Điền Access Key、Secret Key、Tên Bucket、Khu vực lưu trữ
4. Click "Lưu cài đặt"
5. Ảnh upload mới sẽ tự động lưu vào OSS

---

## Danh Sách Kiểm Tra Triển Khai

Sau khi triển khai xong，vui lòng kiểm tra các mục sau：

- [ ] Trang frontend có thể truy cập
- [ ] Có thể đăng nhập bình thường
- [ ] Menu hiển thị bình thường
- [ ] Có thể thêm khách hàng
- [ ] Có thể thêm đơn hàng
- [ ] Dữ liệu có thể lưu
- [ ] Backend API phản hồi bình thường
- [ ] Process PM2 chạy bình thường
- [ ] Certificate SSL cấu hình thành công（nếu cần）
- [ ] Chức năng upload ảnh bình thường（Cài đặt hệ thống → Upload QR code test）
- [ ] Ảnh đã upload có thể hiển thị bình thường
- [ ] Ảnh sản phẩm có thể hiển thị

---

## Cập Nhật Code

Khi cần cập nhật code：

```bash
cd /www/wwwroot/CRM

# 1. Pull code mới nhất
git pull

# 2. Cài đặt dependencies mới（nếu có）
npm install
cd backend && npm install && cd ..

# 3. Build lại frontend
npm run build

# 4. Khởi động lại backend
pm2 restart crm-backend

# 5. Xem trạng thái
pm2 logs crm-backend
```

---

## Khuyến Nghị Tối Ưu Hiệu Suất

### 1. Bật nén Gzip
Thêm vào cấu hình Nginx：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 2. Cấu hình cache
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. Tối ưu database
- Backup database định kỳ
- Thêm index cần thiết
- Dọn dẹp bảng log định kỳ

---

## Hỗ Trợ Kỹ Thuật

Nếu gặp vấn đề，vui lòng cung cấp：
1. Log lỗi（`pm2 logs crm-backend`）
2. Log lỗi Nginx（`/var/log/nginx/error.log`）
3. Thông tin hệ thống（`uname -a`）
4. Phiên bản Node.js（`node -v`）

GitHub Issues: https://github.com/mrtinhnguyen/CRM/issues
