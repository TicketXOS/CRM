# Tài Liệu Hướng Dẫn Database

## 📋 Tổng Quan

Thư mục này chứa script khởi tạo database và tài liệu liên quan của hệ thống CRM.

## 📁 Mô Tả File

### schema.sql（Khuyến nghị sử dụng）
- **Phiên bản mới nhất**：1.8.0
- **Thời gian cập nhật**：2024-11-23
- **Mô tả**：Cấu trúc database đầy đủ và dữ liệu khởi tạo
- **Nội dung bao gồm**：
  - 29 bảng dữ liệu core
  - 5 tài khoản người dùng mặc định
  - 3 phòng ban mặc định
  - 5 vai trò mặc định
  - 4 danh mục sản phẩm
  - 7 cấu hình hệ thống

### bt_panel_setup.sql（Phiên bản cũ）
- **Phiên bản**：1.0
- **Thời gian cập nhật**：2024-01-15
- **Mô tả**：Script database phiên bản cũ，chỉ để tham khảo
- **Không khuyến nghị sử dụng**：Cấu trúc dữ liệu đã lỗi thời

---

## 🗄️ Cấu Trúc Bảng Database

### 1. Bảng Core（5 bảng）

#### departments - Bảng phòng ban
```sql
- id: ID phòng ban (VARCHAR(50))
- name: Tên phòng ban
- description: Mô tả phòng ban
- parent_id: ID phòng ban cấp trên
- manager_id: ID trưởng phòng ban
- level: Cấp độ phòng ban
- member_count: Số lượng thành viên
- status: Trạng thái (active/inactive)
```

#### roles - Bảng vai trò
```sql
- id: ID vai trò (VARCHAR(50))
- name: Tên vai trò
- code: Mã vai trò (duy nhất)
- description: Mô tả vai trò
- permissions: Danh sách quyền (JSON)
- user_count: Số lượng người dùng
- status: Trạng thái
```

#### users - Bảng người dùng
```sql
- id: ID người dùng (VARCHAR(50))
- username: Tên đăng nhập (duy nhất)
- password: Mật khẩu
- name: Họ tên
- email: Email
- phone: Số điện thoại
- role: Vai trò
- role_id: ID vai trò
- department_id: ID phòng ban
- position: Chức vụ
- employee_number: Mã nhân viên
- status: Trạng thái
```

#### customers - Bảng khách hàng
```sql
- id: ID khách hàng (VARCHAR(50))
- name: Tên khách hàng
- phone: Số điện thoại
- wechat: WeChat ID
- email: Email
- address: Địa chỉ
- level: Cấp độ khách hàng (normal/silver/gold)
- status: Trạng thái
- tags: Nhãn (JSON)
- sales_person_id: ID nhân viên bán hàng
- order_count: Số lượng đơn hàng
- total_amount: Tổng số tiền đã chi
```

#### orders - Bảng đơn hàng
```sql
- id: ID đơn hàng (VARCHAR(50))
- order_number: Số đơn hàng (duy nhất)
- customer_id: ID khách hàng
- service_wechat: WeChat ID dịch vụ khách hàng ✨Mới
- order_source: Nguồn đơn hàng ✨Mới
- products: Danh sách sản phẩm (JSON)
- total_amount: Tổng tiền đơn hàng
- deposit_amount: Số tiền đặt cọc ✨Mới
- deposit_screenshots: Ảnh chụp đặt cọc (JSON) ✨Mới
- final_amount: Số tiền thực tế thanh toán
- status: Trạng thái đơn hàng
- payment_status: Trạng thái thanh toán
- shipping_address: Địa chỉ nhận hàng
- express_company: Công ty vận chuyển ✨Mới
- mark_type: Loại đánh dấu đơn hàng ✨Mới
- custom_fields: Trường tùy chỉnh (JSON) ✨Mới
```

### 2. Bảng Nghiệp Vụ（5 bảng）

- **product_categories** - Bảng danh mục sản phẩm
- **products** - Bảng sản phẩm
- **logistics** - Bảng logistics
- **service_records** - Bảng dịch vụ sau bán hàng
- **data_records** - Bảng dữ liệu

### 3. Bảng Thống Kê（2 bảng）

