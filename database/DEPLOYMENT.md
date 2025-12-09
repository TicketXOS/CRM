# Hướng Dẫn Triển Khai Database Remote MySQL

## 📋 Tổng Quan

Script này cho phép bạn triển khai database và migration SQL lên remote MySQL server một cách tự động và an toàn.

## ✨ Tính Năng

- ✅ Kết nối remote MySQL server
- ✅ Tự động tạo database nếu chưa tồn tại
- ✅ Tự động backup trước khi chạy migration
- ✅ Hỗ trợ chạy file SQL đơn lẻ hoặc thư mục
- ✅ Log chi tiết và xử lý lỗi
- ✅ Hỗ trợ cả Linux/Mac và Windows

## 🚀 Sử Dụng

### Linux/Mac (Bash Script)

#### Cài Đặt

```bash
# Cấp quyền thực thi
chmod +x database/deploy-mysql.sh
```

#### Các Lệnh Cơ Bản

```bash
# Chạy schema.sql trên remote MySQL
./database/deploy-mysql.sh \
  -h 192.168.1.100 \
  -u root \
  -p your_password \
  -d crm_db \
  -f schema.sql

# Chạy với port tùy chỉnh
./database/deploy-mysql.sh \
  -h 192.168.1.100 \
  -P 3307 \
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

# Không tạo backup (không khuyến nghị)
./database/deploy-mysql.sh \
  -h 192.168.1.100 \
  -u root \
  -p your_password \
  -d crm_db \
  -f schema.sql \
  --no-backup

# Hiển thị log chi tiết
./database/deploy-mysql.sh \
  -h 192.168.1.100 \
  -u root \
  -p your_password \
  -d crm_db \
  -f schema.sql \
  -v

# Xem hướng dẫn
./database/deploy-mysql.sh --help
```

#### Tham Số

| Tham số | Mô tả | Bắt buộc |
|---------|-------|----------|
| `-h, --host` | Địa chỉ MySQL server | ✅ |
| `-P, --port` | Port MySQL (mặc định: 3306) | ❌ |
| `-u, --user` | Tên người dùng MySQL | ✅ |
| `-p, --password` | Mật khẩu MySQL | ✅ |
| `-d, --database` | Tên database | ✅ |
| `-f, --file` | File SQL cần chạy | ❌* |
| `-D, --dir` | Thư mục chứa file SQL | ❌* |
| `-b, --backup-dir` | Thư mục lưu backup | ❌ |
| `--no-backup` | Không tạo backup | ❌ |
| `-v, --verbose` | Hiển thị log chi tiết | ❌ |

*Phải có một trong hai: `-f` hoặc `-D`

### Windows (PowerShell Script)

#### Các Lệnh Cơ Bản

```powershell
# Chạy schema.sql trên remote MySQL
.\database\deploy-mysql.ps1 `
  -DbHost 192.168.1.100 `
  -User root `
  -Password your_password `
  -Database crm_db `
  -File schema.sql

# Chạy với port tùy chỉnh
.\database\deploy-mysql.ps1 `
  -DbHost 192.168.1.100 `
  -Port 3307 `
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

# Không tạo backup (không khuyến nghị)
.\database\deploy-mysql.ps1 `
  -DbHost 192.168.1.100 `
  -User root `
  -Password your_password `
  -Database crm_db `
  -File schema.sql `
  -NoBackup

# Hiển thị log chi tiết
.\database\deploy-mysql.ps1 `
  -DbHost 192.168.1.100 `
  -User root `
  -Password your_password `
  -Database crm_db `
  -File schema.sql `
  -Verbose
```

#### Tham Số

| Tham số | Mô tả | Bắt buộc |
|---------|-------|----------|
| `-DbHost` | Địa chỉ MySQL server | ✅ |
| `-Port` | Port MySQL (mặc định: 3306) | ❌ |
| `-User` | Tên người dùng MySQL | ✅ |
| `-Password` | Mật khẩu MySQL | ✅ |
| `-Database` | Tên database | ✅ |
| `-File` | File SQL cần chạy | ❌* |
| `-Dir` | Thư mục chứa file SQL | ❌* |
| `-BackupDir` | Thư mục lưu backup | ❌ |
| `-NoBackup` | Không tạo backup | ❌ |
| `-Verbose` | Hiển thị log chi tiết | ❌ |

*Phải có một trong hai: `-File` hoặc `-Dir`

## 📝 Ví Dụ Sử Dụng

### Ví Dụ 1: Triển Khai Database Mới

```bash
# Linux/Mac
./database/deploy-mysql.sh \
  -h production-server.com \
  -u crm_user \
  -p secure_password \
  -d crm_production \
  -f database/schema.sql

# Windows
.\database\deploy-mysql.ps1 `
  -DbHost production-server.com `
  -User crm_user `
  -Password secure_password `
  -Database crm_production `
  -File database\schema.sql
