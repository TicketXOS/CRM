# Hướng Dẫn Cấu Hình Môi Trường

## 📋 Tổng Quan

Tài liệu này hướng dẫn cách cấu hình các biến môi trường cho hệ thống CRM, bao gồm cả frontend và backend.

## 📁 Cấu Trúc File

```
CRM/
├── env.example                    # File mẫu cấu hình frontend
├── .env                          # File cấu hình frontend (development)
├── .env.production               # File cấu hình frontend (production)
├── backend/
│   ├── env.example              # File mẫu cấu hình backend
│   └── .env                     # File cấu hình backend
```

## 🚀 Bắt Đầu Nhanh

### Frontend

1. **Sao chép file mẫu:**
   ```bash
   cp env.example .env
   cp env.example .env.production
   ```

2. **Chỉnh sửa file `.env` cho development:**
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api/v1
   VITE_USE_API=false
   ```

3. **Chỉnh sửa file `.env.production` cho production:**
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
   VITE_USE_API=true
   ```

### Backend

1. **Sao chép file mẫu:**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Chỉnh sửa file `.env`:**
   ```env
   NODE_ENV=production
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=crm_user
   DB_PASSWORD=your_password
   DB_DATABASE=crm_db
   JWT_SECRET=your-secret-key
   ```

## 🔧 Chi Tiết Cấu Hình

### Frontend Environment Variables

#### `VITE_API_BASE_URL`
- **Mô tả:** URL cơ sở của API backend
- **Bắt buộc:** Có (trong production)
- **Ví dụ:**
  - Development: `http://localhost:3001/api/v1`
  - Production: `https://api.yourdomain.com/api/v1`
- **Lưu ý:**
  - Phải có prefix `/api/v1` ở cuối
  - Nếu backend và frontend cùng domain, có thể dùng relative path: `/api/v1`

#### `VITE_USE_API`
- **Mô tả:** Có sử dụng API thật hay không
- **Bắt buộc:** Không
- **Giá trị:** `true` | `false`
- **Mặc định:** `false`
- **Lưu ý:**
  - Production tự động bắt buộc dùng API thật
  - Development có thể dùng mock data nếu để `false`

### Backend Environment Variables

#### Cấu Hình Môi Trường

##### `NODE_ENV`
- **Mô tả:** Môi trường chạy ứng dụng
- **Giá trị:** `development` | `production` | `test`
- **Mặc định:** `development`
- **Ảnh hưởng:**
  - `development`: SQLite, logging chi tiết, token dài hạn
  - `production`: MySQL, tối ưu hiệu suất, bảo mật cao

##### `PORT`
- **Mô tả:** Cổng server backend
- **Giá trị:** 1024-65535
- **Mặc định:** `3000`

#### Cấu Hình Database

##### `DB_TYPE`
- **Mô tả:** Loại database
- **Giá trị:** `mysql` | `sqlite`
- **Mặc định:** Tự động (development: sqlite, production: mysql)

##### `DB_HOST`
- **Mô tả:** Địa chỉ MySQL server
- **Mặc định:** `localhost`
- **Ví dụ:** `192.168.1.100`, `db.example.com`

##### `DB_PORT`
- **Mô tả:** Cổng MySQL
- **Mặc định:** `3306`

##### `DB_USERNAME` / `DB_USER`
- **Mô tả:** Tên user MySQL
- **Mặc định:** `root`
- **Lưu ý:** Production nên tạo user riêng

##### `DB_PASSWORD`
- **Mô tả:** Mật khẩu MySQL
- **Bắt buộc:** Có
- **Lưu ý:** Sử dụng mật khẩu mạnh (ít nhất 12 ký tự)

##### `DB_DATABASE` / `DB_NAME`
- **Mô tả:** Tên database
- **Mặc định:** `crm`
- **Lưu ý:** Database phải được tạo trước

##### `DB_CHARSET`
- **Mô tả:** Character set
- **Mặc định:** `utf8mb4`
- **Khuyến nghị:** `utf8mb4` (hỗ trợ emoji)

##### `DB_TIMEZONE`
- **Mô tả:** Múi giờ
- **Mặc định:** `+08:00`
- **Ví dụ:** `+08:00`, `Asia/Ho_Chi_Minh`

