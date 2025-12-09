# Hướng Dẫn Triển Khai

## Lựa Chọn Phương Thức Triển Khai

Hệ thống này hỗ trợ nhiều phương thức triển khai：

1. **Triển khai Bảng Điều Khiển Bảo Tháp**（Khuyến nghị）- Phù hợp người mới，thao tác giao diện
2. **Triển khai Docker** - Phù hợp môi trường container hóa
3. **Triển khai thủ công** - Phù hợp cấu hình tùy chỉnh

---

## Một、Triển Khai Bảng Điều Khiển Bảo Tháp（Khuyến nghị）

### Yêu Cầu Trước

- Hệ thống server：CentOS 7+ / Ubuntu 18+ / Debian 9+
- Bộ nhớ：Ít nhất 2GB
- Đã cài đặt Bảng Điều Khiển Bảo Tháp 7.x+
- Đã cài đặt Nginx 1.20+
- Đã cài đặt MySQL 8.0+
- Đã cài đặt Node.js 18+
- Đã cài đặt PM2

### Bước 1：Chuẩn Bị Môi Trường Server

#### 1.1 Cài đặt Bảng Điều Khiển Bảo Tháp
```bash
# CentOS
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh

# Ubuntu/Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

#### 1.2 Cài đặt phần mềm
Trong Bảng Điều Khiển Bảo Tháp cài đặt：
- Nginx 1.20+
- MySQL 8.0+
- Node.js 18+ (Sử dụng PM2 Manager)

### Bước 2：Tạo Database

1. Vào Bảng Điều Khiển Bảo Tháp → Database
2. Click "Thêm database"
3. Điền thông tin：
   - Tên database：`crm_db`
   - Tên người dùng：`crm_user`
   - Mật khẩu：Tự động tạo hoặc tùy chỉnh
4. Click "Gửi"

### Bước 3：Import Cấu Trúc Database

1. Click tên database để vào quản lý
2. Click "Import"
3. Upload file `database/schema.sql`
4. Click "Import"

### Bước 4：Upload File Dự Án

#### 4.1 Upload code
```bash
# Cách 1：Sử dụng Git（Khuyến nghị）
cd /www/wwwroot
git clone https://github.com/mrtinhnguyen/CRM.git
cd CRM

# Cách 2：Sử dụng Bảng Điều Khiển Bảo Tháp upload
# Trong Bảng Điều Khiển Bảo Tháp → File → Upload file nén dự án
```

#### 4.2 Cài đặt dependencies
```bash
# Dependencies frontend
npm install

# Dependencies backend
cd backend
npm install
cd ..
```

### Bước 5：Cấu Hình Biến Môi Trường

#### 5.1 Cấu hình biến môi trường backend
Chỉnh sửa `backend/.env`：
```env
# Cấu hình database
DB_HOST=localhost
DB_PORT=3306
DB_USER=crm_user
DB_PASSWORD=Mật khẩu database của bạn
DB_NAME=crm_db

# Cấu hình server
PORT=3000
NODE_ENV=production

# Cấu hình JWT
JWT_SECRET=JWT secret của bạn（tạo ngẫu nhiên）
JWT_EXPIRES_IN=7d
```

#### 5.2 Cấu hình biến môi trường frontend
Chỉnh sửa `.env.production`：
```env
# Địa chỉ API
VITE_API_BASE_URL=https://domain của bạn/api

# Có sử dụng API thật không
VITE_USE_REAL_API=true
```

### Bước 6：Build Frontend

```bash
npm run build
```

Sau khi build xong，sẽ tạo file tĩnh trong thư mục `dist`.

### Bước 7：Cấu Hình Nginx

#### 7.1 Tạo website
1. Vào Bảng Điều Khiển Bảo Tháp → Website
2. Click "Thêm site"
3. Điền thông tin：
   - Domain：`domain của bạn.com`
   - Thư mục gốc：`/www/wwwroot/CRM/dist`
   - Phiên bản PHP：Tĩnh thuần
4. Click "Gửi"

#### 7.2 Cấu hình reverse proxy
1. Click tên website → Cài đặt
2. Click "Reverse proxy"
3. Thêm reverse proxy：
   - Tên proxy：`api`
   - URL đích：`http://127.0.0.1:3000`
   - Gửi domain：`$host`
   - Thay thế nội dung：Để trống
4. Click "Lưu"

#### 7.3 Cấu hình URL rewrite
Thêm vào "File cấu hình"：
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

### Bước 8：Khởi Động Dịch Vụ Backend

#### 8.1 Sử dụng PM2 khởi động
```bash
cd /www/wwwroot/CRM/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 8.2 Xem trạng thái chạy
```bash
pm2 list
pm2 logs crm-backend
```

### Bước 9：Cấu Hình SSL Certificate（Tùy chọn）

1. Vào cài đặt website → SSL
2. Chọn "Let's Encrypt"
3. Click "Đăng ký"
4. Bật "Bắt buộc HTTPS"

### Bước 10：Xác Minh Triển Khai

1. Truy cập `https://domain của bạn.com`
2. Sử dụng tài khoản test đăng nhập：
   - Tên đăng nhập：`admin`
   - Mật khẩu：`admin123`
3. Kiểm tra chức năng có bình thường không

---

## Hai、Triển Khai Docker

### Yêu Cầu Trước

- Đã cài đặt Docker 20+
- Đã cài đặt Docker Compose 2+

### Bước 1：Chuẩn Bị File Cấu Hình