- **performance_records** - Bảng thành tích
- **operation_logs** - Bảng log thao tác

### 4. Bảng Cấu Hình（3 bảng）

- **customer_tags** - Bảng nhãn khách hàng
- **customer_groups** - Bảng nhóm khách hàng
- **system_configs** - Bảng cấu hình hệ thống

### 5. Bảng Quản Lý Cuộc Gọi（2 bảng）✨Mới

#### call_records - Bảng ghi chép cuộc gọi
```sql
- id: ID cuộc gọi (VARCHAR(50))
- customer_id: ID khách hàng
- customer_name: Tên khách hàng
- customer_phone: Số điện thoại khách hàng
- call_type: Loại cuộc gọi (outbound/inbound)
- call_status: Trạng thái cuộc gọi (connected/missed/busy/failed/rejected)
- start_time: Thời gian bắt đầu
- end_time: Thời gian kết thúc
- duration: Thời lượng cuộc gọi(giây)
- recording_url: URL file ghi âm
- notes: Ghi chú cuộc gọi
- follow_up_required: Có cần theo dõi không
- user_id: ID người vận hành
- user_name: Tên người vận hành
- department: Phòng ban
```

#### follow_up_records - Bảng ghi chép theo dõi
```sql
- id: ID theo dõi (VARCHAR(50))
- call_id: ID cuộc gọi liên quan
- customer_id: ID khách hàng
- customer_name: Tên khách hàng
- follow_up_type: Cách thức theo dõi (call/visit/email/message)
- content: Nội dung theo dõi
- next_follow_up_date: Thời gian theo dõi tiếp theo
- priority: Mức độ ưu tiên (low/medium/high/urgent)
- status: Trạng thái (pending/completed/cancelled)
- user_id: ID người theo dõi
- user_name: Tên người theo dõi
```

### 6. Bảng Quản Lý SMS（2 bảng）✨Mới

#### sms_templates - Bảng mẫu SMS
```sql
- id: ID mẫu (VARCHAR(50))
- name: Tên mẫu
- category: Phân loại mẫu
- content: Nội dung mẫu
- variables: Danh sách biến (JSON)
- description: Mô tả mẫu
- applicant: ID người đăng ký
- applicant_name: Tên người đăng ký
- applicant_dept: Phòng ban người đăng ký
- status: Trạng thái phê duyệt (pending/approved/rejected)
- approved_by: ID người phê duyệt
- approved_at: Thời gian phê duyệt
- is_system: Có phải mẫu hệ thống không
```

#### sms_records - Bảng ghi chép gửi SMS
```sql
- id: ID ghi chép (VARCHAR(50))
- template_id: ID mẫu
- template_name: Tên mẫu
- content: Nội dung SMS
- recipients: Danh sách người nhận (JSON)
- recipient_count: Số lượng người nhận
- success_count: Số lượng thành công
- fail_count: Số lượng thất bại
- status: Trạng thái gửi (pending/sending/completed/failed)
- send_details: Chi tiết gửi (JSON)
- applicant: ID người đăng ký
- applicant_name: Tên người đăng ký
- applicant_dept: Phòng ban người đăng ký
- approved_by: ID người phê duyệt
- approved_at: Thời gian phê duyệt
- sent_at: Thời gian gửi
- remark: Ghi chú
```

### 7. Bảng Thông Báo（2 bảng）✨Mới

#### notifications - Bảng thông báo
```sql
- id: ID thông báo (VARCHAR(50))
- user_id: ID người dùng nhận
- type: Loại tin nhắn
- title: Tiêu đề tin nhắn
- content: Nội dung tin nhắn
- category: Phân loại tin nhắn
- priority: Mức độ ưu tiên (low/normal/high/urgent)
- is_read: Đã đọc chưa
- read_at: Thời gian đọc
- related_id: ID nghiệp vụ liên quan
- related_type: Loại nghiệp vụ liên quan
- action_url: Link thao tác
- icon: Icon
- color: Màu sắc
```