```

### Ví Dụ 2: Chạy Migration

```bash
# Linux/Mac - Chạy tất cả migration trong thư mục
./database/deploy-mysql.sh \
  -h production-server.com \
  -u crm_user \
  -p secure_password \
  -d crm_production \
  -D database/migrations

# Windows
.\database\deploy-mysql.ps1 `
  -DbHost production-server.com `
  -User crm_user `
  -Password secure_password `
  -Database crm_production `
  -Dir database\migrations
```

### Ví Dụ 3: Chạy Migration Cụ Thể

```bash
# Linux/Mac
./database/deploy-mysql.sh \
  -h production-server.com \
  -u crm_user \
  -p secure_password \
  -d crm_production \
  -f database/migrations/001_add_new_table.sql

# Windows
.\database\deploy-mysql.ps1 `
  -DbHost production-server.com `
  -User crm_user `
  -Password secure_password `
  -Database crm_production `
  -File database\migrations\001_add_new_table.sql
```

## 🔒 Bảo Mật

### Lưu Ý Quan Trọng

1. **Mật khẩu trong command line**: Mật khẩu có thể hiển thị trong process list. Khuyến nghị sử dụng biến môi trường:

```bash
# Linux/Mac
export MYSQL_PASSWORD="your_password"
./database/deploy-mysql.sh -h server -u user -p "$MYSQL_PASSWORD" -d db -f schema.sql

# Windows PowerShell
$env:DB_PASSWORD = "your_password"
.\database\deploy-mysql.ps1 -DbHost server -User user -Password $env:DB_PASSWORD -Database db -File schema.sql
```

2. **Quyền truy cập**: Đảm bảo user MySQL có quyền:
   - `CREATE DATABASE` (nếu database chưa tồn tại)
   - `CREATE`, `ALTER`, `DROP` (cho migration)
   - `SELECT`, `INSERT`, `UPDATE`, `DELETE` (cho dữ liệu)

3. **Firewall**: Đảm bảo port MySQL (mặc định 3306) được mở trên server.

## 💾 Backup

Script tự động tạo backup trước khi chạy migration:

- **Vị trí backup**: `./backups/backup_[database]_[timestamp].sql`
- **Nén backup**: Tự động nén nếu có gzip (Linux) hoặc Compress-Archive (Windows)
- **Tắt backup**: Sử dụng `--no-backup` (Linux) hoặc `-NoBackup` (Windows)

### Khôi Phục Từ Backup

```bash
# Linux/Mac
mysql -h server -u user -p database < backups/backup_crm_db_20241123_120000.sql

# Windows PowerShell
Get-Content backups\backup_crm_db_20241123_120000.sql | mysql -h server -u user -p database
```

## 🐛 Xử Lý Lỗi

### Lỗi Kết Nối

```
[ERROR] Không thể kết nối đến MySQL server!
```

**Giải pháp**:
1. Kiểm tra địa chỉ server và port
2. Kiểm tra firewall
3. Kiểm tra user và password
4. Kiểm tra MySQL service có đang chạy không

### Lỗi Permission

```
[ERROR] Access denied for user 'xxx'@'xxx'
```

**Giải pháp**:
1. Kiểm tra user có quyền truy cập không
2. Kiểm tra user có quyền tạo database không (nếu database chưa tồn tại)
3. Kiểm tra user có quyền thực thi SQL không

### Lỗi SQL Syntax

```
[ERROR] ❌ Lỗi khi chạy file SQL: schema.sql
```

**Giải pháp**:
1. Kiểm tra file SQL có lỗi syntax không
2. Chạy với `-v` hoặc `-Verbose` để xem log chi tiết
3. Test file SQL trên local MySQL trước

## 📊 Log Output

Script hiển thị log với màu sắc:

- 🟢 **[INFO]**: Thông tin bình thường
- 🟡 **[WARN]**: Cảnh báo
- 🔴 **[ERROR]**: Lỗi
- 🔵 **[DEBUG]**: Debug (chỉ khi dùng `-v` hoặc `-Verbose`)

## 🔧 Yêu Cầu

### Linux/Mac

- MySQL client (`mysql`, `mysqldump`)
- Bash shell
- `gzip` (tùy chọn, để nén backup)

### Windows

- MySQL client (`mysql`, `mysqldump`)
- PowerShell 5.1+
- `Compress-Archive` (PowerShell cmdlet, có sẵn)

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Chạy với `-v` hoặc `-Verbose` để xem log chi tiết
2. Kiểm tra file SQL có lỗi không
3. Kiểm tra kết nối MySQL
4. Xem log backup để xác nhận

GitHub Issues: https://github.com/mrtinhnguyen/CRM/issues

