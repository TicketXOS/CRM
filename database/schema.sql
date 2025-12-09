-- =============================================
-- Script khởi tạo cơ sở dữ liệu CRM (phiên bản mới nhất)
-- Phiên bản: 1.8.1
-- Ngày cập nhật: 2024-12-04
-- Áp dụng cho: MySQL 8.0+ / Bảng điều khiển Bảo Tháp 7.x+
-- 
-- Nội dung cập nhật:
-- 1. Thêm bảng dịch vụ hậu mãi hoàn chỉnh (after_sales_services)
-- 2. Bổ sung trạng thái làm việc, ghi chú... cho bảng người dùng
-- 3. Tích hợp tất cả các script SQL trước đây thành một
-- =============================================

-- Thiết lập bảng mã ký tự và múi giờ
SET NAMES utf8mb4;
SET time_zone = '+08:00';
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- Tạo các bảng dữ liệu cốt lõi
-- =============================================

-- 1. Bảng phòng ban
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID phòng ban',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên phòng ban',
  `code` VARCHAR(50) NULL COMMENT 'Mã phòng ban',
  `description` TEXT COMMENT 'Mô tả phòng ban',
  `parent_id` VARCHAR(50) NULL COMMENT 'ID phòng ban cấp trên',
  `manager_id` VARCHAR(50) NULL COMMENT 'ID trưởng phòng ban',
  `level` INT DEFAULT 1 COMMENT 'Cấp độ phòng ban',
  `sort_order` INT DEFAULT 0 COMMENT 'Thứ tự sắp xếp',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Trạng thái',
  `member_count` INT DEFAULT 0 COMMENT 'Số lượng thành viên',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_code` (`code`),
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_manager` (`manager_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng phòng ban';

-- 2. Bảng vai trò
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID vai trò',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên vai trò',
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã vai trò',
  `description` TEXT COMMENT 'Mô tả vai trò',
  `level` INT DEFAULT 0 COMMENT 'Cấp độ vai trò',
  `color` VARCHAR(20) NULL COMMENT 'Màu vai trò',
  `parent_id` VARCHAR(50) COMMENT 'ID vai trò cấp trên',
  `is_system` BOOLEAN DEFAULT FALSE COMMENT 'Có phải vai trò hệ thống',
  `data_scope` ENUM('all', 'department', 'self', 'custom') DEFAULT 'self' COMMENT 'Phạm vi quyền dữ liệu',
  `permissions` JSON COMMENT 'Danh sách quyền chức năng',
  `menu_permissions` JSON COMMENT 'Danh sách quyền menu',
  `api_permissions` JSON COMMENT 'Danh sách quyền API',
  `user_count` INT DEFAULT 0 COMMENT 'Số lượng người dùng',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Trạng thái',
  `created_by` VARCHAR(50) COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `updated_by` VARCHAR(50) COMMENT 'ID người cập nhật',
  `updated_by_name` VARCHAR(50) COMMENT 'Tên người cập nhật',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo (TypeORM)',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật (TypeORM)',
  INDEX `idx_code` (`code`),
  INDEX `idx_level` (`level`),
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_is_system` (`is_system`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng vai trò';

-- 3. Bảng người dùng
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID người dùng',
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Tên đăng nhập',
  `password` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu',
  `name` VARCHAR(50) NOT NULL COMMENT 'Họ tên',
  `real_name` VARCHAR(50) COMMENT 'Tên thật',
  `email` VARCHAR(100) COMMENT 'Email',
  `phone` VARCHAR(20) COMMENT 'Số điện thoại',
  `avatar` VARCHAR(500) COMMENT 'URL ảnh đại diện',
  `gender` ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT 'Giới tính',
  `birthday` DATE COMMENT 'Ngày sinh',
  `id_card` VARCHAR(255) COMMENT 'Số CMND/CCCD (đã mã hóa)',
  `role` VARCHAR(50) NOT NULL COMMENT 'Vai trò',
  `role_id` VARCHAR(50) NOT NULL COMMENT 'ID vai trò',
  `department_id` VARCHAR(50) COMMENT 'ID phòng ban',
  `department_name` VARCHAR(100) COMMENT 'Tên phòng ban',
  `position` VARCHAR(50) COMMENT 'Chức vụ',
  `employee_number` VARCHAR(50) COMMENT 'Mã nhân viên',
  `entry_date` DATE COMMENT 'Ngày vào làm',
  `leave_date` DATE COMMENT 'Ngày nghỉ việc',
  `salary` VARCHAR(255) COMMENT 'Lương (đã mã hóa)',
  `bank_account` VARCHAR(255) COMMENT 'Số tài khoản ngân hàng (đã mã hóa)',
  `emergency_contact` VARCHAR(50) COMMENT 'Người liên hệ khẩn cấp',
  `emergency_phone` VARCHAR(20) COMMENT 'Số điện thoại liên hệ khẩn cấp',
  `address` TEXT COMMENT 'Địa chỉ nhà',
  `education` VARCHAR(20) COMMENT 'Trình độ học vấn',
  `major` VARCHAR(100) COMMENT 'Chuyên ngành',
  `status` ENUM('active', 'inactive', 'resigned', 'locked') DEFAULT 'active' COMMENT 'Trạng thái',
  `employment_status` ENUM('active', 'resigned') DEFAULT 'active' COMMENT 'Trạng thái làm việc',
  `resigned_at` DATETIME NULL COMMENT 'Thời gian nghỉ việc',
  `last_login_at` TIMESTAMP NULL COMMENT 'Thời gian đăng nhập cuối',
  `last_login_ip` VARCHAR(45) NULL COMMENT 'IP đăng nhập cuối',
  `login_count` INT DEFAULT 0 COMMENT 'Số lần đăng nhập',
  `login_fail_count` INT DEFAULT 0 COMMENT 'Số lần đăng nhập thất bại',
  `locked_at` DATETIME NULL COMMENT 'Thời gian khóa tài khoản',
  `must_change_password` BOOLEAN DEFAULT FALSE COMMENT 'Có bắt buộc đổi mật khẩu',
  `remark` TEXT NULL COMMENT 'Ghi chú',
  `settings` JSON COMMENT 'Cài đặt người dùng',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_employee_number` (`employee_number`),
  INDEX `idx_role` (`role`),
  INDEX `idx_role_id` (`role_id`),
  INDEX `idx_department` (`department_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_entry_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng người dùng';

-- 4. Bảng khách hàng
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'Khách hàng ID',
  `customer_code` VARCHAR(50) UNIQUE COMMENT 'Mã khách hàng',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên khách hàng',
  `phone` VARCHAR(20) COMMENT 'Số điện thoại',
  `wechat` VARCHAR(100) COMMENT 'WeChat ID',
  `qq` VARCHAR(50) COMMENT 'QQ ID',
  `email` VARCHAR(100) COMMENT 'Email',
  `gender` ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT 'Giới tính',
  `age` INT NULL COMMENT 'Tuổi',
  `birthday` DATE COMMENT 'Ngày sinh',
  `id_card` VARCHAR(255) COMMENT 'Số CMND/CCCD (đã mã hóa)',
  `height` DECIMAL(5,1) NULL COMMENT 'Chiều cao(cm)',
  `weight` DECIMAL(5,1) NULL COMMENT 'Cân nặng(kg)',
  `address` TEXT COMMENT 'Địa chỉ',
  `company` VARCHAR(200) COMMENT 'Tên công ty',
  `industry` VARCHAR(100) COMMENT 'Ngành nghề',
  `source` VARCHAR(50) COMMENT 'Nguồn khách hàng',
  `level` VARCHAR(20) DEFAULT 'normal' COMMENT 'Cấp độ khách hàng',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT 'Trạng thái',
  `follow_status` VARCHAR(20) COMMENT 'Trạng thái theo dõi',
  `tags` JSON COMMENT 'Nhãn',
  `remark` TEXT COMMENT 'Ghi chú',
  `medical_history` TEXT NULL COMMENT 'Tiền sử bệnh tật',
  `improvement_goals` JSON NULL COMMENT 'Mục tiêu cải thiện',
  `other_goals` VARCHAR(200) NULL COMMENT 'Mục tiêu cải thiện khác',
  `order_count` INT DEFAULT 0 COMMENT 'Số lượng đơn hàng',
  `return_count` INT DEFAULT 0 COMMENT 'Số lượng trả hàng',
  `total_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Tổng số tiền đã chi',
  `fan_acquisition_time` DATETIME NULL COMMENT 'Thời gian thu hút khách hàng',
  `last_order_time` TIMESTAMP NULL COMMENT 'Thời gian đặt hàng cuối',
  `last_contact_time` TIMESTAMP NULL COMMENT 'Thời gian liên hệ cuối',
  `next_follow_time` TIMESTAMP NULL COMMENT 'Thời gian theo dõi tiếp theo',
  `sales_person_id` VARCHAR(50) COMMENT 'ID nhân viên bán hàng',
  `sales_person_name` VARCHAR(50) COMMENT 'Tên nhân viên bán hàng',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_customer_code` (`customer_code`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_email` (`email`),
  INDEX `idx_birthday` (`birthday`),
  INDEX `idx_sales_person` (`sales_person_id`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_level` (`level`),
  INDEX `idx_status` (`status`),
  INDEX `idx_follow_status` (`follow_status`),
  INDEX `idx_next_follow_time` (`next_follow_time`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng khách hàng';

-- 5. Bảng nhãn khách hàng
DROP TABLE IF EXISTS `customer_tags`;
CREATE TABLE `customer_tags` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID nhãn',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên nhãn',
  `color` VARCHAR(20) COMMENT 'Màu nhãn',
  `description` TEXT COMMENT 'Mô tả nhãn',
  `customer_count` INT DEFAULT 0 COMMENT 'Số lượng khách hàng',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng nhãn khách hàng';

-- 6. Bảng nhóm khách hàng
DROP TABLE IF EXISTS `customer_groups`;
CREATE TABLE `customer_groups` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID nhóm',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên nhóm',
  `description` TEXT COMMENT 'Mô tả nhóm',
  `customer_count` INT DEFAULT 0 COMMENT 'Số lượng khách hàng',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng nhóm khách hàng';

-- 6.1 Bảng chia sẻ khách hàng
DROP TABLE IF EXISTS `customer_shares`;
CREATE TABLE `customer_shares` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'ID chia sẻ(UUID)',
  `customer_id` VARCHAR(50) NOT NULL COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) NOT NULL COMMENT 'Tên khách hàng',
  `shared_by` VARCHAR(50) NOT NULL COMMENT 'ID người chia sẻ',
  `shared_by_name` VARCHAR(50) NOT NULL COMMENT 'Tên người chia sẻ',
  `shared_to` VARCHAR(50) NOT NULL COMMENT 'ID người nhận',
  `shared_to_name` VARCHAR(50) NOT NULL COMMENT 'Tên người nhận',
  `time_limit` INT DEFAULT 0 COMMENT 'Thời gian giới hạn(ngày,0 là vĩnh viễn)',
  `expire_time` TIMESTAMP NULL COMMENT 'Thời gian hết hạn',
  `remark` VARCHAR(500) NULL COMMENT 'Ghi chú',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT 'Trạng thái: active, expired, recalled',
  `recall_time` TIMESTAMP NULL COMMENT 'Thời gian gỡ bỏ',
  `recall_reason` VARCHAR(500) NULL COMMENT 'Lý do gỡ bỏ',
  `original_owner` VARCHAR(50) NULL COMMENT 'ID người sở hữu ban đầu',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_shared_by` (`shared_by`),
  INDEX `idx_shared_to` (`shared_to`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expire_time` (`expire_time`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chia sẻ khách hàng';

-- 6.2 Bảng ghi nhận phân phối khách hàng
DROP TABLE IF EXISTS `customer_assignments`;
CREATE TABLE `customer_assignments` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID phân phối',
  `customer_id` VARCHAR(50) NOT NULL COMMENT 'Khách hàngID',
  `customer_name` VARCHAR(100) NULL COMMENT 'Tên khách hàng',
  `from_user_id` VARCHAR(50) NULL COMMENT 'ID người gốc',
  `from_user_name` VARCHAR(50) NULL COMMENT 'Tên người gốc',
  `to_user_id` VARCHAR(50) NOT NULL COMMENT 'ID người mới',
  `to_user_name` VARCHAR(50) NULL COMMENT 'Tên người mới',
  `assignment_type` VARCHAR(20) DEFAULT 'manual' COMMENT 'Loại phân phối: manual, auto, transfer',
  `reason` VARCHAR(500) NULL COMMENT 'Lý do phân phối',
  `remark` TEXT NULL COMMENT 'Ghi chú',
  `operator_id` VARCHAR(50) NULL COMMENT 'ID người thực hiện',
  `operator_name` VARCHAR(50) NULL COMMENT 'Tên người thực hiện',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_from_user` (`from_user_id`),
  INDEX `idx_to_user` (`to_user_id`),
  INDEX `idx_operator` (`operator_id`),
  INDEX `idx_type` (`assignment_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lịch sử phân bổ khách hàng';

-- 7. Bảng danh mục sản phẩm
DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE `product_categories` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID danh mục',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên danh mục',
  `parent_id` VARCHAR(50) NULL COMMENT 'ID danh mục cấp trên',
  `description` TEXT COMMENT 'Mô tả danh mục',
  `sort_order` INT DEFAULT 0 COMMENT 'Thứ tự sắp xếp',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Trạng thái',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh mục sản phẩm';

-- 8. Bảng sản phẩm
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID sản phẩm',
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã sản phẩm',
  `name` VARCHAR(200) NOT NULL COMMENT 'Tên sản phẩm',
  `category_id` VARCHAR(50) COMMENT 'ID danh mục',
  `category_name` VARCHAR(100) COMMENT 'Tên danh mục',
  `description` TEXT COMMENT 'Mô tả sản phẩm',
  `price` DECIMAL(10,2) NOT NULL COMMENT 'Giá bán',
  `cost_price` DECIMAL(10,2) COMMENT 'Giá vốn',
  `stock` INT DEFAULT 0 COMMENT 'Số lượng tồn kho',
  `min_stock` INT DEFAULT 0 COMMENT 'Tồn kho tối thiểu',
  `unit` VARCHAR(20) DEFAULT 'cái' COMMENT 'Đơn vị',
  `specifications` JSON COMMENT 'Thông số kỹ thuật',
  `images` JSON COMMENT 'Hình ảnh sản phẩm',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Trạng thái',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'Người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_code` (`code`),
  INDEX `idx_category` (`category_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng sản phẩm';

-- 9. Bảng đơn hàng
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Số đơn hàng',
  `customer_id` VARCHAR(50) NOT NULL COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) COMMENT 'Tên khách hàng',
  `customer_phone` VARCHAR(20) COMMENT 'Số điện thoại khách hàng',
  `service_wechat` VARCHAR(100) COMMENT 'WeChat ID dịch vụ khách hàng',
  `order_source` VARCHAR(50) COMMENT 'Nguồn đơn hàng',
  `products` JSON COMMENT 'Danh sách sản phẩm',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT 'Tổng số tiền đơn hàng',
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Số tiền giảm giá',
  `final_amount` DECIMAL(10,2) NOT NULL COMMENT 'Số tiền thực tế thanh toán',
  `deposit_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Số tiền đặt cọc',
  `deposit_screenshots` JSON COMMENT 'Ảnh chụp đặt cọc',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT 'Trạng thái đơn hàng',
  `payment_status` VARCHAR(20) DEFAULT 'unpaid' COMMENT 'Trạng thái thanh toán',
  `payment_method` VARCHAR(50) COMMENT 'Phương thức thanh toán',
  `payment_time` TIMESTAMP NULL COMMENT 'Thời gian thanh toán',
  `shipping_address` TEXT COMMENT 'Địa chỉ nhận hàng',
  `shipping_phone` VARCHAR(20) COMMENT 'Số điện thoại nhận hàng',
  `shipping_name` VARCHAR(50) COMMENT 'Tên người nhận hàng',
  `express_company` VARCHAR(50) COMMENT 'Công ty vận chuyển',
  `tracking_number` VARCHAR(100) COMMENT 'Mã vận đơn',
  `shipped_at` TIMESTAMP NULL COMMENT 'Thời gian giao hàng',
  `delivered_at` TIMESTAMP NULL COMMENT 'Thời gian nhận hàng',
  `cancelled_at` TIMESTAMP NULL COMMENT 'Thời gian hủy đơn hàng',
  `cancel_reason` TEXT COMMENT 'Lý do hủy đơn hàng',
  `refund_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Số tiền hoàn tiền',
  `refund_reason` TEXT COMMENT 'Lý do hoàn tiền',
  `refund_time` TIMESTAMP NULL COMMENT 'Thời gian hoàn tiền',
  `invoice_type` VARCHAR(20) COMMENT 'Loại hóa đơn',
  `invoice_title` VARCHAR(200) COMMENT 'Tên hóa đơn',
  `invoice_number` VARCHAR(100) COMMENT 'Mã hóa đơn',
  `mark_type` VARCHAR(20) DEFAULT 'normal' COMMENT 'Loại đánh dấu đơn hàng',
  `custom_fields` JSON COMMENT 'Trường tùy chỉnh',
  `remark` TEXT COMMENT 'Ghi chú',
  `operator_id` VARCHAR(50) COMMENT 'ID người thực hiện',
  `operator_name` VARCHAR(50) COMMENT 'Tên người thực hiện',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_tracking_number` (`tracking_number`),
  INDEX `idx_order_source` (`order_source`),
  INDEX `idx_mark_type` (`mark_type`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_shipped_at` (`shipped_at`),
  INDEX `idx_delivered_at` (`delivered_at`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đơn hàng';

-- 10. Bảng logistics
DROP TABLE IF EXISTS `logistics`;
CREATE TABLE `logistics` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID logistics',
  `order_id` VARCHAR(50) NOT NULL COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) COMMENT 'Số đơn hàng',
  `tracking_number` VARCHAR(100) COMMENT 'Mã vận đơn',
  `company` VARCHAR(100) COMMENT 'Công ty vận chuyển',
  `company_code` VARCHAR(50) COMMENT 'Mã công ty vận chuyển',
  `status` VARCHAR(50) COMMENT 'Trạng thái logistics',
  `current_location` VARCHAR(200) COMMENT 'Vị trí hiện tại',
  `tracking_info` JSON COMMENT 'Thông tin theo dõi',
  `shipped_at` TIMESTAMP NULL COMMENT 'Thời gian giao hàng',
  `delivered_at` TIMESTAMP NULL COMMENT 'Thời gian nhận hàng',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_order` (`order_id`),
  INDEX `idx_tracking_number` (`tracking_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng logistics';

-- 11. Bảng dịch vụ sau bán hàng
DROP TABLE IF EXISTS `after_sales_services`;
CREATE TABLE `after_sales_services` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID dịch vụ sau bán hàng',
  `service_number` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Số đơn dịch vụ sau bán hàng',
  `order_id` VARCHAR(50) NULL COMMENT 'ID đơn hàng liên quan',
  `order_number` VARCHAR(50) NULL COMMENT 'Số đơn hàng liên quan',
  `customer_id` VARCHAR(50) NULL COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) NULL COMMENT 'Tên khách hàng',
  `customer_phone` VARCHAR(20) NULL COMMENT 'Số điện thoại khách hàng',
  `service_type` VARCHAR(20) DEFAULT 'return' COMMENT 'Loại dịch vụ: return trả hàng, exchange đổi hàng, repair sửa chữa, refund hoàn tiền, complaint khiếu nại, inquiry tư vấn',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT 'Trạng thái: pending chờ xử lý, processing đang xử lý, resolved đã giải quyết, closed đã đóng',
  `priority` VARCHAR(20) DEFAULT 'normal' COMMENT 'Mức độ ưu tiên: low thấp, normal bình thường, high cao, urgent khẩn cấp',
  `reason` VARCHAR(100) NULL COMMENT 'Lý do yêu cầu',
  `description` TEXT NULL COMMENT 'Mô tả chi tiết',
  `product_name` VARCHAR(200) NULL COMMENT 'Tên sản phẩm',
  `product_spec` VARCHAR(100) NULL COMMENT 'Thông số sản phẩm',
  `quantity` INT DEFAULT 1 COMMENT 'Số lượng',
  `price` DECIMAL(10,2) DEFAULT 0 COMMENT 'Số tiền',
  `contact_name` VARCHAR(50) NULL COMMENT 'Tên người liên hệ',
  `contact_phone` VARCHAR(20) NULL COMMENT 'Số điện thoại liên hệ',
  `contact_address` VARCHAR(500) NULL COMMENT 'Địa chỉ liên hệ',
  `assigned_to` VARCHAR(50) NULL COMMENT 'Tên người xử lý',
  `assigned_to_id` VARCHAR(50) NULL COMMENT 'ID người xử lý',
  `remark` TEXT NULL COMMENT 'Ghi chú',
  `attachments` JSON NULL COMMENT 'Danh sách tệp đính kèm',
  `created_by` VARCHAR(50) NULL COMMENT 'Tên người tạo',
  `created_by_id` VARCHAR(50) NULL COMMENT 'ID người tạo',
  `department_id` VARCHAR(50) NULL COMMENT 'ID phòng ban',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  `expected_time` DATETIME NULL COMMENT 'Thời gian hoàn thành dự kiến',
  `resolved_time` DATETIME NULL COMMENT 'Thời gian giải quyết',
  INDEX `idx_service_number` (`service_number`),
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by_id` (`created_by_id`),
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng dịch vụ sau bán hàng';

-- 11.1 Bảng dịch vụ sau bán hàng phiên bản cũ (tương thích)
DROP TABLE IF EXISTS `service_records`;
CREATE TABLE `service_records` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID dịch vụ sau bán hàng',
  `service_number` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Số đơn dịch vụ sau bán hàng',
  `order_id` VARCHAR(50) COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) COMMENT 'Số đơn hàng',
  `customer_id` VARCHAR(50) NOT NULL COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) COMMENT 'Tên khách hàng',
  `customer_phone` VARCHAR(20) COMMENT 'Số điện thoại khách hàng',
  `service_type` VARCHAR(50) COMMENT 'Loại dịch vụ',
  `problem_description` TEXT COMMENT 'Mô tả vấn đề',
  `solution` TEXT COMMENT 'Giải pháp',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT 'Trạng thái',
  `priority` VARCHAR(20) DEFAULT 'normal' COMMENT 'Mức độ ưu tiên',
  `assigned_to` VARCHAR(50) COMMENT 'ID người xử lý',
  `assigned_to_name` VARCHAR(50) COMMENT 'Tên người xử lý',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  `closed_at` TIMESTAMP NULL COMMENT 'Thời gian đóng',
  INDEX `idx_service_number` (`service_number`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_assigned_to` (`assigned_to`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng dịch vụ sau bán hàng (phiên bản cũ tương thích)';

-- 12. Bảng tài liệu
DROP TABLE IF EXISTS `data_records`;
CREATE TABLE `data_records` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID tài liệu',
  `customer_id` VARCHAR(50) NOT NULL COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) COMMENT 'Tên khách hàng',
  `order_id` VARCHAR(50) COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) COMMENT 'Số đơn hàng',
  `type` VARCHAR(50) COMMENT 'Loại tài liệu',
  `content` TEXT COMMENT 'Nội dung tài liệu',
  `attachments` JSON COMMENT 'Tệp đính kèm',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng tài liệu';

-- 13. Bảng thành tích
DROP TABLE IF EXISTS `performance_records`;
CREATE TABLE `performance_records` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID thành tích',
  `user_id` VARCHAR(50) NOT NULL COMMENT 'ID người dùng',
  `user_name` VARCHAR(50) COMMENT 'Tên người dùng',
  `department_id` VARCHAR(50) COMMENT 'ID phòng ban',
  `department_name` VARCHAR(100) COMMENT 'Tên phòng ban',
  `order_id` VARCHAR(50) COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) COMMENT 'Số đơn hàng',
  `customer_id` VARCHAR(50) COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) COMMENT 'Tên khách hàng',
  `product_category` VARCHAR(100) COMMENT 'Danh mục sản phẩm',
  `amount` DECIMAL(10,2) NOT NULL COMMENT 'Số tiền thành tích',
  `commission_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Tỷ lệ hoa hồng',
  `commission_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Số tiền hoa hồng',
  `type` VARCHAR(20) DEFAULT 'order' COMMENT 'Loại thành tích',
  `status` ENUM('pending', 'confirmed', 'paid', 'cancelled') DEFAULT 'pending' COMMENT 'Trạng thái',
  `confirmed_by` VARCHAR(50) COMMENT 'ID người xác nhận',
  `confirmed_by_name` VARCHAR(50) COMMENT 'Tên người xác nhận',
  `confirmed_at` TIMESTAMP NULL COMMENT 'Thời gian xác nhận',
  `paid_at` TIMESTAMP NULL COMMENT 'Thời gian thanh toán',
  `date` DATE NOT NULL COMMENT 'Ngày thành tích',
  `remark` TEXT COMMENT 'Ghi chú',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_user` (`user_id`),
  INDEX `idx_department` (`department_id`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date` (`date`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thành tích';

-- 14. Bảng nhật ký thao tác
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID nhật ký',
  `user_id` VARCHAR(50) COMMENT 'ID người dùng thao tác',
  `user_name` VARCHAR(50) COMMENT 'Tên người dùng thao tác',
  `action` VARCHAR(100) NOT NULL COMMENT 'Loại thao tác',
  `module` VARCHAR(50) COMMENT 'Mô-đun',
  `resource_type` VARCHAR(50) COMMENT 'Loại tài nguyên',
  `resource_id` VARCHAR(50) COMMENT 'ID tài nguyên',
  `description` TEXT COMMENT 'Mô tả thao tác',
  `ip_address` VARCHAR(45) COMMENT 'Địa chỉ IP',
  `user_agent` TEXT COMMENT 'User agent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  INDEX `idx_user` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_module` (`module`),
  INDEX `idx_resource` (`resource_type`, `resource_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng nhật ký thao tác';

-- 15. Bảng cấu hình hệ thống
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID cấu hình',
  `configKey` VARCHAR(100) NOT NULL COMMENT 'Tên khóa cấu hình',
  `configValue` TEXT COMMENT 'Giá trị cấu hình',
  `valueType` VARCHAR(50) DEFAULT 'string' COMMENT 'Loại giá trị: string, number, boolean, json, text',
  `configGroup` VARCHAR(100) NOT NULL DEFAULT 'general' COMMENT 'Nhóm cấu hình',
  `description` VARCHAR(200) COMMENT 'Mô tả cấu hình',
  `isEnabled` BOOLEAN DEFAULT TRUE COMMENT 'Có bật',
  `isSystem` BOOLEAN DEFAULT FALSE COMMENT 'Có phải cấu hình hệ thống (không thể xóa)',
  `sortOrder` INT DEFAULT 0 COMMENT 'Trọng số sắp xếp',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  UNIQUE INDEX `idx_config_key_group` (`configKey`, `configGroup`),
  INDEX `idx_config_group` (`configGroup`),
  INDEX `idx_enabled` (`isEnabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng cấu hình hệ thống';

-- 16. Bảng ghi chép cuộc gọi
DROP TABLE IF EXISTS `call_records`;
CREATE TABLE `call_records` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID cuộc gọi',
  `customer_id` VARCHAR(50) NOT NULL COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) COMMENT 'Tên khách hàng',
  `customer_phone` VARCHAR(20) COMMENT 'Số điện thoại khách hàng',
  `call_type` ENUM('outbound', 'inbound') NOT NULL COMMENT 'Loại cuộc gọi',
  `call_status` ENUM('connected', 'missed', 'busy', 'failed', 'rejected') NOT NULL COMMENT 'Trạng thái cuộc gọi',
  `start_time` TIMESTAMP NOT NULL COMMENT 'Thời gian bắt đầu',
  `end_time` TIMESTAMP NULL COMMENT 'Thời gian kết thúc',
  `duration` INT DEFAULT 0 COMMENT 'Thời gian cuộc gọi(giây)',
  `recording_url` VARCHAR(500) COMMENT 'URL tệp âm thanh',
  `notes` TEXT COMMENT 'Ghi chú cuộc gọi',
  `follow_up_required` BOOLEAN DEFAULT FALSE COMMENT 'Có cần theo dõi không',
  `user_id` VARCHAR(50) NOT NULL COMMENT 'ID người thực hiện',
  `user_name` VARCHAR(50) COMMENT 'Tên người thực hiện',
  `department` VARCHAR(100) COMMENT 'Phòng ban',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_call_type` (`call_type`),
  INDEX `idx_call_status` (`call_status`),
  INDEX `idx_start_time` (`start_time`),
  INDEX `idx_follow_up` (`follow_up_required`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng ghi chép cuộc gọi';

-- 17. Bảng theo dõi khách hàng
DROP TABLE IF EXISTS `follow_up_records`;
CREATE TABLE `follow_up_records` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID theo dõi',
  `call_id` VARCHAR(50) COMMENT 'ID cuộc gọi',
  `customer_id` VARCHAR(50) NOT NULL COMMENT 'ID khách hàng',
  `customer_name` VARCHAR(100) COMMENT 'Tên khách hàng',
  `follow_up_type` ENUM('call', 'visit', 'email', 'message') NOT NULL COMMENT 'Loại theo dõi',
  `content` TEXT NOT NULL COMMENT 'Nội dung theo dõi',
  `next_follow_up_date` TIMESTAMP NULL COMMENT 'Thời gian theo dõi tiếp theo',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Mức độ ưu tiên',
  `status` ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' COMMENT 'Trạng thái',
  `user_id` VARCHAR(50) NOT NULL COMMENT 'ID người theo dõi',
  `user_name` VARCHAR(50) COMMENT 'Tên người theo dõi',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_call` (`call_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_next_follow_up` (`next_follow_up_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng theo dõi khách hàng';

-- 18. Bảng mẫu tin nhắn SMS
DROP TABLE IF EXISTS `sms_templates`;
CREATE TABLE `sms_templates` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID mẫu',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên mẫu',
  `category` VARCHAR(50) COMMENT 'Phân loại mẫu',
  `content` TEXT NOT NULL COMMENT 'Nội dung mẫu',
  `variables` JSON COMMENT 'Danh sách biến',
  `description` TEXT COMMENT 'Mô tả mẫu',
  `applicant` VARCHAR(50) NOT NULL COMMENT 'ID người đăng ký',
  `applicant_name` VARCHAR(50) COMMENT 'Tên người đăng ký',
  `applicant_dept` VARCHAR(100) COMMENT 'Phòng ban người đăng ký',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Trạng thái phê duyệt',
  `approved_by` VARCHAR(50) COMMENT 'ID người phê duyệt',
  `approved_at` TIMESTAMP NULL COMMENT 'Thời gian phê duyệt',
  `is_system` BOOLEAN DEFAULT FALSE COMMENT 'Có phải mẫu hệ thống không',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_category` (`category`),
  INDEX `idx_status` (`status`),
  INDEX `idx_applicant` (`applicant`),
  INDEX `idx_is_system` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng mẫu tin nhắn SMS';

-- 19. Bảng ghi chép gửi tin nhắn SMS
DROP TABLE IF EXISTS `sms_records`;
CREATE TABLE `sms_records` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID ghi chép',
  `template_id` VARCHAR(50) COMMENT 'ID mẫu',
  `template_name` VARCHAR(100) COMMENT 'Tên mẫu',
  `content` TEXT NOT NULL COMMENT 'Nội dung tin nhắn',
  `recipients` JSON NOT NULL COMMENT 'Danh sách người nhận',
  `recipient_count` INT DEFAULT 0 COMMENT 'Số lượng người nhận',
  `success_count` INT DEFAULT 0 COMMENT 'Số lượng thành công',
  `fail_count` INT DEFAULT 0 COMMENT 'Số lượng thất bại',
  `status` ENUM('pending', 'sending', 'completed', 'failed') DEFAULT 'pending' COMMENT 'Trạng thái gửi',
  `send_details` JSON COMMENT 'Chi tiết gửi',
  `applicant` VARCHAR(50) NOT NULL COMMENT 'ID người đăng ký',
  `applicant_name` VARCHAR(50) COMMENT 'Tên người đăng ký',
  `applicant_dept` VARCHAR(100) COMMENT 'Phòng ban người đăng ký',
  `approved_by` VARCHAR(50) COMMENT 'ID người phê duyệt',
  `approved_at` TIMESTAMP NULL COMMENT 'Thời gian phê duyệt',
  `sent_at` TIMESTAMP NULL COMMENT 'Thời gian gửi',
  `remark` TEXT COMMENT 'Ghi chú',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_template` (`template_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_applicant` (`applicant`),
  INDEX `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng ghi chép gửi tin nhắn SMS';

-- 20. Bảng thông báo
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID thông báo',
  `user_id` VARCHAR(50) NOT NULL COMMENT 'ID người nhận',
  `type` VARCHAR(50) NOT NULL COMMENT 'Loại thông báo',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tiêu đề thông báo',
  `content` TEXT NOT NULL COMMENT 'Nội dung thông báo',
  `category` VARCHAR(50) COMMENT 'Phân loại thông báo',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'Mức độ ưu tiên',
  `is_read` BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc chưa',
  `read_at` TIMESTAMP NULL COMMENT 'Thời gian đọc',
  `related_id` VARCHAR(50) COMMENT 'ID nghiệp vụ liên quan',
  `related_type` VARCHAR(50) COMMENT 'Loại nghiệp vụ liên quan',
  `action_url` VARCHAR(500) COMMENT 'Liên kết thao tác',
  `icon` VARCHAR(50) COMMENT 'Biểu tượng',
  `color` VARCHAR(20) COMMENT 'Màu sắc',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_user` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_category` (`category`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_related` (`related_type`, `related_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thông báo';

-- 21. Bảng thông báo hệ thống
DROP TABLE IF EXISTS `system_announcements`;
CREATE TABLE `system_announcements` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID thông báo',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tiêu đề thông báo',
  `content` TEXT NOT NULL COMMENT 'Nội dung thông báo',
  `type` ENUM('system', 'maintenance', 'update', 'notice') DEFAULT 'notice' COMMENT 'Loại thông báo',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'Mức độ ưu tiên',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT 'Trạng thái',
  `target_users` JSON COMMENT 'Người dùng mục tiêu（Nếu rỗng thì là tất cả）',
  `target_roles` JSON COMMENT 'Vai trò mục tiêu',
  `target_departments` JSON COMMENT 'Phòng ban mục tiêu',
  `publish_time` TIMESTAMP NULL COMMENT 'Thời gian phát hành',
  `expire_time` TIMESTAMP NULL COMMENT 'Thời gian hết hạn',
  `is_popup` BOOLEAN DEFAULT FALSE COMMENT 'Có hiển thị popup không',
  `is_top` BOOLEAN DEFAULT FALSE COMMENT 'Có ghim không',
  `read_count` INT DEFAULT 0 COMMENT 'Số lần đọc',
  `attachments` JSON COMMENT 'Danh sách đính kèm',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_publish_time` (`publish_time`),
  INDEX `idx_is_top` (`is_top`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thông báo hệ thống';

-- 22. Bảng ghi chép phê duyệt đơn hàng
DROP TABLE IF EXISTS `order_audits`;
CREATE TABLE `order_audits` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID phê duyệt',
  `order_id` VARCHAR(50) NOT NULL COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) NOT NULL COMMENT 'Số đơn hàng',
  `audit_type` ENUM('create', 'modify', 'cancel', 'return') DEFAULT 'create' COMMENT 'Loại phê duyệt',
  `audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Trạng thái phê duyệt',
  `audit_level` INT DEFAULT 1 COMMENT 'Mức độ phê duyệt',
  `auditor_id` VARCHAR(50) COMMENT 'ID người phê duyệt',
  `auditor_name` VARCHAR(50) COMMENT 'Tên người phê duyệt',
  `audit_time` TIMESTAMP NULL COMMENT 'Thời gian phê duyệt',
  `audit_result` VARCHAR(20) COMMENT 'Kết quả phê duyệt',
  `audit_remark` TEXT COMMENT 'Ghi chú phê duyệt',
  `before_data` JSON COMMENT 'Dữ liệu trước',
  `after_data` JSON COMMENT 'Dữ liệu sau',
  `applicant_id` VARCHAR(50) NOT NULL COMMENT 'ID người đăng ký',
  `applicant_name` VARCHAR(50) COMMENT 'Tên người đăng ký',
  `apply_reason` TEXT COMMENT 'Lý do đăng ký',
  `apply_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian đăng ký',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_order` (`order_id`),
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_audit_type` (`audit_type`),
  INDEX `idx_audit_status` (`audit_status`),
  INDEX `idx_auditor` (`auditor_id`),
  INDEX `idx_applicant` (`applicant_id`),
  INDEX `idx_apply_time` (`apply_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng ghi chép phê duyệt đơn hàng';

-- 23. Bảng ghi chép chia sẻ thành tích
DROP TABLE IF EXISTS `performance_shares`;
CREATE TABLE `performance_shares` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID chia sẻ',
  `share_number` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Số chia sẻ',
  `order_id` VARCHAR(50) NOT NULL COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) NOT NULL COMMENT 'Số đơn hàng',
  `order_amount` DECIMAL(10,2) NOT NULL COMMENT 'Số tiền đơn hàng',
  `total_share_amount` DECIMAL(10,2) NOT NULL COMMENT 'Tổng số tiền chia sẻ',
  `share_count` INT DEFAULT 0 COMMENT 'Số người chia sẻ',
  `status` ENUM('active', 'completed', 'cancelled') DEFAULT 'active' COMMENT 'Trạng thái',
  `description` TEXT COMMENT 'Mô tả chia sẻ',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  `completed_at` TIMESTAMP NULL COMMENT 'Thời gian hoàn thành',
  `cancelled_at` TIMESTAMP NULL COMMENT 'Thời gian hủy',
  INDEX `idx_share_number` (`share_number`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng ghi chép chia sẻ thành tích';

-- 24. Bảng thành viên chia sẻ thành tích
DROP TABLE IF EXISTS `performance_share_members`;
CREATE TABLE `performance_share_members` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID thành viên',
  `share_id` VARCHAR(50) NOT NULL COMMENT 'ID ghi chép chia sẻ',
  `user_id` VARCHAR(50) NOT NULL COMMENT 'ID người dùng',
  `user_name` VARCHAR(50) NOT NULL COMMENT 'Tên người dùng',
  `department` VARCHAR(100) COMMENT 'Phòng ban',
  `share_percentage` DECIMAL(5,2) NOT NULL COMMENT 'Tỷ lệ chia sẻ',
  `share_amount` DECIMAL(10,2) NOT NULL COMMENT 'Số tiền chia sẻ',
  `status` ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending' COMMENT 'Trạng thái xác nhận',
  `confirm_time` TIMESTAMP NULL COMMENT 'Thời gian xác nhận',
  `reject_reason` TEXT COMMENT 'Lý do từ chối',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_share` (`share_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`share_id`) REFERENCES `performance_shares`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thành viên chia sẻ thành tích';

-- 25. Bảng công ty logistics
DROP TABLE IF EXISTS `logistics_companies`;
CREATE TABLE `logistics_companies` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID công ty',
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã công ty',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên công ty',
  `short_name` VARCHAR(50) COMMENT 'Tên viết tắt công ty',
  `logo` VARCHAR(500) COMMENT 'URL Logo',
  `website` VARCHAR(200) COMMENT 'Địa chỉ website',
  `tracking_url` VARCHAR(500) COMMENT 'Địa chỉ tra cứu theo dõi',
  `api_url` VARCHAR(500) COMMENT 'Địa chỉ API',
  `api_key` VARCHAR(200) COMMENT 'API key',
  `api_secret` VARCHAR(200) COMMENT 'API secret',
  `contact_phone` VARCHAR(50) COMMENT 'Số điện thoại liên hệ',
  `contact_email` VARCHAR(100) COMMENT 'Email liên hệ',
  `service_area` TEXT COMMENT 'Khu vực dịch vụ',
  `price_info` JSON COMMENT 'Thông tin giá',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Trạng thái',
  `sort_order` INT DEFAULT 0 COMMENT 'Sắp xếp',
  `remark` TEXT COMMENT 'Ghi chú',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_code` (`code`),
  INDEX `idx_name` (`name`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng công ty logistics';

-- 26. Bảng lịch sử trạng thái logistics
DROP TABLE IF EXISTS `logistics_status_history`;
CREATE TABLE `logistics_status_history` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID lịch sử',
  `logistics_id` VARCHAR(50) NOT NULL COMMENT 'ID ghi chép logistics',
  `order_id` VARCHAR(50) NOT NULL COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) NOT NULL COMMENT 'Số đơn hàng',
  `tracking_number` VARCHAR(100) NOT NULL COMMENT 'Số đơn logistics',
  `old_status` VARCHAR(50) COMMENT 'Trạng thái cũ',
  `new_status` VARCHAR(50) NOT NULL COMMENT 'Trạng thái mới',
  `status_text` VARCHAR(200) COMMENT 'Mô tả trạng thái',
  `location` VARCHAR(200) COMMENT 'Vị trí hiện tại',
  `operator` VARCHAR(50) COMMENT 'Người vận hành',
  `operator_name` VARCHAR(50) COMMENT 'Tên người vận hành',
  `update_source` ENUM('manual', 'auto', 'api') DEFAULT 'manual' COMMENT 'Nguồn cập nhật',
  `remark` TEXT COMMENT 'Ghi chú',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  INDEX `idx_logistics` (`logistics_id`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_tracking_number` (`tracking_number`),
  INDEX `idx_new_status` (`new_status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lịch sử trạng thái logistics';

-- 27. Bảng ghi chép ngoại lệ logistics
DROP TABLE IF EXISTS `logistics_exceptions`;
CREATE TABLE `logistics_exceptions` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID ngoại lệ',
  `logistics_id` VARCHAR(50) NOT NULL COMMENT 'ID ghi chép logistics',
  `order_id` VARCHAR(50) NOT NULL COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) NOT NULL COMMENT 'Số đơn hàng',
  `tracking_number` VARCHAR(100) NOT NULL COMMENT 'Số đơn logistics',
  `exception_type` VARCHAR(50) NOT NULL COMMENT 'Loại ngoại lệ',
  `exception_desc` TEXT NOT NULL COMMENT 'Mô tả ngoại lệ',
  `exception_time` TIMESTAMP NOT NULL COMMENT 'Thời gian ngoại lệ',
  `status` ENUM('pending', 'processing', 'resolved', 'closed') DEFAULT 'pending' COMMENT 'Trạng thái xử lý',
  `handler_id` VARCHAR(50) COMMENT 'ID người xử lý',
  `handler_name` VARCHAR(50) COMMENT 'Tên người xử lý',
  `handle_time` TIMESTAMP NULL COMMENT 'Thời gian xử lý',
  `handle_result` TEXT COMMENT 'Kết quả xử lý',
  `solution` TEXT COMMENT 'Giải pháp',
  `images` JSON COMMENT 'Ảnh liên quan',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_logistics` (`logistics_id`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_tracking_number` (`tracking_number`),
  INDEX `idx_exception_type` (`exception_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_handler` (`handler_id`),
  INDEX `idx_exception_time` (`exception_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng ghi chép ngoại lệ logistics';

-- 28. Bảng công việc cần làm logistics
DROP TABLE IF EXISTS `logistics_todos`;
CREATE TABLE `logistics_todos` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID công việc',
  `logistics_id` VARCHAR(50) NOT NULL COMMENT 'ID ghi chép logistics',
  `order_id` VARCHAR(50) NOT NULL COMMENT 'ID đơn hàng',
  `order_number` VARCHAR(50) NOT NULL COMMENT 'Số đơn hàng',
  `tracking_number` VARCHAR(100) COMMENT 'Số đơn logistics',
  `todo_type` VARCHAR(50) NOT NULL COMMENT 'Loại công việc',
  `todo_title` VARCHAR(200) NOT NULL COMMENT 'Tiêu đề công việc',
  `todo_content` TEXT COMMENT 'Nội dung công việc',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'Độ ưu tiên',
  `status` ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending' COMMENT 'Trạng thái',
  `assigned_to` VARCHAR(50) COMMENT 'ID người phụ trách',
  `assigned_to_name` VARCHAR(50) COMMENT 'Tên người phụ trách',
  `due_date` TIMESTAMP NULL COMMENT 'Thời gian hết hạn',
  `remind_time` TIMESTAMP NULL COMMENT 'Thời gian nhắc lại',
  `completed_time` TIMESTAMP NULL COMMENT 'Thời gian hoàn thành',
  `remark` TEXT COMMENT 'Ghi chú',
  `created_by` VARCHAR(50) NOT NULL COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_logistics` (`logistics_id`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_todo_type` (`todo_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_assigned_to` (`assigned_to`),
  INDEX `idx_due_date` (`due_date`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng công việc cần làm logistics';

-- 29. Bảng cấu hình trường đơn hàng
DROP TABLE IF EXISTS `order_field_configs`;
CREATE TABLE `order_field_configs` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID cấu hình',
  `field_key` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Khóa trường',
    `field_name` VARCHAR(100) NOT NULL COMMENT 'Tên trường',
  `field_type` ENUM('text', 'number', 'date', 'datetime', 'select', 'radio', 'checkbox') NOT NULL COMMENT 'Loại trường',
  `field_options` JSON COMMENT 'Tùy chọn trường',
  `default_value` VARCHAR(500) COMMENT 'Giá trị mặc định',
  `placeholder` VARCHAR(200) COMMENT 'Placeholder',
  `is_required` BOOLEAN DEFAULT FALSE COMMENT 'Có bắt buộc không',
  `is_visible` BOOLEAN DEFAULT TRUE COMMENT 'Có hiển thị không',
  `show_in_list` BOOLEAN DEFAULT FALSE COMMENT 'Hiển thị trong danh sách',
  `show_in_detail` BOOLEAN DEFAULT TRUE COMMENT 'Hiển thị trong chi tiết',
  `sort_order` INT DEFAULT 0 COMMENT 'Sắp xếp',
  `validation_rules` JSON COMMENT 'Quy tắc xác thực',
  `description` TEXT COMMENT 'Mô tả trường',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_field_key` (`field_key`),
  INDEX `idx_is_visible` (`is_visible`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng cấu hình trường đơn hàng';

-- 30. Bảng cấu hình hệ thống
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ID cấu hình',
  `category` VARCHAR(50) NOT NULL COMMENT 'Phân loại',
  `key` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Khóa cấu hình',
  `value` TEXT COMMENT 'Giá trị cấu hình',
  `value_type` ENUM('string', 'number', 'boolean', 'json', 'array') DEFAULT 'string' COMMENT 'Loại giá trị',
  `default_value` TEXT COMMENT 'Giá trị mặc định',
  `description` TEXT COMMENT 'Mô tả cấu hình',
  `is_public` BOOLEAN DEFAULT FALSE COMMENT 'Có công khai không (hiển thị trên frontend)',
  `is_encrypted` BOOLEAN DEFAULT FALSE COMMENT 'Có mã hóa không',
  `require_restart` BOOLEAN DEFAULT FALSE COMMENT 'Có yêu cầu khởi động lại không',
  `editable_roles` JSON COMMENT 'Danh sách vai trò có thể chỉnh sửa',
  `version` INT DEFAULT 1 COMMENT 'Phiên bản cấu hình',
  `sort_order` INT DEFAULT 0 COMMENT 'Sắp xếp',
  `created_by` VARCHAR(50) COMMENT 'ID người tạo',
  `created_by_name` VARCHAR(50) COMMENT 'Tên người tạo',
  `updated_by` VARCHAR(50) COMMENT 'ID người cập nhật',
  `updated_by_name` VARCHAR(50) COMMENT 'Tên người cập nhật',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_category` (`category`),
  INDEX `idx_key` (`key`),
  INDEX `idx_is_public` (`is_public`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng cấu hình hệ thống';

-- 31. Bảng quyền hạn
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID quyền hạn',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên quyền hạn',
  `code` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Mã quyền hạn',
  `description` TEXT COMMENT 'Mô tả quyền hạn',
  `module` VARCHAR(50) NOT NULL DEFAULT 'system' COMMENT 'Module',
  `type` VARCHAR(20) DEFAULT 'menu' COMMENT 'Loại quyền hạn: menu/button/api',
  `path` VARCHAR(200) COMMENT 'Đường dẫn',
  `icon` VARCHAR(50) COMMENT 'Biểu tượng',
  `sort` INT DEFAULT 0 COMMENT 'Sắp xếp',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT 'Trạng thái: active/inactive',
  `parentId` INT NULL COMMENT 'ID quyền hạn cha (cấu trúc cây)',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_code` (`code`),
  INDEX `idx_module` (`module`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_parent` (`parentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quyền hạn';

-- 32. Bảng liên kết quyền hạn vai trò
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `roleId` VARCHAR(50) NOT NULL COMMENT 'Mã vai trò',
  `permissionId` INT NOT NULL COMMENT 'Mã quyền hạn',
  PRIMARY KEY (`roleId`, `permissionId`),
  INDEX `idx_role` (`roleId`),
  INDEX `idx_permission` (`permissionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng liên kết quyền hạn vai trò';

-- 33. Bảng cấu trúc cây quyền hạn
DROP TABLE IF EXISTS `permissions_closure`;
CREATE TABLE `permissions_closure` (
  `id_ancestor` INT NOT NULL COMMENT 'ID quyền hạn cha',
  `id_descendant` INT NOT NULL COMMENT 'ID quyền hạn con',
  PRIMARY KEY (`id_ancestor`, `id_descendant`),
  INDEX `idx_ancestor` (`id_ancestor`),
  INDEX `idx_descendant` (`id_descendant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng cấu trúc cây quyền hạn';

-- 34. Bảng quyền hạn cá nhân
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID quyền hạn',
  `userId` INT NOT NULL COMMENT 'ID người dùng',
  `permissionId` INT NOT NULL COMMENT 'ID quyền hạn',
  `grantedBy` INT NULL COMMENT 'ID người cấp quyền',
  `reason` TEXT NULL COMMENT 'Lý do cấp quyền',
  `grantedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian cấp quyền',
  INDEX `idx_user` (`userId`),
  INDEX `idx_permission` (`permissionId`),
  INDEX `idx_granted_by` (`grantedBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quyền hạn cá nhân';

-- 35. Bảng cấu hình trạng thái logistics
DROP TABLE IF EXISTS `logistics_status`;
CREATE TABLE `logistics_status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã trạng thái',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên trạng thái',
  `color` VARCHAR(7) DEFAULT '#28a745' COMMENT 'Mã màu',
  `description` TEXT NULL COMMENT 'Mô tả trạng thái',
  `isActive` BOOLEAN DEFAULT TRUE COMMENT 'Có khả dụng không',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_name` (`name`),
  INDEX `idx_is_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng cấu hình trạng thái logistics';

-- 36. Bảng theo dõi logistics
DROP TABLE IF EXISTS `logistics_tracking`;
CREATE TABLE `logistics_tracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã theo dõi',
  `orderId` INT NOT NULL COMMENT 'ID đơn hàng',
  `trackingNo` VARCHAR(100) NOT NULL COMMENT 'Số đơn logistics',
  `companyCode` VARCHAR(50) NOT NULL COMMENT 'Mã công ty logistics',
  `companyName` VARCHAR(100) NOT NULL COMMENT 'Tên công ty logistics',
  `status` VARCHAR(50) DEFAULT 'pending' COMMENT 'Trạng thái logistics',
  `currentLocation` VARCHAR(200) NULL COMMENT 'Vị trí hiện tại',
  `statusDescription` TEXT NULL COMMENT 'Mô tả trạng thái',
  `lastUpdateTime` DATETIME NULL COMMENT 'Thời gian cập nhật cuối',
  `estimatedDeliveryTime` DATETIME NULL COMMENT 'Thời gian dự kiến giao hàng',
  `actualDeliveryTime` DATETIME NULL COMMENT 'Thời gian thực tế giao hàng',
  `signedBy` VARCHAR(100) NULL COMMENT 'Người nhận',
  `extraInfo` JSON NULL COMMENT 'Thông tin bổ sung',
  `autoSyncEnabled` BOOLEAN DEFAULT TRUE COMMENT 'Có khả dụng không',
  `nextSyncTime` DATETIME NULL COMMENT 'Thời gian tiếp theo đồng bộ',
  `syncFailureCount` INT DEFAULT 0 COMMENT 'Số lần đồng bộ thất bại',
  `lastSyncError` TEXT NULL COMMENT 'Lỗi cuối cùng đồng bộ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_order` (`orderId`),
  INDEX `idx_tracking_no` (`trackingNo`),
  INDEX `idx_company_code` (`companyCode`),
  INDEX `idx_status` (`status`),
  INDEX `idx_next_sync_time` (`nextSyncTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng theo dõi logistics';

-- 37. Bảng lịch sử logistics
DROP TABLE IF EXISTS `logistics_traces`;
CREATE TABLE `logistics_traces` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã lịch sử',
  `logisticsTrackingId` INT NOT NULL COMMENT 'Mã theo dõi logistics',
  `traceTime` DATETIME NOT NULL COMMENT 'Thời gian lịch sử',
  `location` VARCHAR(200) NULL COMMENT 'Vị trí lịch sử',
  `description` TEXT NOT NULL COMMENT 'Mô tả lịch sử',
  `status` VARCHAR(50) NULL COMMENT 'Trạng thái lịch sử',
  `operator` VARCHAR(100) NULL COMMENT 'Người vận hành',
  `phone` VARCHAR(100) NULL COMMENT 'Số điện thoại',
  `rawData` JSON NULL COMMENT 'Dữ liệu gốc',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  INDEX `idx_logistics_tracking` (`logisticsTrackingId`),
  INDEX `idx_trace_time` (`traceTime`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lịch sử logistics';

-- 38. Bảng chi tiết đơn hàng
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã chi tiết đơn hàng',
  `orderId` INT NOT NULL COMMENT 'ID đơn hàng',
  `productId` INT NOT NULL COMMENT 'ID sản phẩm',
  `productName` VARCHAR(100) NOT NULL COMMENT 'Tên sản phẩm (snapshot)',
  `productSku` VARCHAR(50) NOT NULL COMMENT 'SKU sản phẩm (snapshot)',
  `unitPrice` DECIMAL(10,2) NOT NULL COMMENT 'Đơn giá (snapshot)',
  `quantity` INT NOT NULL COMMENT 'Số lượng',
  `subtotal` DECIMAL(10,2) NOT NULL COMMENT 'Tổng tiền',
  `discountAmount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Tiền khuyến mãi',
  `notes` TEXT NULL COMMENT 'Ghi chú',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_order` (`orderId`),
  INDEX `idx_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết đơn hàng';

-- 36. Bảng lịch sử trạng thái đơn hàng
DROP TABLE IF EXISTS `order_status_history`;
  CREATE TABLE `order_status_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã lịch sử',
    `orderId` INT NOT NULL COMMENT 'ID đơn hàng',
    `status` VARCHAR(50) NOT NULL COMMENT 'Trạng thái',
    `notes` TEXT NULL COMMENT 'Ghi chú thay đổi',
    `operatorId` INT NULL COMMENT 'ID người vận hành',
    `operatorName` VARCHAR(50) NULL COMMENT 'Tên người vận hành',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
    INDEX `idx_order` (`orderId`),
    INDEX `idx_status` (`status`),
    INDEX `idx_operator` (`operatorId`),
    INDEX `idx_created_at` (`created_at`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lịch sử trạng thái đơn hàng';

-- 39. Bảng lịch sử trạng thái đơn hàng
DROP TABLE IF EXISTS `order_status_history`;
CREATE TABLE `order_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã lịch sử',
  `orderId` INT NOT NULL COMMENT 'ID đơn hàng',
  `status` VARCHAR(50) NOT NULL COMMENT 'Trạng thái',
  `notes` TEXT NULL COMMENT 'Ghi chú thay đổi',
  `operatorId` INT NULL COMMENT 'ID người vận hành',
  `operatorName` VARCHAR(50) NULL COMMENT 'Tên người vận hành',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  INDEX `idx_order` (`orderId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_operator` (`operatorId`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lịch sử trạng thái đơn hàng';

-- 40. Bảng chỉ số hiệu suất
DROP TABLE IF EXISTS `performance_metrics`;
CREATE TABLE `performance_metrics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã chỉ số',
  `userId` VARCHAR(100) NOT NULL COMMENT 'ID người dùng',
  `metricType` VARCHAR(50) NOT NULL COMMENT 'Loại chỉ số',
  `value` DECIMAL(10,2) NOT NULL COMMENT 'Giá trị chỉ số',
  `date` DATE NOT NULL COMMENT 'Ngày',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_user` (`userId`),
  INDEX `idx_type` (`metricType`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chỉ số hiệu suất';

-- 41. Bảng tin nhắn
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã tin nhắn',
  `senderId` VARCHAR(100) NOT NULL COMMENT 'ID người gửi',
  `receiverId` VARCHAR(100) NOT NULL COMMENT 'ID người nhận',
  `content` TEXT NOT NULL COMMENT 'Nội dung tin nhắn',
  `type` VARCHAR(20) DEFAULT 'text' COMMENT 'Loại tin nhắn',
  `isRead` BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_sender` (`senderId`),
  INDEX `idx_receiver` (`receiverId`),
  INDEX `idx_read` (`isRead`),
  INDEX `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng tin nhắn';

-- 42. Bảng đăng ký tin nhắn
DROP TABLE IF EXISTS `message_subscriptions`;
CREATE TABLE `message_subscriptions` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'Mã đăng ký(UUID)',
  `messageType` VARCHAR(50) NOT NULL COMMENT 'Loại tin nhắn',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên tin nhắn',
  `description` TEXT NULL COMMENT 'Mô tả tin nhắn',
  `category` VARCHAR(50) NOT NULL COMMENT 'Loại tin nhắn',
  `isGlobalEnabled` BOOLEAN DEFAULT FALSE COMMENT 'Đã khả dụng',
  `globalNotificationMethods` JSON NULL COMMENT 'Cách thức thông báo',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_type` (`messageType`),
  INDEX `idx_category` (`category`),
  INDEX `idx_enabled` (`isGlobalEnabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đăng ký tin nhắn';

-- 43. Bảng cấu hình đăng ký tin nhắn
DROP TABLE IF EXISTS `department_subscription_configs`;
CREATE TABLE `department_subscription_configs` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'Mã cấu hình(UUID)',
  `messageType` VARCHAR(50) NOT NULL COMMENT 'Loại tin nhắn',
    `departmentId` VARCHAR(50) NOT NULL COMMENT 'ID phòng ban',
  `isEnabled` BOOLEAN DEFAULT FALSE COMMENT 'Đã khả dụng',
  `notificationMethods` JSON NULL COMMENT 'Cách thức thông báo',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_type` (`messageType`),
  INDEX `idx_department` (`departmentId`),
  INDEX `idx_enabled` (`isEnabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng cấu hình đăng ký tin nhắn';

-- 44. Bảng log thao tác
DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã log',
  `level` VARCHAR(50) NOT NULL COMMENT 'Mức độ log',
  `message` TEXT NOT NULL COMMENT 'Nội dung log',
  `meta` TEXT NULL COMMENT 'Meta data',
  `userId` VARCHAR(100) NULL COMMENT 'ID người dùng',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  INDEX `idx_level` (`level`),
  INDEX `idx_user` (`userId`),
  INDEX `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng log thao tác';

-- 45. Bảng mục tiêu cải tiến
DROP TABLE IF EXISTS `improvement_goals`;
CREATE TABLE `improvement_goals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã mục tiêu',
  `userId` VARCHAR(100) NOT NULL COMMENT 'ID người dùng',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tiêu đề mục tiêu',
  `description` TEXT NOT NULL COMMENT 'Mô tả mục tiêu',
  `targetDate` DATE NOT NULL COMMENT 'Ngày mục tiêu',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT 'Trạng thái',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_user` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_target_date` (`targetDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng mục tiêu cải tiến';

-- 46. Bảng cuộc gọi
DROP TABLE IF EXISTS `calls`;
CREATE TABLE `calls` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã cuộc gọi',
  `customerId` VARCHAR(100) NOT NULL COMMENT 'ID khách hàng',
  `userId` VARCHAR(100) NOT NULL COMMENT 'ID người dùng',
  `phoneNumber` VARCHAR(20) NOT NULL COMMENT 'Số điện thoại',
  `duration` INT DEFAULT 0 COMMENT 'Thời lượng cuộc gọi(giây)',
  `status` VARCHAR(20) DEFAULT 'completed' COMMENT 'Trạng thái',
  `notes` TEXT NULL COMMENT 'Ghi chú',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  INDEX `idx_customer` (`customerId`),
  INDEX `idx_user` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng cuộc gọi';

-- =============================================
-- Dữ liệu khởi tạo
-- =============================================

-- Chèn phòng ban mặc định
INSERT INTO `departments` (`id`, `name`, `description`, `parent_id`, `level`, `sort_order`, `member_count`) VALUES 
('dept_001', 'Phòng quản lý hệ thống', 'Quản lý và bảo trì hệ thống', NULL, 1, 1, 2),
('dept_002', 'Phòng bán hàng', 'Chịu trách nhiệm bán sản phẩm và duy trì khách hàng', NULL, 1, 2, 2),
('dept_003', 'Phòng dịch vụ khách hàng', 'Chịu trách nhiệm dịch vụ khách hàng và hỗ trợ sau bán hàng', NULL, 1, 3, 1);

-- Chèn vai trò mặc định
INSERT INTO `roles` (`id`, `name`, `code`, `description`, `permissions`, `user_count`) VALUES 
('super_admin', 'Siêu quản trị viên', 'super_admin', 'Có tất cả quyền trong hệ thống', JSON_ARRAY('*'), 1),
('admin', 'Quản trị viên', 'admin', 'Có tất cả quyền trong hệ thống', JSON_ARRAY('*'), 1),
('department_manager', 'Trưởng phòng ban', 'department_manager', 'Quản lý nghiệp vụ và đội ngũ của phòng ban', JSON_ARRAY('dashboard', 'customer', 'order', 'performance', 'logistics', 'aftersale', 'data'), 1),
('sales_staff', 'Nhân viên bán hàng', 'sales_staff', 'Tập trung vào phát triển khách hàng và quản lý đơn hàng', JSON_ARRAY('dashboard', 'customer', 'order', 'performance', 'logistics', 'aftersale', 'data'), 1),
('customer_service', 'Nhân viên dịch vụ khách hàng', 'customer_service', 'Xử lý đơn hàng, logistics và dịch vụ sau bán hàng', JSON_ARRAY('dashboard', 'order', 'logistics', 'aftersale', 'data'), 1);

-- Chèn người dùng mặc định (mật khẩu đã mã hóa, mật khẩu thực tế xem tài liệu)
INSERT INTO `users` (`id`, `username`, `password`, `name`, `email`, `phone`, `role`, `role_id`, `department_id`, `department_name`, `position`, `status`) VALUES 
('superadmin', 'superadmin', 'super123456', 'Siêu quản trị viên', 'superadmin@example.com', '0919887799', 'super_admin', 'super_admin', 'dept_001', 'Phòng quản lý hệ thống', 'Siêu quản trị viên', 'active'),
('admin', 'admin', 'admin123', 'Quản trị viên hệ thống', 'admin@example.com', '0919887791', 'admin', 'admin', 'dept_001', 'Phòng quản lý', 'Quản trị viên hệ thống', 'active'),
('manager_001', 'manager', 'manager123', 'Trưởng phòng', 'manager@example.com', '0919887792', 'department_manager', 'department_manager', 'dept_002', 'Phòng bán hàng', 'Trưởng phòng ban', 'active'),
('sales_001', 'sales', 'sales123', 'Nhân viên bán hàng', 'sales@example.com', '0919887793', 'sales_staff', 'sales_staff', 'dept_002', 'Phòng bán hàng', 'Nhân viên bán hàng', 'active'),
('service_001', 'service', 'service123', 'Nhân viên dịch vụ khách hàng', 'service@example.com', '0919887794', 'customer_service', 'customer_service', 'dept_003', 'Phòng dịch vụ khách hàng', 'Chuyên viên dịch vụ khách hàng', 'active');

-- Cập nhật số lượng thành viên phòng ban
UPDATE `departments` SET `member_count` = 2 WHERE `id` = 'dept_001';
UPDATE `departments` SET `member_count` = 2 WHERE `id` = 'dept_002';
UPDATE `departments` SET `member_count` = 1 WHERE `id` = 'dept_003';

-- Chèn danh mục sản phẩm mặc định
INSERT INTO `product_categories` (`id`, `name`, `description`, `sort_order`) VALUES 
('cat_001', 'Danh mục mặc định', 'Danh mục sản phẩm mặc định của hệ thống', 1),
('cat_002', 'Sản phẩm điện tử', 'Các thiết bị điện tử và phụ kiện', 2),
('cat_003', 'Đồ dùng văn phòng', 'Đồ dùng hàng ngày trong văn phòng', 3),
('cat_004', 'Quần áo và giày dép', 'Các sản phẩm quần áo và giày dép', 4);

-- Chèn cấu hình hệ thống (cài đặt cơ bản)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('systemName', 'Hệ thống quản lý khách hàng CRM', 'string', 'basic_settings', 'Tên hệ thống', TRUE, TRUE, 1),
('systemVersion', '1.0.0', 'string', 'basic_settings', 'Phiên bản hệ thống', TRUE, TRUE, 2),
('companyName', '', 'string', 'basic_settings', 'Tên công ty', TRUE, TRUE, 3),
('contactPhone', '', 'string', 'basic_settings', 'Số điện thoại liên hệ', TRUE, TRUE, 4),
('contactEmail', '', 'string', 'basic_settings', 'Email liên hệ', TRUE, TRUE, 5),
('websiteUrl', '', 'string', 'basic_settings', 'Địa chỉ website', TRUE, TRUE, 6),
('companyAddress', '', 'string', 'basic_settings', 'Địa chỉ công ty', TRUE, TRUE, 7),
('systemDescription', '', 'text', 'basic_settings', 'Mô tả hệ thống', TRUE, TRUE, 8),
('systemLogo', '', 'text', 'basic_settings', 'Logo hệ thống', TRUE, TRUE, 9),
('contactQRCode', '', 'text', 'basic_settings', 'Mã QR liên hệ', TRUE, TRUE, 10),
('contactQRCodeLabel', 'Quét mã để liên hệ', 'string', 'basic_settings', 'Nhãn mã QR', TRUE, TRUE, 11);

-- Chèn cấu hình hệ thống (cài đặt bảo mật)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('passwordMinLength', '6', 'number', 'security_settings', 'Độ dài tối thiểu mật khẩu', TRUE, TRUE, 1),
('passwordComplexity', '[]', 'json', 'security_settings', 'Yêu cầu độ phức tạp mật khẩu', TRUE, TRUE, 2),
('passwordExpireDays', '0', 'number', 'security_settings', 'Thời hạn mật khẩu (ngày)', TRUE, TRUE, 3),
('loginFailLock', 'false', 'boolean', 'security_settings', 'Khóa khi đăng nhập thất bại', TRUE, TRUE, 4),
('maxLoginFails', '5', 'number', 'security_settings', 'Số lần thất bại tối đa', TRUE, TRUE, 5),
('lockDuration', '30', 'number', 'security_settings', 'Thời gian khóa (phút)', TRUE, TRUE, 6),
('sessionTimeout', '120', 'number', 'security_settings', 'Thời gian hết hạn phiên (phút)', TRUE, TRUE, 7),
('forceHttps', 'false', 'boolean', 'security_settings', 'Bắt buộc HTTPS', TRUE, TRUE, 8),
('ipWhitelist', '', 'text', 'security_settings', 'Danh sách trắng IP', TRUE, TRUE, 9);

-- Chèn cấu hình hệ thống (cài đặt cuộc gọi)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('sipServer', '', 'string', 'call_settings', 'Địa chỉ máy chủ SIP', TRUE, TRUE, 1),
('sipPort', '5060', 'number', 'call_settings', 'Cổng SIP', TRUE, TRUE, 2),
('sipUsername', '', 'string', 'call_settings', 'Tên người dùng SIP', TRUE, TRUE, 3),
('sipPassword', '', 'string', 'call_settings', 'Mật khẩu SIP', TRUE, TRUE, 4),
('sipTransport', 'UDP', 'string', 'call_settings', 'Giao thức truyền tải', TRUE, TRUE, 5),
('autoAnswer', 'false', 'boolean', 'call_settings', 'Tự động nghe máy', TRUE, TRUE, 6),
('autoRecord', 'false', 'boolean', 'call_settings', 'Tự động ghi âm', TRUE, TRUE, 7),
('qualityMonitoring', 'false', 'boolean', 'call_settings', 'Giám sát chất lượng cuộc gọi', TRUE, TRUE, 8),
('incomingCallPopup', 'true', 'boolean', 'call_settings', 'Cửa sổ bật lên cuộc gọi đến', TRUE, TRUE, 9),
('maxCallDuration', '3600', 'number', 'call_settings', 'Thời lượng cuộc gọi tối đa (giây)', TRUE, TRUE, 10),
('recordFormat', 'mp3', 'string', 'call_settings', 'Định dạng ghi âm', TRUE, TRUE, 11),
('recordQuality', 'standard', 'string', 'call_settings', 'Chất lượng ghi âm', TRUE, TRUE, 12),
('recordPath', './recordings', 'string', 'call_settings', 'Đường dẫn lưu ghi âm', TRUE, TRUE, 13),
('recordRetentionDays', '90', 'number', 'call_settings', 'Thời gian lưu trữ ghi âm (ngày)', TRUE, TRUE, 14),
('outboundPermission', '["admin","manager","sales"]', 'json', 'call_settings', 'Quyền gọi ra', TRUE, TRUE, 15),
('recordAccessPermission', '["admin","manager"]', 'json', 'call_settings', 'Quyền truy cập ghi âm', TRUE, TRUE, 16),
('statisticsPermission', '["admin","manager"]', 'json', 'call_settings', 'Quyền thống kê cuộc gọi', TRUE, TRUE, 17),
('numberRestriction', 'false', 'boolean', 'call_settings', 'Hạn chế số điện thoại', TRUE, TRUE, 18),
('allowedPrefixes', '', 'text', 'call_settings', 'Tiền tố số điện thoại được phép', TRUE, TRUE, 19);

-- Chèn cấu hình hệ thống (cài đặt email)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('smtpHost', '', 'string', 'email_settings', 'Địa chỉ máy chủ SMTP', TRUE, TRUE, 1),
('smtpPort', '587', 'number', 'email_settings', 'Cổng SMTP', TRUE, TRUE, 2),
('senderEmail', '', 'string', 'email_settings', 'Email người gửi', TRUE, TRUE, 3),
('senderName', '', 'string', 'email_settings', 'Tên người gửi', TRUE, TRUE, 4),
('emailPassword', '', 'string', 'email_settings', 'Mật khẩu email', TRUE, TRUE, 5),
('enableSsl', 'true', 'boolean', 'email_settings', 'Bật SSL', TRUE, TRUE, 6),
('enableTls', 'false', 'boolean', 'email_settings', 'Bật TLS', TRUE, TRUE, 7),
('testEmail', '', 'string', 'email_settings', 'Email kiểm tra', TRUE, TRUE, 8);

-- Chèn cấu hình hệ thống (cài đặt SMS)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('provider', 'aliyun', 'string', 'sms_settings', 'Nhà cung cấp dịch vụ SMS', TRUE, TRUE, 1),
('accessKey', '', 'string', 'sms_settings', 'AccessKey', TRUE, TRUE, 2),
('secretKey', '', 'string', 'sms_settings', 'SecretKey', TRUE, TRUE, 3),
('signName', '', 'string', 'sms_settings', 'Chữ ký SMS', TRUE, TRUE, 4),
('dailyLimit', '100', 'number', 'sms_settings', 'Giới hạn gửi hàng ngày', TRUE, TRUE, 5),
('monthlyLimit', '3000', 'number', 'sms_settings', 'Giới hạn gửi hàng tháng', TRUE, TRUE, 6),
('enabled', 'false', 'boolean', 'sms_settings', 'Bật chức năng SMS', TRUE, TRUE, 7),
('requireApproval', 'false', 'boolean', 'sms_settings', 'Cần phê duyệt', TRUE, TRUE, 8),
('testPhone', '', 'string', 'sms_settings', 'Số điện thoại kiểm tra', TRUE, TRUE, 9);

-- Chèn cấu hình hệ thống (cài đặt lưu trữ)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('storageType', 'local', 'string', 'storage_settings', 'Loại lưu trữ', TRUE, TRUE, 1),
('localPath', './uploads', 'string', 'storage_settings', 'Đường dẫn lưu trữ cục bộ', TRUE, TRUE, 2),
('localDomain', '', 'string', 'storage_settings', 'Tên miền truy cập', TRUE, TRUE, 3),
('accessKey', '', 'string', 'storage_settings', 'Access Key', TRUE, TRUE, 4),
('secretKey', '', 'string', 'storage_settings', 'Secret Key', TRUE, TRUE, 5),
('bucketName', '', 'string', 'storage_settings', 'Tên bucket lưu trữ', TRUE, TRUE, 6),
('region', 'oss-cn-hangzhou', 'string', 'storage_settings', 'Khu vực lưu trữ', TRUE, TRUE, 7),
('customDomain', '', 'string', 'storage_settings', 'Tên miền tùy chỉnh', TRUE, TRUE, 8),
('maxFileSize', '10', 'number', 'storage_settings', 'Kích thước tệp tối đa (MB)', TRUE, TRUE, 9),
('allowedTypes', 'jpg,png,gif,pdf,doc,docx,xls,xlsx', 'string', 'storage_settings', 'Loại tệp được phép', TRUE, TRUE, 10);

-- Chèn cấu hình hệ thống (cài đặt sản phẩm)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('maxDiscountPercent', '50', 'number', 'product_settings', 'Tỷ lệ giảm giá tối đa toàn cục', TRUE, TRUE, 1),
('adminMaxDiscount', '50', 'number', 'product_settings', 'Giảm giá tối đa quản trị viên', TRUE, TRUE, 2),
('managerMaxDiscount', '30', 'number', 'product_settings', 'Giảm giá tối đa trưởng phòng', TRUE, TRUE, 3),
('salesMaxDiscount', '15', 'number', 'product_settings', 'Giảm giá tối đa nhân viên bán hàng', TRUE, TRUE, 4),
('discountApprovalThreshold', '20', 'number', 'product_settings', 'Ngưỡng phê duyệt giảm giá', TRUE, TRUE, 5),
('allowPriceModification', 'true', 'boolean', 'product_settings', 'Cho phép sửa giá', TRUE, TRUE, 6),
('priceModificationRoles', '["admin","manager"]', 'json', 'product_settings', 'Quyền sửa giá', TRUE, TRUE, 7),
('enablePriceHistory', 'true', 'boolean', 'product_settings', 'Ghi lại thay đổi giá', TRUE, TRUE, 8),
('pricePrecision', '2', 'string', 'product_settings', 'Độ chính xác hiển thị giá', TRUE, TRUE, 9),
('enableInventory', 'false', 'boolean', 'product_settings', 'Bật quản lý kho', TRUE, TRUE, 10),
('lowStockThreshold', '10', 'number', 'product_settings', 'Ngưỡng cảnh báo tồn kho thấp', TRUE, TRUE, 11),
('allowNegativeStock', 'false', 'boolean', 'product_settings', 'Cho phép bán tồn kho âm', TRUE, TRUE, 12),
('defaultCategory', '', 'string', 'product_settings', 'Danh mục mặc định', TRUE, TRUE, 13),
('maxCategoryLevel', '3', 'number', 'product_settings', 'Giới hạn cấp độ danh mục', TRUE, TRUE, 14),
('enableCategoryCode', 'false', 'boolean', 'product_settings', 'Bật mã danh mục', TRUE, TRUE, 15),
('costPriceViewRoles', '["super_admin","admin"]', 'json', 'product_settings', 'Quyền xem giá vốn', TRUE, TRUE, 16),
('salesDataViewRoles', '["super_admin","admin","manager"]', 'json', 'product_settings', 'Quyền xem dữ liệu bán hàng', TRUE, TRUE, 17),
('stockInfoViewRoles', '["super_admin","admin","manager"]', 'json', 'product_settings', 'Quyền xem thông tin tồn kho', TRUE, TRUE, 18),
('operationLogsViewRoles', '["super_admin","admin"]', 'json', 'product_settings', 'Quyền xem nhật ký thao tác', TRUE, TRUE, 19),
('sensitiveInfoHideMethod', 'asterisk', 'string', 'product_settings', 'Phương thức ẩn thông tin nhạy cảm', TRUE, TRUE, 20),
('enablePermissionControl', 'true', 'boolean', 'product_settings', 'Bật kiểm soát quyền', TRUE, TRUE, 21);

-- Chèn cấu hình hệ thống (cài đặt sao lưu dữ liệu)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('autoBackupEnabled', 'false', 'boolean', 'backup_settings', 'Sao lưu tự động', TRUE, TRUE, 1),
('backupFrequency', 'daily', 'string', 'backup_settings', 'Tần suất sao lưu', TRUE, TRUE, 2),
('retentionDays', '30', 'number', 'backup_settings', 'Số ngày lưu trữ', TRUE, TRUE, 3),
('compression', 'true', 'boolean', 'backup_settings', 'Nén sao lưu', TRUE, TRUE, 4);

-- Chèn cấu hình hệ thống (cài đặt thỏa thuận người dùng)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('userAgreementEnabled', 'true', 'boolean', 'agreement_settings', 'Bật thỏa thuận người dùng', TRUE, TRUE, 1),
('userAgreementTitle', 'Thỏa thuận dịch vụ người dùng', 'string', 'agreement_settings', 'Tiêu đề thỏa thuận người dùng', TRUE, TRUE, 2),
('userAgreementContent', '', 'text', 'agreement_settings', 'Nội dung thỏa thuận người dùng', TRUE, TRUE, 3),
('privacyAgreementEnabled', 'true', 'boolean', 'agreement_settings', 'Bật thỏa thuận bảo mật', TRUE, TRUE, 4),
('privacyAgreementTitle', 'Chính sách bảo mật', 'string', 'agreement_settings', 'Tiêu đề thỏa thuận bảo mật', TRUE, TRUE, 5),
('privacyAgreementContent', '', 'text', 'agreement_settings', 'Nội dung thỏa thuận bảo mật', TRUE, TRUE, 6);

-- Chèn cấu hình hệ thống (cài đặt chung)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('maxUploadSize', '10485760', 'number', 'general', 'Kích thước tệp tải lên tối đa (byte)', TRUE, TRUE, 1),
('enableEmailNotification', 'true', 'boolean', 'general', 'Bật thông báo email', TRUE, TRUE, 2),
('enableSmsNotification', 'false', 'boolean', 'general', 'Bật thông báo SMS', TRUE, TRUE, 3);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- Thông báo hoàn thành
-- =============================================
SELECT 'Khởi tạo cơ sở dữ liệu hoàn tất!' AS message;
SELECT 'Tài khoản mặc định:' AS info;
SELECT 'superadmin / super123456 (Siêu quản trị viên)' AS account_1;
SELECT 'admin / admin123 (Quản trị viên)' AS account_2;
SELECT 'manager / manager123 (Trưởng phòng ban)' AS account_3;
SELECT 'sales / sales123 (Nhân viên bán hàng)' AS account_4;
SELECT 'service / service123 (Nhân viên dịch vụ khách hàng)' AS account_5;

-- =============================================
-- Script sửa dữ liệu (thực thi sau khi triển khai)
-- =============================================

-- Sửa đường dẫn hình ảnh: đổi /api/v1/uploads/ thành /uploads/
-- Lưu ý: Dịch vụ tệp tĩnh của backend được cấu hình với đường dẫn /uploads, cần đảm bảo đường dẫn hình ảnh lưu trong cơ sở dữ liệu nhất quán
UPDATE system_configs 
SET configValue = REPLACE(configValue, '/api/v1/uploads/', '/uploads/'),
    updatedAt = NOW()
WHERE configValue LIKE '%/api/v1/uploads/%';

-- Sửa đường dẫn ảnh đại diện người dùng
UPDATE users 
SET avatar = REPLACE(avatar, '/api/v1/uploads/', '/uploads/'),
    updated_at = NOW()
WHERE avatar LIKE '%/api/v1/uploads/%';

-- Sửa đường dẫn hình ảnh sản phẩm
UPDATE products 
SET images = REPLACE(images, '/api/v1/uploads/', '/uploads/'),
    updated_at = NOW()
WHERE images LIKE '%/api/v1/uploads/%';

-- Sửa đường dẫn ảnh chụp đặt cọc đơn hàng
UPDATE orders 
SET deposit_screenshots = REPLACE(deposit_screenshots, '/api/v1/uploads/', '/uploads/'),
    updated_at = NOW()
WHERE deposit_screenshots LIKE '%/api/v1/uploads/%';

-- Sửa đường dẫn tệp đính kèm dịch vụ sau bán hàng
UPDATE after_sales_services 
SET attachments = REPLACE(attachments, '/api/v1/uploads/', '/uploads/'),
    updated_at = NOW()
WHERE attachments LIKE '%/api/v1/uploads/%';

-- =============================================
-- Hướng dẫn cấu hình Nginx (Bảng điều khiển Bảo Tháp)
-- =============================================
-- Cần thêm các quy tắc sau vào cấu hình Nginx để tệp tĩnh có thể truy cập bình thường:
-- 
-- location /uploads {
--     alias /www/wwwroot/thư_mục_dự_án_của_bạn/backend/uploads;
--     expires 30d;
--     add_header Cache-Control "public, immutable";
--     add_header Access-Control-Allow-Origin *;
-- }
-- 
-- location /api/v1/uploads {
--     alias /www/wwwroot/thư_mục_dự_án_của_bạn/backend/uploads;
--     expires 30d;
--     add_header Cache-Control "public, immutable";
--     add_header Access-Control-Allow-Origin *;
-- }
-- =============================================