#### system_announcements - Bảng thông báo hệ thống
```sql
- id: ID thông báo (VARCHAR(50))
- title: Tiêu đề thông báo
- content: Nội dung thông báo
- type: Loại thông báo (system/maintenance/update/notice)
- priority: Mức độ ưu tiên
- status: Trạng thái (draft/published/archived)
- target_users: Người dùng mục tiêu (JSON)
- target_roles: Vai trò mục tiêu (JSON)
- target_departments: Phòng ban mục tiêu (JSON)
- publish_time: Thời gian phát hành
- expire_time: Thời gian hết hạn
- is_popup: Có hiển thị popup không
- is_top: Có ghim không
- read_count: Số lần đọc
- attachments: Danh sách đính kèm (JSON)
- created_by: ID người tạo
- created_by_name: Tên người tạo
```

### 8. Bảng Phê Duyệt Đơn Hàng（1 bảng）✨Mới

#### order_audits - Bảng ghi chép phê duyệt đơn hàng
```sql
- id: ID phê duyệt (VARCHAR(50))
- order_id: ID đơn hàng
- order_number: Số đơn hàng
- audit_type: Loại phê duyệt (create/modify/cancel/return)
- audit_status: Trạng thái phê duyệt (pending/approved/rejected)
- audit_level: Cấp độ phê duyệt
- auditor_id: ID người phê duyệt
- auditor_name: Tên người phê duyệt
- audit_time: Thời gian phê duyệt
- audit_result: Kết quả phê duyệt
- audit_remark: Ghi chú phê duyệt
- before_data: Dữ liệu trước khi sửa (JSON)
- after_data: Dữ liệu sau khi sửa (JSON)
- applicant_id: ID người đăng ký
- applicant_name: Tên người đăng ký
- apply_reason: Lý do đăng ký
- apply_time: Thời gian đăng ký
```

### 9. Bảng Chia Sẻ Thành Tích（2 bảng）✨Mới

#### performance_shares - Bảng ghi chép chia sẻ thành tích
```sql
- id: ID chia sẻ (VARCHAR(50))
- share_number: Số chia sẻ
- order_id: ID đơn hàng
- order_number: Số đơn hàng
- order_amount: Số tiền đơn hàng
- total_share_amount: Tổng số tiền chia sẻ
- share_count: Số người chia sẻ
- status: Trạng thái (active/completed/cancelled)
- description: Mô tả chia sẻ
- created_by: ID người tạo
- created_by_name: Tên người tạo
- completed_at: Thời gian hoàn thành
- cancelled_at: Thời gian hủy
```

#### performance_share_members - Bảng thành viên chia sẻ thành tích
```sql
- id: ID thành viên (VARCHAR(50))
- share_id: ID ghi chép chia sẻ
- user_id: ID người dùng
- user_name: Tên người dùng
- department: Phòng ban
- share_percentage: Tỷ lệ chia sẻ
- share_amount: Số tiền chia sẻ
- status: Trạng thái xác nhận (pending/confirmed/rejected)
- confirm_time: Thời gian xác nhận
- reject_reason: Lý do từ chối
```

### 10. Bảng Mở Rộng Logistics（4 bảng）✨Mới

#### logistics_companies - Bảng công ty logistics
```sql
- id: ID công ty (VARCHAR(50))
- code: Mã công ty
- name: Tên công ty
- short_name: Tên viết tắt công ty
- logo: URL Logo
- website: Địa chỉ website
- tracking_url: Địa chỉ tra cứu theo dõi
- api_url: Địa chỉ API
- api_key: API key
- api_secret: API secret
- contact_phone: Số điện thoại liên hệ
- contact_email: Email liên hệ
- service_area: Khu vực dịch vụ
- price_info: Thông tin giá (JSON)
- status: Trạng thái (active/inactive)
- sort_order: Sắp xếp
- remark: Ghi chú
```

#### logistics_status_history - Bảng lịch sử trạng thái logistics
```sql
- id: ID lịch sử (VARCHAR(50))
- logistics_id: ID ghi chép logistics
- order_id: ID đơn hàng
- order_number: Số đơn hàng
- tracking_number: Số đơn logistics
- old_status: Trạng thái cũ
- new_status: Trạng thái mới
- status_text: Mô tả trạng thái
- location: Vị trí hiện tại
- operator: Người vận hành
- operator_name: Tên người vận hành
- update_source: Nguồn cập nhật (manual/auto/api)
- remark: Ghi chú
```

