# API Backend Hệ Thống CRM

Dịch vụ API backend hệ thống CRM dựa trên Node.js + TypeScript + Express + TypeORM + MySQL.

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu Môi Trường

- Node.js 18.0+
- MySQL 8.0+
- npm 8.0+

### Cài Đặt Dependencies

```bash
npm install
```

### Cấu Hình Môi Trường

1. Sao chép file cấu hình biến môi trường：
```bash
cp .env.example .env
```

2. Chỉnh sửa file `.env`，cấu hình thông tin kết nối database：
```env
# Cấu hình database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=crm_user
DB_PASSWORD=your_password
DB_DATABASE=crm_system

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

### Khởi Tạo Database

1. Tạo database：
```sql
CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import SQL khởi tạo（tùy chọn）：
```bash
mysql -u crm_user -p crm_system < ../database/bt_panel_setup.sql
```

### Khởi Động Dịch Vụ

```bash
# Chế độ phát triển
npm run dev

# Chế độ production
npm run build
npm start

# Sử dụng PM2 khởi động
npm run start:prod
```

## 📁 Cấu Trúc Dự Án

```
backend/
├── src/
│   ├── config/          # File cấu hình
│   │   ├── database.ts  # Cấu hình database
│   │   ├── jwt.ts       # Cấu hình JWT
│   │   └── logger.ts    # Cấu hình log
│   ├── controllers/     # Controllers
│   │   └── UserController.ts
│   ├── entities/        # Database entities
│   │   ├── User.ts
│   │   ├── Customer.ts
│   │   ├── Product.ts
│   │   └── ...
│   ├── middleware/      # Middleware
│   │   ├── auth.ts      # Middleware xác thực
│   │   ├── errorHandler.ts # Xử lý lỗi
│   │   └── validation.ts    # Xác thực request
│   ├── routes/          # Routes
│   │   ├── auth.ts      # Routes xác thực
│   │   ├── users.ts     # Quản lý người dùng
│   │   └── ...
│   └── app.ts           # Entry point ứng dụng
├── logs/                # File log
├── uploads/             # File upload
├── package.json
├── tsconfig.json
└── ecosystem.config.js  # Cấu hình PM2
```

## 🔌 API Endpoints

### Xác Thực

- `POST /api/v1/auth/login` - Đăng nhập người dùng
- `POST /api/v1/auth/refresh` - Làm mới token
- `GET /api/v1/auth/me` - Lấy thông tin người dùng hiện tại
- `PUT /api/v1/auth/me` - Cập nhật thông tin người dùng
- `PUT /api/v1/auth/password` - Đổi mật khẩu
- `POST /api/v1/auth/logout` - Đăng xuất người dùng

### Quản Lý Người Dùng

- `GET /api/v1/users` - Lấy danh sách người dùng（quản trị viên）

### Các Module Khác

- Quản lý khách hàng：`/api/v1/customers`
- Quản lý sản phẩm：`/api/v1/products`
- Quản lý đơn hàng：`/api/v1/orders`
- Quản lý hệ thống：`/api/v1/system`

## 🔐 Cơ Chế Xác Thực

Sử dụng JWT (JSON Web Token) để xác thực：

1. Sau khi đăng nhập thành công, người dùng nhận được access token và refresh token
2. Access token dùng để xác thực API requests，hiệu lực 7 ngày
3. Refresh token dùng để lấy access token mới，hiệu lực 30 ngày
4. Format header：`Authorization: Bearer <access_token>`

## 🛡️ Tính Năng Bảo Mật

- **Mã hóa mật khẩu**：Sử dụng bcrypt để hash mật khẩu
- **Xác thực JWT**：Xác thực không trạng thái dựa trên token
- **Giới hạn request**：Ngăn chặn lạm dụng API
- **Cấu hình CORS**：Kiểm soát cross-origin requests
- **Helmet security headers**：Thiết lập HTTP security headers
- **Xác thực input**：Sử dụng Joi để xác thực dữ liệu request
- **Bảo vệ SQL injection**：TypeORM parameterized queries
- **Xử lý lỗi**：Format phản hồi lỗi thống nhất

## 📊 Hệ Thống Log

Sử dụng Winston để quản lý log：

- **Access log**：Ghi lại tất cả HTTP requests
- **Error log**：Ghi lại lỗi và exception của ứng dụng
- **Operation log**：Ghi lại hành vi thao tác của người dùng
- **Performance log**：Ghi lại các chỉ số hiệu suất

Vị trí file log：thư mục `logs/`

## 🚀 Hướng Dẫn Triển Khai

### Triển Khai Bảng Điều Khiển Bảo Tháp

1. **Chuẩn bị môi trường**
   - Cài đặt Node.js 18+
   - Cài đặt MySQL 8.0+
   - Cài đặt PM2

2. **Triển khai code**
   ```bash
   # Upload code lên server
   git clone <repository>
   cd backend
   npm install
   npm run build
   ```

3. **Cấu hình database**
   - Tạo database và user
   - Import SQL khởi tạo
   - Cấu hình biến môi trường

4. **Khởi động dịch vụ**
   ```bash
   npm run start:prod
   ```

5. **Nginx Reverse Proxy**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
   ```

### Triển Khai Docker（Tùy Chọn）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

## 🔧 Hướng Dẫn Phát Triển

### Thêm API Endpoint Mới

1. Tạo entity model（nếu cần）
2. Tạo controller method
3. Thêm route definition
4. Thêm request validation rules
5. Cập nhật API documentation

### Database Migration

```bash
# Tạo file migration
npm run typeorm migration:generate -- -n MigrationName

# Chạy migration
npm run typeorm migration:run

# Rollback migration
npm run typeorm migration:revert
```

### Testing

```bash
# Chạy tests
npm test

# Chế độ watch
npm run test:watch
```

## 📝 Format Phản Hồi API

### Phản Hồi Thành Công
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... }
}
```

### Phản Hồi Lỗi
```json
{
  "success": false,
  "message": "Thông tin lỗi",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## 🤝 Hướng Dẫn Đóng Góp

1. Fork dự án
2. Tạo feature branch
3. Commit thay đổi
4. Push lên branch
5. Tạo Pull Request

## 📄 Giấy Phép

MIT License
