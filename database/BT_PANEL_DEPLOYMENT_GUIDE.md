# Hướng Dẫn Triển Khai Bảng Điều Khiển Bảo Tháp + MySQL

## Một、Chuẩn Bị Môi Trường Bảng Điều Khiển Bảo Tháp

### 1. Yêu Cầu Server
- **Hệ điều hành**：CentOS 7+ / Ubuntu 18+ / Debian 9+
- **RAM**：Ít nhất 1GB（Khuyến nghị 2GB+）
- **Ổ cứng**：Ít nhất 20GB dung lượng trống
- **Mạng**：IP công cộng，mở port 80、443、8888

### 2. Cài Đặt Bảng Điều Khiển Bảo Tháp
```bash
# Lệnh cài đặt CentOS
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh

# Lệnh cài đặt Ubuntu/Debian
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

### 3. Đăng Nhập Bảng Điều Khiển Bảo Tháp
- Sau khi cài đặt xong ghi lại địa chỉ panel、tên người dùng và mật khẩu
- Truy cập qua trình duyệt：`http://IP_server_của_bạn:8888`
- Lần đầu đăng nhập khuyến nghị sửa port mặc định và mật khẩu

## Hai、Cài Đặt Phần Mềm Môi Trường

### 1. Cài Đặt Phần Mềm Cần Thiết
Trong Bảng Điều Khiển Bảo Tháp → Software Store → Cài đặt một lần：
- **Nginx** 1.20+ （Web server）
- **MySQL** 8.0+ （Database）
- **PHP** 8.0+ （Tùy chọn，dùng cho phpMyAdmin）
- **Node.js** 18+ （Backend API service）
- **PM2** Manager（Quản lý process Node.js）

### 2. Tối Ưu Cấu Hình MySQL
Vào MySQL Management → Sửa cấu hình：
```ini
[mysqld]
# Cấu hình bộ ký tự
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Cấu hình hiệu suất
innodb_buffer_pool_size = 256M
max_connections = 200
query_cache_size = 32M
query_cache_type = 1

# Cấu hình múi giờ
default-time-zone = '+08:00'

# Cấu hình bảo mật
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO
```

## Ba、Tạo Và Cấu Hình Database

### 1. Tạo Database
1. Vào Bảng Điều Khiển Bảo Tháp → Database → Thêm database
2. Tên database：`crm_system`
3. Tên người dùng：`crm_user`（Không dùng root）
4. Mật khẩu：Tạo mật khẩu mạnh và ghi lại
5. Quyền truy cập：Local server（127.0.0.1）

### 2. Import Cấu Trúc Database
1. Click tên database vào phpMyAdmin
2. Chọn database `crm_system`
3. Click tab "Import"
4. Upload file `bt_panel_setup.sql`
5. Click "Execute" để hoàn thành import

### 3. Xác Minh Database
Thực thi SQL sau để xác minh cài đặt：
```sql
-- Kiểm tra bảng có được tạo thành công không
SHOW TABLES;

-- Kiểm tra dữ liệu mặc định
SELECT * FROM departments;
SELECT * FROM users;
SELECT * FROM system_configs;

-- Kiểm tra bộ ký tự
SHOW VARIABLES LIKE 'character_set%';
```

## Bốn、Triển Khai Backend API

### 1. Tạo Website
1. Bảng Điều Khiển Bảo Tháp → Website → Thêm site
2. Domain：`api.yourdomain.com`（hoặc dùng IP:port）
3. Thư mục gốc：`/www/wwwroot/crm-api`
4. Phiên bản PHP：Tĩnh thuần（không cần PHP）

### 2. Upload Backend Code
```bash
# Vào thư mục gốc website
cd /www/wwwroot/crm-api

# Upload backend code（qua FTP hoặc Bảng Điều Khiển Bảo Tháp File Manager）
# Hoặc dùng Git clone
git clone https://github.com/your-repo/crm-backend.git .

# Cài đặt dependencies
npm install

# Tạo file cấu hình môi trường
cp .env.example .env
```

### 3. Cấu Hình Biến Môi Trường
Chỉnh sửa file `.env`：
```env
# Cấu hình database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=crm_system
DB_USER=crm_user
DB_PASSWORD=Mật_khẩu_database_của_bạn

# Cấu hình service
PORT=3001
NODE_ENV=production

# Cấu hình JWT
JWT_SECRET=JWT_secret_key_của_bạn
JWT_EXPIRES_IN=7d

# Cấu hình CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Cấu hình upload file
UPLOAD_PATH=/www/wwwroot/crm-api/uploads
MAX_FILE_SIZE=10485760

# Cấu hình email（Tùy chọn）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-email-password
```