#### logistics_exceptions - Bảng ghi chép ngoại lệ logistics
```sql
- id: ID ngoại lệ (VARCHAR(50))
- logistics_id: ID ghi chép logistics
- order_id: ID đơn hàng
- order_number: Số đơn hàng
- tracking_number: Số đơn logistics
- exception_type: Loại ngoại lệ
- exception_desc: Mô tả ngoại lệ
- exception_time: Thời gian ngoại lệ
- status: Trạng thái xử lý (pending/processing/resolved/closed)
- handler_id: ID người xử lý
- handler_name: Tên người xử lý
- handle_time: Thời gian xử lý
- handle_result: Kết quả xử lý
- solution: Giải pháp
- images: Ảnh liên quan (JSON)
```

#### logistics_todos - Bảng công việc cần làm logistics
```sql
- id: ID công việc (VARCHAR(50))
- logistics_id: ID ghi chép logistics
- order_id: ID đơn hàng
- order_number: Số đơn hàng
- tracking_number: Số đơn logistics
- todo_type: Loại công việc
- todo_title: Tiêu đề công việc
- todo_content: Nội dung công việc
- priority: Mức độ ưu tiên (low/normal/high/urgent)
- status: Trạng thái (pending/processing/completed/cancelled)
- assigned_to: ID người phụ trách
- assigned_to_name: Tên người phụ trách
- due_date: Thời hạn
- remind_time: Thời gian nhắc nhở
- completed_time: Thời gian hoàn thành
- remark: Ghi chú
- created_by: ID người tạo
- created_by_name: Tên người tạo
```

### 11. Bảng Cấu Hình Đơn Hàng（1 bảng）✨Mới

#### order_field_configs - Bảng cấu hình trường đơn hàng
```sql
- id: ID cấu hình (VARCHAR(50))
- field_key: Tên khóa trường
- field_name: Tên trường
- field_type: Loại trường (text/number/date/datetime/select/radio/checkbox)
- field_options: Tùy chọn trường (JSON)
- default_value: Giá trị mặc định
- placeholder: Placeholder
- is_required: Có bắt buộc không
- is_visible: Có hiển thị không
- show_in_list: Hiển thị trong danh sách
- show_in_detail: Hiển thị trong chi tiết
- sort_order: Sắp xếp
- validation_rules: Quy tắc xác thực (JSON)
- description: Mô tả trường
```

---

## 👥 Tài Khoản Mặc Định

Hệ thống đã thiết lập sẵn 5 tài khoản test，mật khẩu được lưu dạng plaintext（môi trường production vui lòng sửa đổi）：

| Tên đăng nhập | Mật khẩu | Vai trò | Phòng ban | Mô tả |
|--------|------|------|------|------|
| superadmin | super123456 | Siêu quản trị viên | Phòng quản lý hệ thống | Có tất cả quyền |
| admin | admin123 | Quản trị viên | Phòng quản lý | Có tất cả quyền |
| manager | manager123 | Trưởng phòng ban | Phòng bán hàng | Quản lý nghiệp vụ phòng ban |
| sales | sales123 | Nhân viên bán hàng | Phòng bán hàng | Quản lý khách hàng và đơn hàng |
| service | service123 | Dịch vụ khách hàng | Phòng dịch vụ khách hàng | Xử lý đơn hàng và dịch vụ sau bán hàng |

**Lưu ý bảo mật**：
- Môi trường production vui lòng sửa đổi mật khẩu của tất cả tài khoản mặc định ngay lập tức
- Mật khẩu nên được lưu trữ bằng bcrypt encryption
- Khuyến nghị mật khẩu ít nhất 8 ký tự，bao gồm chữ hoa，chữ thường，số và ký tự đặc biệt

---

## 🏢 Phòng Ban Mặc Định

| ID Phòng ban | Tên phòng ban | Mô tả | Số thành viên |
|--------|----------|------|--------|
| dept_001 | Phòng quản lý hệ thống | Quản lý và bảo trì hệ thống | 2 |
| dept_002 | Phòng bán hàng | Bán sản phẩm và duy trì khách hàng | 2 |
| dept_003 | Phòng dịch vụ khách hàng | Dịch vụ khách hàng và hỗ trợ sau bán hàng | 1 |

