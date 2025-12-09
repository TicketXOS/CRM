# CRM - Hệ Thống Bán Hàng Thông Minh
Hệ thống CRM bán hàng thông minh, công cụ quản lý bán hàng tư nhân tuyệt vời! Giao diện đơn giản, sang trọng, dễ sử dụng, đầy đủ tính năng!

## 🚀 Giới Thiệu Dự Án

Đây là hệ thống quản lý quan hệ khách hàng CRM hiện đại được phát triển dựa trên Vue 3 + TypeScript + Node.js, được thiết kế chuyên biệt cho quản lý bán hàng tư nhân của các doanh nghiệp vừa và nhỏ.

## ✨ Tính Năng Chính

- 🏢 **Quản Lý Khách Hàng** - Hệ thống quản lý thông tin khách hàng, nhóm, nhãn đầy đủ
- 📋 **Quản Lý Đơn Hàng** - Tạo đơn hàng, theo dõi, quản lý trạng thái
- 📊 **Phân Tích Dữ Liệu** - Thống kê dữ liệu bán hàng, phân tích hiệu suất, hiển thị biểu đồ
- 👥 **Quản Lý Quyền** - Kiểm soát quyền đa vai trò, quản lý phòng ban
- 📱 **Hỗ Trợ Di Động** - Thiết kế responsive, hỗ trợ thiết bị di động
- 🔔 **Thông Báo** - Thông báo hệ thống, chức năng thông báo SMS
- 📞 **Quản Lý Cuộc Gọi** - Quản lý ghi âm, lịch sử cuộc gọi
- 🚚 **Quản Lý Logistics** - Theo dõi logistics đơn hàng

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Vue 3** - Framework JavaScript tiến bộ
- **TypeScript** - JavaScript an toàn kiểu
- **Element Plus** - Thư viện component UI Vue 3
- **Vite** - Công cụ build hiện đại
- **Pinia** - Quản lý trạng thái Vue

### Backend
- **Node.js** - Runtime JavaScript
- **TypeScript** - Phát triển an toàn kiểu
- **Express** - Framework ứng dụng Web
- **TypeORM** - Ánh xạ quan hệ đối tượng
- **MySQL/MariaDB** - Cơ sở dữ liệu quan hệ

### Triển Khai
- **CentOS 7** - Hệ điều hành máy chủ
- **Bảng Điều Khiển Bảo Tháp** - Bảng quản lý máy chủ
- **Nginx** - Máy chủ Web và reverse proxy
- **PM2** - Quản lý tiến trình Node.js

## 📦 Bắt Đầu Nhanh

### Yêu Cầu Môi Trường
- Node.js 18+
- MySQL 8.0+ hoặc MariaDB 10.6+
- Git

### Phát Triển Local

1. **Clone dự án**
```bash
git clone https://github.com/mrtinhnguyen/CRM.git
cd CRM
```

2. **Cài đặt dependencies frontend**
```bash
npm install
```

3. **Cài đặt dependencies backend**
```bash
cd backend
npm install
```

4. **Cấu hình biến môi trường**
```bash
# Sao chép file biến môi trường
cp backend/.env.example backend/.env
# Chỉnh sửa cấu hình database
```

5. **Khởi động dịch vụ phát triển**
```bash
# Khởi động dịch vụ phát triển frontend
npm run dev

# Khởi động dịch vụ backend
cd backend
npm run dev
```

### Triển Khai Production

Vui lòng tham khảo hướng dẫn triển khai chi tiết:
- [Hướng Dẫn Triển Khai](./deployment-guide.md)
- [Hướng Dẫn Cập Nhật Code](./update-guide.md)
- [Hướng Dẫn Cấu Hình Môi Trường](./HUONG_DAN_CAU_HINH_MOI_TRUONG.md)

### Triển Khai Database (Remote MySQL)

Hệ thống cung cấp script để triển khai database trên remote MySQL server:

#### Linux/Mac (Bash Script)

```bash
# Cấp quyền thực thi
chmod +x database/deploy-mysql.sh

# Chạy schema.sql trên remote MySQL
./database/deploy-mysql.sh \
  -h 192.168.1.100 \
  -u root \
  -p your_password \
  -d crm_db \
  -f schema.sql

# Chạy tất cả file SQL trong thư mục
./database/deploy-mysql.sh \
  -h 192.168.1.100 \
  -u root \
  -p your_password \
  -d crm_db \
  -D database

# Không tạo backup
./database/deploy-mysql.sh \
  -h 192.168.1.100 \
  -u root \
  -p your_password \
  -d crm_db \
  -f schema.sql \
  --no-backup
```

#### Windows (PowerShell Script)

```powershell
# Chạy schema.sql trên remote MySQL
.\database\deploy-mysql.ps1 `
  -DbHost 192.168.1.100 `
  -User root `
  -Password your_password `
  -Database crm_db `
  -File schema.sql

# Chạy tất cả file SQL trong thư mục
.\database\deploy-mysql.ps1 `
  -DbHost 192.168.1.100 `
  -User root `
  -Password your_password `
  -Database crm_db `
  -Dir database

# Không tạo backup
.\database\deploy-mysql.ps1 `
  -Host 192.168.1.100 `
  -User root `
  -Password your_password `
  -Database crm_db `
  -File schema.sql `
  -NoBackup
```

#### Tính Năng Script

- ✅ Kết nối remote MySQL server
- ✅ Tự động tạo database nếu chưa tồn tại
- ✅ Tự động backup trước khi chạy migration
- ✅ Hỗ trợ chạy file SQL đơn lẻ hoặc thư mục
- ✅ Log chi tiết và xử lý lỗi
- ✅ Hỗ trợ cả Linux/Mac và Windows

Xem thêm chi tiết: [Tài Liệu Database](./database/README.md)

## 📁 Cấu Trúc Dự Án

```
CRM/
├── src/                    # Mã nguồn frontend
│   ├── components/         # Component Vue
│   ├── views/             # View trang
│   ├── api/               # Interface API
│   ├── stores/            # Quản lý trạng thái
│   └── utils/             # Hàm tiện ích
├── backend/               # Mã nguồn backend
│   ├── src/               # Mã nguồn TypeScript
│   ├── database/          # Script database
│   └── uploads/           # Thư mục upload file
├── dist/                  # Sản phẩm build frontend
├── deploy.sh              # Script triển khai Linux
├── centos7-setup.sh       # Chuẩn bị môi trường CentOS 7
└── docs/                  # Tài liệu dự án
```

## 🔧 Lệnh Phát Triển

```bash
# Phát triển frontend
npm run dev              # Khởi động máy chủ phát triển
npm run build            # Build phiên bản production
npm run lint             # Kiểm tra code

# Phát triển backend
cd backend
npm run dev              # Khởi động máy chủ phát triển
npm run build            # Biên dịch TypeScript
npm start                # Khởi động dịch vụ production
```

## 📖 Tài Liệu

- [Hướng Dẫn Triển Khai](./deployment-guide.md)
- [Hướng Dẫn Cập Nhật Code](./update-guide.md)
- [Hướng Dẫn Cấu Hình Môi Trường](./HUONG_DAN_CAU_HINH_MOI_TRUONG.md)
- [Tài Liệu Backend API](./backend/README.md)
- [Tài Liệu Database](./database/README.md)

## 🤝 Đóng Góp

Chào mừng gửi Issue và Pull Request!

## 📄 Giấy Phép

MIT License

## 📞 Hỗ Trợ Kỹ Thuật

Nếu có vấn đề, vui lòng gửi Issue hoặc liên hệ đội phát triển.