#### Cấu Hình JWT

##### `JWT_SECRET`
- **Mô tả:** Secret key để ký Access Token
- **Bắt buộc:** Có
- **Lưu ý:**
  - Phải thay đổi trong production
  - Tạo bằng: `openssl rand -base64 32`
  - Giữ bí mật, không commit vào Git

##### `JWT_REFRESH_SECRET`
- **Mô tả:** Secret key để ký Refresh Token
- **Bắt buộc:** Có
- **Lưu ý:** Nên khác với `JWT_SECRET`

##### `JWT_EXPIRES_IN`
- **Mô tả:** Thời gian hết hạn Access Token
- **Mặc định:** `7d`
- **Ví dụ:** `1h`, `24h`, `7d`, `30d`

##### `JWT_REFRESH_EXPIRES_IN`
- **Mô tả:** Thời gian hết hạn Refresh Token
- **Mặc định:** `30d`
- **Ví dụ:** `7d`, `30d`, `90d`

#### Cấu Hình API Logistics (Tùy Chọn)

##### `EXPRESS_API_CUSTOMER`
- **Mô tả:** Customer ID của Kuaidi100
- **Bắt buộc:** Không (chỉ cần nếu dùng logistics)

##### `EXPRESS_API_KEY`
- **Mô tả:** API Key của Kuaidi100
- **Bắt buộc:** Không (chỉ cần nếu dùng logistics)

##### `KDNIAO_CUSTOMER_ID`
- **Mô tả:** Customer ID của KDNiao
- **Bắt buộc:** Không (chỉ cần nếu dùng logistics)

##### `KDNIAO_API_KEY`
- **Mô tả:** API Key của KDNiao
- **Bắt buộc:** Không (chỉ cần nếu dùng logistics)

## 🔐 Bảo Mật

### Best Practices

1. **Không commit file `.env` vào Git**
   - File `.env` đã được thêm vào `.gitignore`
   - Chỉ commit file `.env.example`

2. **Sử dụng mật khẩu mạnh**
   - Database password: ít nhất 12 ký tự
   - JWT secret: ít nhất 32 ký tự
   - Kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt

3. **Giới hạn quyền truy cập file `.env`**
   ```bash
   chmod 600 .env
   chmod 600 backend/.env
   ```

4. **Tạo JWT secret key ngẫu nhiên**
   ```bash
   openssl rand -base64 32
   ```

5. **Production: Sử dụng biến môi trường hệ thống**
   - Thay vì file `.env`, có thể dùng biến môi trường OS
   - An toàn hơn, không lưu trong file

## 🐛 Troubleshooting

### Frontend

#### API không kết nối được
1. Kiểm tra `VITE_API_BASE_URL` có đúng không
2. Kiểm tra backend có chạy không
3. Kiểm tra CORS configuration
4. Xem console browser để xem lỗi chi tiết

#### Sử dụng mock data thay vì API
1. Kiểm tra `VITE_USE_API` có là `true` không
2. Kiểm tra `VITE_API_BASE_URL` có giá trị không
3. Production tự động dùng API thật

### Backend

#### Database connection failed
1. Kiểm tra MySQL service có chạy không
2. Kiểm tra `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
3. Kiểm tra firewall có chặn port không
4. Test connection: `mysql -h DB_HOST -P DB_PORT -u DB_USERNAME -p`

#### JWT token invalid
1. Kiểm tra `JWT_SECRET` có đúng không
2. Đảm bảo `JWT_SECRET` giống nhau giữa các request
3. Kiểm tra token có hết hạn không

#### Port already in use
1. Kiểm tra port có bị chiếm dụng: `netstat -an | grep PORT`
2. Thay đổi `PORT` trong `.env`
3. Kill process đang dùng port: `kill -9 PID`

## 📚 Tài Liệu Tham Khảo

- [README.md](./README.md) - Tài liệu chính
- [deployment-guide.md](./deployment-guide.md) - Hướng dẫn triển khai
- [backend/README.md](./backend/README.md) - Tài liệu backend API

## 💬 Hỗ Trợ

Nếu gặp vấn đề:
1. Xem phần Troubleshooting ở trên
2. Kiểm tra log: `backend/logs/`
3. GitHub Issues: https://github.com/mrtinhnguyen/CRM/issues