---

## 🎭 Vai Trò Mặc Định

| ID Vai trò | Tên vai trò | Mã vai trò | Phạm vi quyền |
|--------|----------|----------|----------|
| super_admin | Siêu quản trị viên | super_admin | Tất cả quyền (*) |
| admin | Quản trị viên | admin | Tất cả quyền (*) |
| department_manager | Trưởng phòng ban | department_manager | Quản lý nghiệp vụ phòng ban |
| sales_staff | Nhân viên bán hàng | sales_staff | Quản lý khách hàng và đơn hàng |
| customer_service | Dịch vụ khách hàng | customer_service | Xử lý đơn hàng và dịch vụ sau bán hàng |

---

## 📦 Cách Sử Dụng

### Cách 1：Import qua Bảng Điều Khiển Bảo Tháp（Khuyến nghị）

1. Đăng nhập bảng điều khiển Bảo Tháp
2. Vào "Database"
3. Chọn database của bạn（ví dụ `crm_db`）
4. Click "Quản lý"
5. Click "Import"
6. Upload file `schema.sql`
7. Click nút "Import"

### Cách 2：Import qua Command Line

```bash
# Phương pháp 1：Sử dụng lệnh mysql
mysql -u crm_user -p crm_db < database/schema.sql

# Phương pháp 2：Đăng nhập rồi import
mysql -u crm_user -p
use crm_db;
source /path/to/database/schema.sql;
```

### Cách 3：Import qua phpMyAdmin

1. Đăng nhập phpMyAdmin
2. Chọn database `crm_db`
3. Click tab "Import"
4. Chọn file `schema.sql`
5. Click "Thực thi"

---

## ⚙️ Khuyến Nghị Cấu Hình Database

### Tối Ưu Cấu Hình MySQL

```ini
[mysqld]
# Cấu hình character set
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# Cấu hình hiệu suất
innodb_buffer_pool_size=128M
max_connections=200
query_cache_size=32M

# Cấu hình múi giờ
default-time-zone='+08:00'

# Cấu hình log
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow.log
long_query_time=2
```

### Cấu Hình Bảng Điều Khiển Bảo Tháp

1. **Character set**：utf8mb4
2. **Collation**：utf8mb4_unicode_ci
3. **Múi giờ**：Asia/Shanghai
4. **Số kết nối tối đa**：200
5. **Kích thước buffer pool**：128M（điều chỉnh theo bộ nhớ server）

---

## 🔒 Khuyến Nghị Bảo Mật

### 1. Quyền Người Dùng Database

```sql
-- Tạo người dùng database chuyên dụng（không sử dụng root）
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'Mật khẩu mạnh';

-- Cấp quyền cần thiết
GRANT SELECT, INSERT, UPDATE, DELETE ON crm_db.* TO 'crm_user'@'localhost';

-- Làm mới quyền
FLUSH PRIVILEGES;
```

### 2. Bảo Mật Mật Khẩu

- ✅ Sử dụng mật khẩu mạnh（ít nhất 12 ký tự）
- ✅ Đổi mật khẩu định kỳ
- ✅ Không hardcode mật khẩu trong code
- ✅ Sử dụng biến môi trường để lưu trữ mật khẩu

### 3. Kiểm Soát Truy Cập

- ✅ Giới hạn truy cập từ xa
- ✅ Sử dụng quy tắc firewall
- ✅ Bật kết nối SSL
- ✅ Xem xét log truy cập định kỳ

---

## 💾 Khuyến Nghị Backup

### Cấu Hình Backup Tự Động

1. **Tần suất backup**：2:00 sáng mỗi ngày
2. **Số ngày lưu trữ**：30 ngày
3. **Vị trí backup**：/www/backup/database/
4. **Phương thức backup**：Full backup

### Lệnh Backup Thủ Công

```bash
# Backup toàn bộ database
mysqldump -u crm_user -p crm_db > backup_$(date +%Y%m%d).sql

# Backup bảng chỉ định
mysqldump -u crm_user -p crm_db users customers orders > backup_core_$(date +%Y%m%d).sql

# Backup nén
mysqldump -u crm_user -p crm_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Khôi Phục Dữ Liệu

```bash
# Khôi phục database
mysql -u crm_user -p crm_db < backup_20241123.sql

