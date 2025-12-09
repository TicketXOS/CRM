-- =============================================
-- Script cập nhật tăng dần cài đặt hệ thống
-- Dùng để thêm/cập nhật các mục cấu hình hệ thống cho hệ thống đã triển khai
-- Đối với triển khai mới, vui lòng sử dụng trực tiếp schema.sql
-- Vui lòng sao lưu cơ sở dữ liệu trước khi thực hiện!
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Xóa dữ liệu cấu hình hệ thống cũ（tùy chọn，nếu cần giữ dữ liệu hiện có，vui lòng bỏ qua dòng này）
-- DELETE FROM `system_configs` WHERE `configGroup` IN ('security_settings', 'call_settings', 'email_settings', 'sms_settings', 'storage_settings', 'product_settings', 'backup_settings', 'agreement_settings');

-- 2. Thêm cấu hình bảo mật
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('passwordMinLength', '6', 'number', 'security_settings', 'Độ dài mật khẩu tối thiểu', TRUE, TRUE, 1),
('passwordComplexity', '[]', 'json', 'security_settings', 'Yêu cầu độ phức tạp mật khẩu', TRUE, TRUE, 2),
('passwordExpireDays', '0', 'number', 'security_settings', 'Thời hạn sử dụng mật khẩu(ngày)', TRUE, TRUE, 3),
('loginFailLock', 'false', 'boolean', 'security_settings', 'Đăng nhập thất bại khóa', TRUE, TRUE, 4),
('maxLoginFails', '5', 'number', 'security_settings', 'Số lần đăng nhập thất bại tối đa', TRUE, TRUE, 5),
('lockDuration', '30', 'number', 'security_settings', 'Thời gian khóa(phút)', TRUE, TRUE, 6),
('sessionTimeout', '120', 'number', 'security_settings', 'Thời gian hết hạn phiên(phút)', TRUE, TRUE, 7),
('forceHttps', 'false', 'boolean', 'security_settings', 'Bắt buộc HTTPS', TRUE, TRUE, 8),
('ipWhitelist', '', 'text', 'security_settings', 'Danh sách IP trắng', TRUE, TRUE, 9)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;

