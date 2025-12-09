-- =============================================
-- Bảng cấu hình cài đặt khóa tên sửa chữa script
-- Sử dụng để cập nhật các khóa tên có tiền tố trong phiên bản đầu tiên thành khóa tên mới không có tiền tố
-- Thực hiện trước khi sao lưu cơ sở dữ liệu！
-- =============================================

SET NAMES utf8mb4;

-- 1. Sửa tên khóa cấu hình SMS (nhóm sms_settings)
UPDATE `system_configs` SET `configKey` = 'provider' WHERE `configKey` = 'smsProvider' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'accessKey' WHERE `configKey` = 'smsAccessKey' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'secretKey' WHERE `configKey` = 'smsSecretKey' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'signName' WHERE `configKey` = 'smsSignName' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'dailyLimit' WHERE `configKey` = 'smsDailyLimit' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'monthlyLimit' WHERE `configKey` = 'smsMonthlyLimit' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'enabled' WHERE `configKey` = 'smsEnabled' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'requireApproval' WHERE `configKey` = 'smsRequireApproval' AND `configGroup` = 'sms_settings';
UPDATE `system_configs` SET `configKey` = 'testPhone' WHERE `configKey` = 'smsTestPhone' AND `configGroup` = 'sms_settings';

-- 2. Sửa tên khóa cấu hình lưu trữ (nhóm storage_settings)
UPDATE `system_configs` SET `configKey` = 'accessKey' WHERE `configKey` = 'ossAccessKey' AND `configGroup` = 'storage_settings';
UPDATE `system_configs` SET `configKey` = 'secretKey' WHERE `configKey` = 'ossSecretKey' AND `configGroup` = 'storage_settings';
UPDATE `system_configs` SET `configKey` = 'bucketName' WHERE `configKey` = 'ossBucketName' AND `configGroup` = 'storage_settings';
UPDATE `system_configs` SET `configKey` = 'region' WHERE `configKey` = 'ossRegion' AND `configGroup` = 'storage_settings';
UPDATE `system_configs` SET `configKey` = 'customDomain' WHERE `configKey` = 'ossCustomDomain' AND `configGroup` = 'storage_settings';

    -- 3. Kiểm tra kết quả cập nhật
SELECT 'Cập nhật hoàn tất！Dưới đây là các nhóm cấu hình：' AS message;
SELECT configGroup AS 'Nhóm cấu hình', COUNT(*) AS 'Số lượng cấu hình' FROM `system_configs` GROUP BY configGroup ORDER BY configGroup;

-- 4. Hiển thị tên khóa cấu hình SMS
SELECT 'Cấu hình SMS：' AS message;
SELECT configKey, configValue FROM `system_configs` WHERE configGroup = 'sms_settings' ORDER BY sortOrder;

-- 5. Hiển thị tên khóa cấu hình lưu trữ
SELECT 'Cấu hình lưu trữ：' AS message;
SELECT configKey, configValue FROM `system_configs` WHERE configGroup = 'storage_settings' ORDER BY sortOrder;