# Khôi phục backup nén
gunzip < backup_20241123.sql.gz | mysql -u crm_user -p crm_db
```

---

## 🔧 Lệnh Bảo Trì

### Tối Ưu Bảng

```sql
-- Tối ưu tất cả bảng
OPTIMIZE TABLE customers, orders, products, users;

-- Phân tích thống kê bảng
ANALYZE TABLE customers, orders, products, users;

-- Kiểm tra bảng
CHECK TABLE customers, orders, products, users;

-- Sửa chữa bảng
REPAIR TABLE customers, orders, products, users;
```

### Xem Thông Tin Bảng

```sql
-- Xem kích thước bảng
SELECT 
  table_name AS 'Tên bảng',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Kích thước(MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'crm_db'
ORDER BY (data_length + index_length) DESC;

-- Xem số dòng bảng
SELECT 
  table_name AS 'Tên bảng',
  table_rows AS 'Số dòng'
FROM information_schema.TABLES 
WHERE table_schema = 'crm_db'
ORDER BY table_rows DESC;

-- Xem tình trạng sử dụng index
SHOW INDEX FROM customers;
```

---

## 📊 Giám Sát Hiệu Suất

### Giám Sát Slow Query

```sql
-- Xem slow query log
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- Xem kết nối hiện tại
SHOW PROCESSLIST;

-- Xem tình trạng khóa bảng
SHOW OPEN TABLES WHERE In_use > 0;
```

### Phân Tích Hiệu Suất

```sql
-- Phân tích hiệu suất truy vấn
EXPLAIN SELECT * FROM customers WHERE phone = '13800138000';

-- Xem query cache
SHOW STATUS LIKE 'Qcache%';

-- Xem trạng thái InnoDB
SHOW ENGINE INNODB STATUS;
```

---

## 🆘 Câu Hỏi Thường Gặp

### Q1: Import thất bại，báo lỗi character set？
**A**: Đảm bảo character set của database là utf8mb4：
```sql
ALTER DATABASE crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Q2: Import thất bại，báo lỗi foreign key constraint？
**A**: Script đã bao gồm `SET FOREIGN_KEY_CHECKS = 0;`，nếu vẫn có vấn đề，thực thi thủ công：
```sql
SET FOREIGN_KEY_CHECKS = 0;
SOURCE schema.sql;
SET FOREIGN_KEY_CHECKS = 1;
```

### Q3: Làm thế nào để reset database？
**A**: Xóa tất cả bảng rồi import lại：
```sql
DROP DATABASE crm_db;
CREATE DATABASE crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_db;
SOURCE schema.sql;
```

### Q4: Làm thế nào để sửa mật khẩu tài khoản mặc định？
**A**: 
```sql
-- Trong môi trường production，mật khẩu nên được mã hóa bằng bcrypt
-- Đây chỉ là ví dụ，thực tế nên sửa qua ứng dụng
UPDATE users SET password = 'Mật khẩu mới' WHERE username = 'admin';
```

---

## 📝 Changelog

### v1.8.0 (2024-11-23)
- ✅ Cập nhật cấu trúc tất cả bảng，sử dụng VARCHAR(50) làm primary key
- ✅ Thêm tài khoản mặc định đầy đủ（5 tài khoản）
- ✅ Thêm vai trò mặc định（5 vai trò）
- ✅ Thêm phòng ban mặc định（3 phòng ban）
- ✅ Tối ưu cấu trúc index
- ✅ Thêm hỗ trợ trường JSON
- ✅ Hoàn thiện mô tả comment

### v1.0 (2024-01-15)
- Phiên bản ban đầu

---

## 📞 Hỗ Trợ Kỹ Thuật

Nếu gặp vấn đề liên quan đến database，vui lòng cung cấp：
1. Phiên bản MySQL（`SELECT VERSION();`）
2. Thông tin lỗi
3. Các bước thao tác
4. Cấu hình database

GitHub Issues: https://github.com/mrtinhnguyen/CRM/issues