-- 3. Thêm cấu hình cuộc gọi
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('sipServer', '', 'string', 'call_settings', 'Địa chỉ SIP server', TRUE, TRUE, 1),
('sipPort', '5060', 'number', 'call_settings', 'Port SIP', TRUE, TRUE, 2),
('sipUsername', '', 'string', 'call_settings', 'Tên người dùng SIP', TRUE, TRUE, 3),
('sipPassword', '', 'string', 'call_settings', 'Mật khẩu SIP', TRUE, TRUE, 4),
('sipTransport', 'UDP', 'string', 'call_settings', 'Protocol truyền', TRUE, TRUE, 5),
('autoAnswer', 'false', 'boolean', 'call_settings', 'Tự động nhận cuộc gọi', TRUE, TRUE, 6),
('autoRecord', 'false', 'boolean', 'call_settings', 'Tự động ghi âm cuộc gọi', TRUE, TRUE, 7),
('recordAccessPermission', '["admin","manager"]', 'json', 'call_settings', 'Quyền truy cập ghi âm', TRUE, TRUE, 8),
('statisticsPermission', '["admin","manager"]', 'json', 'call_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 9),
('numberRestriction', 'false', 'boolean', 'call_settings', 'Giới hạn số điện thoại', TRUE, TRUE, 10),
('allowedPrefixes', '', 'text', 'call_settings', 'Tiền tố số điện thoại cho phép', TRUE, TRUE, 11)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;

-- 4. Thêm cấu hình email
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('smtpHost', '', 'string', 'email_settings', 'Địa chỉ SMTP server', TRUE, TRUE, 1),
('smtpPort', '587', 'number', 'email_settings', 'Port SMTP', TRUE, TRUE, 2),
('senderEmail', '', 'string', 'email_settings', 'Email người gửi', TRUE, TRUE, 3),
('senderName', '', 'string', 'email_settings', 'Tên người gửi', TRUE, TRUE, 4),
('emailPassword', '', 'string', 'email_settings', 'Mật khẩu email', TRUE, TRUE, 5),
('enableSsl', 'true', 'boolean', 'email_settings', 'Bật SSL', TRUE, TRUE, 6),
('enableTls', 'false', 'boolean', 'email_settings', 'Bật TLS', TRUE, TRUE, 7),
('testEmail', '', 'string', 'email_settings', 'Email kiểm tra', TRUE, TRUE, 8)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;

-- 5. Thêm cấu hình SMS
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('provider', 'aliyun', 'string', 'sms_settings', 'Dịch vụ SMS', TRUE, TRUE, 1),
('accessKey', '', 'string', 'sms_settings', 'AccessKey', TRUE, TRUE, 2),
('secretKey', '', 'string', 'sms_settings', 'SecretKey', TRUE, TRUE, 3),
('signName', '', 'string', 'sms_settings', 'Tên ký hiệu SMS', TRUE, TRUE, 4),
('dailyLimit', '100', 'number', 'sms_settings', 'Giới hạn gửi hàng ngày', TRUE, TRUE, 5),
('monthlyLimit', '3000', 'number', 'sms_settings', 'Giới hạn gửi hàng tháng', TRUE, TRUE, 6),
('enabled', 'false', 'boolean', 'sms_settings', 'Bật SMS', TRUE, TRUE, 7),
('requireApproval', 'true', 'boolean', 'sms_settings', 'Yêu cầu phê duyệt', TRUE, TRUE, 8),
('testPhone', '', 'string', 'sms_settings', 'Số điện thoại kiểm tra', TRUE, TRUE, 9)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;

-- 6. Thêm cấu hình lưu trữ (nhóm storage_settings)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('storageType', 'local', 'string', 'storage_settings', 'Loại lưu trữ', TRUE, TRUE, 1),
('localPath', './uploads', 'string', 'storage_settings', 'Đường dẫn lưu trữ', TRUE, TRUE, 2),
('localDomain', '', 'string', 'storage_settings', 'Tên miền', TRUE, TRUE, 3),
('accessKey', '', 'string', 'storage_settings', 'Access Key', TRUE, TRUE, 4),
('secretKey', '', 'string', 'storage_settings', 'Secret Key', TRUE, TRUE, 5),
('bucketName', '', 'string', 'storage_settings', 'Tên bucket', TRUE, TRUE, 6),
('region', 'oss-cn-hangzhou', 'string', 'storage_settings', 'Vùng lưu trữ', TRUE, TRUE, 7),
('customDomain', '', 'string', 'storage_settings', 'Tên miền tùy chỉnh', TRUE, TRUE, 8),
('maxFileSize', '10', 'number', 'storage_settings', 'Kích thước tối đa file(MB)', TRUE, TRUE, 9),
('allowedTypes', 'jpg,png,gif,pdf,doc,docx,xls,xlsx', 'string', 'storage_settings', 'Loại file cho phép', TRUE, TRUE, 10)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;


-- 7. Thêm cấu hình sản phẩm (nhóm product_settings)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('maxDiscountPercent', '50', 'number', 'product_settings', 'Tỷ lệ giảm giá tối đa', TRUE, TRUE, 1),
('adminMaxDiscount', '50', 'number', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 2),
('managerMaxDiscount', '30', 'number', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 3),
('salesMaxDiscount', '15', 'number', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 4),
('discountApprovalThreshold', '20', 'number', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 5),
('allowPriceModification', 'true', 'boolean', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 6),
('priceModificationRoles', '["admin","manager"]', 'json', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 7),
('enablePriceHistory', 'true', 'boolean', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 8),
('pricePrecision', '2', 'string', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 9),
('enableInventory', 'false', 'boolean', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 10),
('lowStockThreshold', '10', 'number', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 11),
('allowNegativeStock', 'false', 'boolean', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 12),
('defaultCategory', '', 'string', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 13),
('maxCategoryLevel', '3', 'number', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 14),
('enableCategoryCode', 'false', 'boolean', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 15),
('costPriceViewRoles', '["super_admin","admin"]', 'json', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 16),
('salesDataViewRoles', '["super_admin","admin","manager"]', 'json', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 17),
('stockInfoViewRoles', '["super_admin","admin","manager"]', 'json', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 18),
('operationLogsViewRoles', '["super_admin","admin"]', 'json', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 19),
('sensitiveInfoHideMethod', 'asterisk', 'string', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 20),
('enablePermissionControl', 'true', 'boolean', 'product_settings', 'Quyền truy cập thống kê cuộc gọi', TRUE, TRUE, 21)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;

-- 8. Thêm cấu hình backup (nhóm backup_settings)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('autoBackupEnabled', 'false', 'boolean', 'backup_settings', 'Bật backup', TRUE, TRUE, 1),
('backupFrequency', 'daily', 'string', 'backup_settings', 'Tần suất backup', TRUE, TRUE, 2),
('retentionDays', '30', 'number', 'backup_settings', 'Số ngày lưu trữ', TRUE, TRUE, 3),
('compression', 'true', 'boolean', 'backup_settings', 'Nén backup', TRUE, TRUE, 4)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;

-- 9. Thêm cấu hình agreement (nhóm agreement_settings)
INSERT INTO `system_configs` (`configKey`, `configValue`, `valueType`, `configGroup`, `description`, `isEnabled`, `isSystem`, `sortOrder`) VALUES 
('userAgreementEnabled', 'true', 'boolean', 'agreement_settings', 'Bật user agreement', TRUE, TRUE, 1),
('userAgreementTitle', 'User service agreement', 'string', 'agreement_settings', 'User agreement title', TRUE, TRUE, 2),
('userAgreementContent', '', 'text', 'agreement_settings', 'User agreement content', TRUE, TRUE, 3),
('privacyAgreementEnabled', 'true', 'boolean', 'agreement_settings', 'Bật privacy agreement', TRUE, TRUE, 4),
('privacyAgreementTitle', 'Privacy policy', 'string', 'agreement_settings', 'Privacy agreement title', TRUE, TRUE, 5),
('privacyAgreementContent', '', 'text', 'agreement_settings', 'Privacy agreement content', TRUE, TRUE, 6)
ON DUPLICATE KEY UPDATE `configValue` = VALUES(`configValue`), `updatedAt` = CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- Kiểm tra dữ liệu
-- =============================================
SELECT 'Cập nhật cơ sở dữ liệu cấu hình hệ thống hoàn tất！' AS message;
SELECT configGroup AS 'Nhóm cấu hình', COUNT(*) AS 'Số lượng cấu hình' FROM `system_configs` GROUP BY configGroup ORDER BY configGroup;