### 4. Sử Dụng PM2 Khởi Động Service
```bash
# Cài đặt PM2（nếu chưa cài）
npm install -g pm2

# Khởi động ứng dụng
pm2 start ecosystem.config.js

# Xem trạng thái
pm2 status

# Xem log
pm2 logs crm-api

# Thiết lập tự khởi động khi boot
pm2 startup
pm2 save
```

### 5. Cấu Hình Nginx Reverse Proxy
Trong Bảng Điều Khiển Bảo Tháp → Website → Site API của bạn → File cấu hình，thêm：
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Xử lý CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
    add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

## Năm、Triển Khai Frontend

### 1. Build Dự Án Frontend
```bash
# Trong môi trường phát triển local
npm run build

# Upload thư mục dist lên server
# Đường dẫn đích：/www/wwwroot/your-domain.com
```

### 2. Cấu Hình Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/your-domain.com;
    index index.html;
    
    # Hỗ trợ route frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Cache tài nguyên tĩnh
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Sáu、Cấu Hình Certificate SSL

### 1. Đăng Ký Certificate SSL Miễn Phí
1. Bảng Điều Khiển Bảo Tháp → Website → Domain của bạn → SSL
2. Chọn certificate miễn phí "Let's Encrypt"
3. Điền email，click đăng ký
4. Bật "Bắt buộc HTTPS"

### 2. Tự Động Gia Hạn Certificate
Bảng Điều Khiển Bảo Tháp sẽ tự động xử lý gia hạn certificate，không cần thao tác thủ công.

## Bảy、Cấu Hình Bảo Mật

### 1. Cài Đặt Firewall
Bảng Điều Khiển Bảo Tháp → Security：
- Mở port：80, 443, 8888（Port panel）
- Đóng port không cần thiết
- Thiết lập port SSH（không phải 22）

### 2. Bảo Mật Database
- Không dùng user root kết nối ứng dụng
- Thiết lập mật khẩu mạnh
- Backup database định kỳ
- Giới hạn truy cập từ xa

### 3. Quyền File
```bash
# Thiết lập quyền thư mục website
chown -R www:www /www/wwwroot/
chmod -R 755 /www/wwwroot/

# Thiết lập quyền file nhạy cảm
chmod 600 /www/wwwroot/crm-api/.env
```

## Tám、Giám Sát Và Bảo Trì

### 1. Giám Sát Hệ Thống
Bảng Điều Khiển Bảo Tháp → Monitor：
- Tỷ lệ sử dụng CPU
- Tỷ lệ sử dụng RAM
- Tỷ lệ sử dụng ổ cứng
- Lưu lượng mạng

### 2. Quản Lý Log
- Log truy cập Nginx：`/www/wwwroot/logs/`
- Log lỗi MySQL：Bảng Điều Khiển Bảo Tháp → MySQL → Log
- Log ứng dụng PM2：`pm2 logs`

### 3. Chiến Lược Backup
Bảng Điều Khiển Bảo Tháp → Scheduled Tasks：
- Backup database：2 giờ sáng mỗi ngày
- Backup file website：Mỗi tuần một lần
- Giữ backup：30 ngày

### 4. Tối Ưu Hiệu Suất
- Bật nén Gzip
- Cấu hình cache trình duyệt
- Sử dụng CDN tăng tốc
- Dọn dẹp file log định kỳ

## Chín、Xử Lý Sự Cố

### 1. Vấn Đề Thường Gặp
**Kết nối database thất bại**：
- Kiểm tra trạng thái service database
- Xác minh tham số kết nối
- Xem log lỗi MySQL

**Service API không thể truy cập**：
- Kiểm tra trạng thái process PM2
- Xem log ứng dụng
- Xác minh cấu hình Nginx

**Trang frontend trắng**：
- Kiểm tra file build có đầy đủ không
- Xem lỗi console trình duyệt
- Xác minh tính kết nối interface API

### 2. Lệnh Debug
```bash
# Kiểm tra trạng thái service
systemctl status nginx
systemctl status mysql
pm2 status

# Xem log
tail -f /var/log/nginx/error.log
tail -f /var/log/mysql/error.log
pm2 logs crm-api

# Test kết nối database
mysql -u crm_user -p crm_system

# Test interface API
curl http://localhost:3001/api/health
```

## Mười、Liên Hệ Hỗ Trợ

Nếu gặp vấn đề trong quá trình triển khai：
1. Xem tài liệu chính thức Bảng Điều Khiển Bảo Tháp
2. Kiểm tra log hệ thống và thông tin lỗi
3. Tham khảo tài liệu kỹ thuật dự án này
4. Liên hệ team hỗ trợ kỹ thuật

---

**Lưu ý quan trọng**：
- Trước khi triển khai vui lòng backup dữ liệu hiện có
- Sửa tất cả mật khẩu mặc định
- Cập nhật hệ thống và phần mềm định kỳ
- Giám sát hiệu suất và trạng thái bảo mật hệ thống
