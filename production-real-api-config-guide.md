# Môi Trường Production - Hướng Dẫn Cấu Hình API Thật

## ✅ Các Sửa Chữa Đã Hoàn Thành

### 1. Chuyển Sang Backend API Thật
- **Trước khi sửa**：Sử dụng `/mock-auth/login`（API mô phỏng）
- **Sau khi sửa**：Sử dụng `/auth/login`（Backend API thật）
- **Vị trí**：`src/services/authApiService.ts`

### 2. Nguồn TOKEN
- **Chế độ Mock**：Frontend tạo `mock-token-${Date.now()}`
- **Chế độ Production**：Backend JWT tạo TOKEN thật
- **Vị trí lưu trữ**：`localStorage.getItem('auth_token')`

### 3. Nguồn Dữ Liệu Người Dùng
- **Chế độ Mock**：Đọc từ `localStorage.getItem('crm_mock_users')`
- **Chế độ Production**：Đọc từ bảng `users` trong database
- **Cách xác thực**：Backend bcrypt xác thực mật khẩu

## 🔧 Cấu Hình Hệ Thống

### Tự Động Cấu Hình Môi Trường Production
```typescript
// src/api/mock.ts
export const shouldUseMockApi = (): boolean => {
  // 1. Kiểm tra cài đặt cưỡng bức localStorage
  if (localStorage.getItem('erp_mock_enabled') === 'true') {
    return true  // Cưỡng bức sử dụng Mock
  }

  // 2. Môi trường production tự động vô hiệu hóa Mock
  if (import.meta.env.PROD) {
    return false  // ✅ Môi trường production sử dụng API thật
  }

  // 3. Môi trường phát triển quyết định theo cấu hình
  return !import.meta.env.VITE_API_BASE_URL
}
```

### Cấu Hình Biến Môi Trường
```bash
# .env.production
VITE_API_BASE_URL=/api/v1
NODE_ENV=production
```

## 📊 Luồng Dữ Liệu

### Quy Trình Đăng Nhập（Môi Trường Production）

1. **Người Dùng Nhập**
   - Tên đăng nhập：username trong database
   - Mật khẩu：password trong database（mã hóa bcrypt）

2. **Request Frontend**
   ```typescript
   POST /api/v1/auth/login
   {
     "username": "admin",
     "password": "admin123",
     "rememberMe": false
   }
   ```

3. **Xử Lý Backend**
   - Truy vấn bảng `users` trong database
   - Xác thực mật khẩu（bcrypt.compare）
   - Tạo JWT TOKEN
   - Trả về thông tin người dùng và TOKEN

4. **Phản Hồi Backend**
   ```json
   {
     "success": true,
     "message": "Đăng nhập thành công",
     "data": {
       "user": {
         "id": 1,
         "username": "admin",
         "realName": "Quản Trị Viên Hệ Thống",
         "email": "admin@example.com",
         "role": "super_admin",
         "status": "active",
         ...
       },
       "tokens": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
     }
   }
   ```

5. **Xử Lý Frontend**
   - `apiService.post()` trích xuất `response.data.data`
   - `authApiService.login()` trả về `{ user, tokens }`
   - `user.ts` trích xuất TOKEN từ `response.tokens.accessToken`
   - Lưu vào `localStorage.setItem('auth_token', token)`

## 🔐 Cơ Chế Xác Thực TOKEN

### Tạo TOKEN（Backend）
```typescript
// backend/src/config/jwt.ts
static generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',  // Hiệu lực 7 ngày
    issuer: 'crm-system',
    audience: 'crm-users'
  })
}
```

### Sử Dụng TOKEN（Frontend）
```typescript
// src/services/apiService.ts
private setupInterceptors(): void {
  this.axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}
```

### Xác Thực TOKEN（Backend）
```typescript
// backend/src/middleware/auth.ts
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const payload = JwtConfig.verifyAccessToken(token)
  req.currentUser = payload
  next()
}
```

## 📝 Log Đầu Ra

### Log Đăng Nhập Thành Công
```
[Auth] Sử dụng backend API thật đăng nhập: admin
[Auth] Đăng nhập API thật thành công，TOKEN đã lấy được
[Auth] Người dùng: Quản Trị Viên Hệ Thống
[Auth] TOKEN: eyJhbGciOiJIUzI1NiIsInR5cCI6...
[Auth] ========== Bắt đầu trích xuất Token ==========
[Auth] Đối tượng response đầy đủ: { user: {...}, tokens: {...} }
[Auth] accessToken trích xuất được: eyJhbGciOiJIUzI1NiIsInR5cCI6...
[Auth] ✅ Token đã được thiết lập: eyJhbGciOiJIUzI1NiIsInR5cCI6...
[Auth] ✅ localStorage đã lưu: eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

## ⚠️ Lưu Ý

### 1. Đảm Bảo Backend Service Đang Chạy
```bash
# Kiểm tra trạng thái backend service
pm2 status

# Xem log backend
pm2 logs crm-backend
```

### 2. Đảm Bảo Kết Nối Database Bình Thường
```bash
# Test kết nối database
node test-db-connection.cjs
```

### 3. Đảm Bảo Dữ Liệu Người Dùng Tồn Tại
```sql
-- Truy vấn bảng người dùng
SELECT id, username, realName, role, status FROM users;

-- Reset mật khẩu quản trị viên（nếu cần）
UPDATE users SET password = '$2a$10$...' WHERE username = 'admin';
```

### 4. Xóa Cache Trình Duyệt
- Nhấn `Ctrl + Shift + Delete` để xóa cache
- Hoặc nhấn `Ctrl + Shift + R` để làm mới cưỡng bức

### 5. Vô Hiệu Hóa Chế Độ Mock（Nếu Được Bật）
```javascript
// Thực thi trong console trình duyệt
localStorage.removeItem('erp_mock_enabled')
location.reload()
```

## 🎯 Các Bước Xác Minh

1. **Mở console trình duyệt**（F12）
2. **Truy cập trang đăng nhập**
3. **Nhập tên đăng nhập mật khẩu trong database**
4. **Xem log console**：
   - Nên thấy `[Auth] Sử dụng backend API thật đăng nhập`
   - Nên thấy `[Auth] Đăng nhập API thật thành công，TOKEN đã lấy được`
   - Nên thấy chuỗi TOKEN đầy đủ
5. **Xem tab Network**：
   - URL request nên là `/api/v1/auth/login`
   - Response nên chứa `user` và `tokens`
6. **Xem tab Application**：
   - Local Storage nên có `auth_token`
   - Giá trị nên là chuỗi dài định dạng JWT

## 🚀 Danh Sách Kiểm Tra Sau Khi Triển Khai

- [ ] Backend service chạy bình thường
- [ ] Kết nối database bình thường
- [ ] Dữ liệu người dùng tồn tại và mật khẩu đúng
- [ ] Frontend build thành công
- [ ] Cache trình duyệt đã xóa
- [ ] Chế độ Mock đã vô hiệu hóa
- [ ] Đăng nhập thành công và lấy được TOKEN
- [ ] TOKEN đã lưu vào localStorage
- [ ] Request API sau đó mang theo TOKEN

## 📞 Xử Lý Sự Cố

Nếu đăng nhập thất bại，vui lòng kiểm tra：

1. **Thông tin lỗi console**
2. **Phản hồi request trong tab Network**
3. **Log backend**：`pm2 logs crm-backend`
4. **Dữ liệu người dùng database**
5. **TOKEN có được lưu đúng không**

Tất cả vấn đề đều nên có đầu ra log chi tiết trong console！
