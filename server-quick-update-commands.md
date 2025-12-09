# Lệnh Cập Nhật Nhanh Server

## Vấn Đề Hiện Tại
Backend service khởi động thất bại，vì code tham chiếu file route không tồn tại（profileRoutes）

## Nội Dung Đã Sửa
✅ Đã loại bỏ import và sử dụng `mockAuthRoutes`
✅ Đã loại bỏ import và sử dụng `profileRoutes`（file không tồn tại）
✅ Code đã commit lên GitHub

## Các Bước Cập Nhật Server

### 1. SSH Đăng Nhập Server Bảo Tháp
```bash
ssh root@IP_server_của_bạn
```

### 2. Vào Thư Mục Dự Án
```bash
cd /www/wwwroot/abc789.cn
# Hoặc đường dẫn dự án thực tế của bạn
```

### 3. Pull Code Mới Nhất
```bash
git pull origin main
```

### 4. Khởi Động Lại Backend Service
```bash
cd backend
pm2 restart crm-backend
```

### 5. Xem Trạng Thái Service
```bash
pm2 logs crm-backend --lines 50
```

### 6. Kiểm Tra Service Có Bình Thường Không
```bash
curl http://localhost:3000/health
```

Nên trả về：
```json
{"success":true,"message":"CRM API service đang chạy bình thường",...}
```

## Nếu Vẫn Có Vấn Đề

### Kiểm Tra Kết Nối Database
```bash
cd /www/wwwroot/abc789.cn/backend
cat .env | grep DB_
```

Xác nhận：
- DB_TYPE=mysql
- DB_HOST=localhost
- DB_DATABASE=abc789_cn
- DB_USERNAME=abc789_cn
- DB_PASSWORD=（Mật khẩu của bạn）

### Xem Log Đầy Đủ
```bash
pm2 logs crm-backend --lines 100
```

### Cài Đặt Lại Dependencies（Nếu Cần）
```bash
cd /www/wwwroot/abc789.cn/backend
npm install --production
pm2 restart crm-backend
```

## Test Chức Năng Tạo

Sau khi service khởi động thành công，truy cập website：
1. Đăng nhập hệ thống（superadmin / super123456）
2. Thử tạo phòng ban
3. Thử tạo khách hàng
4. Thử tạo đơn hàng

Tất cả thao tác tạo đều nên hoạt động bình thường！

## Lệnh Thường Dùng

```bash
# Xem tất cả process PM2
pm2 list

# Khởi động lại service
pm2 restart crm-backend

# Dừng service
pm2 stop crm-backend

# Xem log real-time
pm2 logs crm-backend

# Xem chi tiết service
pm2 show crm-backend
```
