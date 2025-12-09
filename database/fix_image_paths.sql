-- =============================================
  -- Ảnh đường dẫn sửa chữa script
  -- Mục đích：Sửa chữa vấn đề đường dẫn ảnh trong cơ sở dữ liệu
  -- Cách thực hiện：Thực thi trong phpMyAdmin của Panel Bảo Tháp
-- =============================================

-- 1. Sửa chữa đường dẫn ảnh trong bảng cấu hình hệ thống（loại bỏ tiền tố /api/v1）
UPDATE system_configs 
SET configValue = REPLACE(configValue, '/api/v1/uploads/', '/uploads/')
WHERE configKey IN ('systemLogo', 'contactQRCode')
  AND configValue LIKE '%/api/v1/uploads/%';

-- 2. Sửa chữa đường dẫn ảnh trong bảng sản phẩm
UPDATE products 
SET images = REPLACE(images, '/api/v1/uploads/', '/uploads/')
WHERE images LIKE '%/api/v1/uploads/%';

-- 3. Sửa chữa đường dẫn ảnh trong bảng người dùng
UPDATE users 
SET avatar = REPLACE(avatar, '/api/v1/uploads/', '/uploads/')
WHERE avatar LIKE '%/api/v1/uploads/%';

-- 4. Sửa chữa đường dẫn ảnh trong bảng đơn hàng
UPDATE orders 
SET deposit_screenshots = REPLACE(deposit_screenshots, '/api/v1/uploads/', '/uploads/')
WHERE deposit_screenshots LIKE '%/api/v1/uploads/%';

-- 5. Sửa chữa đường dẫn ảnh trong bảng dịch vụ sau bán hàng
UPDATE after_sales_services 
SET attachments = REPLACE(attachments, '/api/v1/uploads/', '/uploads/')
WHERE attachments LIKE '%/api/v1/uploads/%';

-- 6. Xem kết quả sửa chữa
SELECT 'Ảnh cấu hình hệ thống' as 'Loại', COUNT(*) as 'Số lượng' 
FROM system_configs 
WHERE configKey IN ('systemLogo', 'contactQRCode') AND configValue LIKE '/uploads/%'
UNION ALL
SELECT 'Ảnh sản phẩm' as 'Loại', COUNT(*) as 'Số lượng' 
FROM products 
WHERE images LIKE '%/uploads/%'
UNION ALL
SELECT 'Ảnh người dùng' as 'Loại', COUNT(*) as 'Số lượng' 
FROM users 
WHERE avatar LIKE '/uploads/%';

-- Thông báo hoàn tất
SELECT 'Sửa chữa đường dẫn ảnh hoàn tất！' as 'Trạng thái';