Tạo `docker-compose.yml`：
```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: crm-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: crm_db
      MYSQL_USER: crm_user
      MYSQL_PASSWORD: crm_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: crm-backend
    restart: always
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: crm_user
      DB_PASSWORD: crm_password
      DB_NAME: crm_db
      PORT: 3000
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - mysql

  # Frontend Service
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: crm-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Bước 2：Tạo Dockerfile

#### Frontend Dockerfile
Tạo `Dockerfile`：
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile
Tạo `backend/Dockerfile`：
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/app.js"]
```

### Bước 3：Khởi Động Dịch Vụ

```bash
docker-compose up -d
```

### Bước 4：Xem Log

```bash
docker-compose logs -f
```

---

## Ba、Triển Khai Thủ Công

### Yêu Cầu Trước

- Node.js 18+
- MySQL 8.0+
- Nginx 1.20+
- PM2

### Bước 1：Cài Đặt Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### Bước 2：Cấu Hình Database

```bash
mysql -u root -p
CREATE DATABASE crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON crm_db.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import cấu trúc database
mysql -u crm_user -p crm_db < database/schema.sql
```

### Bước 3：Cấu Hình Biến Môi Trường

Tham khảo cấu hình biến môi trường trong "Triển khai Bảo Tháp".

### Bước 4：Build Dự Án

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
cd ..
```

### Bước 5：Cấu Hình Nginx

Tạo `/etc/nginx/sites-available/crm`：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/crm/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Kích hoạt cấu hình：
```bash
ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Bước 6：Khởi Động Backend

```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Danh Sách Kiểm Tra Triển Khai

### Kiểm Tra Trước Khi Triển Khai

- [ ] Môi trường server đã chuẩn bị xong
- [ ] Database đã tạo xong
- [ ] Biến môi trường đã cấu hình đúng
- [ ] Dependencies đã cài đặt xong
- [ ] Code đã build thành công

### Kiểm Tra Sau Khi Triển Khai

- [ ] Trang frontend có thể truy cập
- [ ] Backend API có thể truy cập
- [ ] Kết nối database bình thường
- [ ] Chức năng đăng nhập bình thường
- [ ] Kiểm soát quyền bình thường
- [ ] Đọc ghi dữ liệu bình thường
- [ ] Upload file bình thường
- [ ] Ghi log bình thường

### Kiểm Tra Hiệu Suất

- [ ] Tốc độ tải trang < 3s
- [ ] Thời gian phản hồi API < 500ms
- [ ] Tối ưu truy vấn database
- [ ] Tăng tốc tài nguyên tĩnh CDN
- [ ] Bật nén Gzip

### Kiểm Tra Bảo Mật

- [ ] Cấu hình certificate HTTPS
- [ ] Độ mạnh mật khẩu database
- [ ] Bảo mật JWT secret
- [ ] Cấu hình quy tắc firewall
- [ ] Chiến lược backup định kỳ

---

## Câu Hỏi Thường Gặp

### Q: Sau khi triển khai trang trắng？
A: Kiểm tra：
1. Cấu hình Nginx có đúng không
2. Build frontend có thành công không
3. Console trình duyệt có lỗi không
4. Cấu hình địa chỉ API có đúng không

### Q: API request 404？
A: Kiểm tra：
1. Dịch vụ backend có khởi động không
2. Cấu hình reverse proxy Nginx có đúng không
3. Port có bị chiếm dụng không
4. Firewall có mở port không

### Q: Kết nối database thất bại？
A: Kiểm tra：
1. Dịch vụ database có khởi động không
2. Cấu hình database có đúng không
3. Quyền người dùng có đủ không
4. Firewall có cho phép kết nối không

### Q: PM2 khởi động thất bại？
A: Kiểm tra：
1. Phiên bản Node.js có đúng không
2. Dependencies có cài đặt đầy đủ không
3. Biến môi trường có cấu hình không
4. Port có bị chiếm dụng không

### Q: Làm thế nào để cập nhật code？
A: 
```bash
# 1. Pull code mới nhất
git pull

# 2. Cài đặt dependencies mới
npm install
cd backend && npm install && cd ..

# 3. Build lại
npm run build
cd backend && npm run build && cd ..

# 4. Khởi động lại backend
pm2 restart crm-backend
```

---

## Khuyến Nghị Bảo Trì

### Bảo Trì Hàng Ngày

1. **Backup định kỳ**
   - Backup database mỗi ngày
   - Backup code và cấu hình mỗi tuần
   - Sử dụng script backup tự động

2. **Giám sát log**
   ```bash
   # Xem log backend
   pm2 logs crm-backend
   
   # Xem log Nginx
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

3. **Giám sát hiệu suất**
   ```bash
   # Xem trạng thái process
   pm2 monit
   
   # Xem tài nguyên hệ thống
   htop
   ```

### Bảo Trì Bảo Mật

1. **Cập nhật định kỳ**
   - Cập nhật patch hệ thống
   - Cập nhật phiên bản Node.js
   - Cập nhật package dependencies

2. **Kiểm toán bảo mật**
   - Kiểm tra đăng nhập bất thường
   - Xem xét log thao tác
   - Giám sát tài nguyên hệ thống

3. **Backup và khôi phục**
   - Test backup và khôi phục định kỳ
   - Lập kế hoạch khôi phục thảm họa

---

## Hỗ Trợ Kỹ Thuật

Nếu gặp vấn đề triển khai，vui lòng cung cấp thông tin sau：

1. Hệ thống và phiên bản server
2. Phiên bản Node.js
3. Log lỗi
4. File cấu hình
5. Các bước thao tác

Thông tin liên hệ：
- GitHub Issues
- Email hỗ trợ kỹ thuật
