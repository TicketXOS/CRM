const fs = require('fs');
const path = require('path');

// Thư mục file entity
const entitiesDir = path.join(__dirname, '../entities');

// Danh sách file cần sửa
const files = [
  'ProductCategory.ts',
  'OrderStatusHistory.ts',
  'OperationLog.ts',
  'Product.ts',
  'User.ts',
  'Customer.ts',
  'Order.ts',
  'SystemConfig.ts'
];

// Hàm sửa kiểu enum
function fixEnumTypes(content) {
  // Thay thế type: 'enum' thành type: 'varchar'
  // Và thêm length: 50 nếu chưa chỉ định độ dài
  return content.replace(
    /(@Column\(\s*\{[^}]*?)type:\s*['"]enum['"][^}]*?enum:\s*\[[^\]]*\][^}]*?\}/gs,
    (match) => {
      // Xóa thuộc tính enum và thay thế type
      let fixed = match
        .replace(/type:\s*['"]enum['"]/, "type: 'varchar'")
        .replace(/,?\s*enum:\s*\[[^\]]*\]/, '');

      // Nếu chưa có thuộc tính length, thêm một
      if (!fixed.includes('length:')) {
        fixed = fixed.replace(/type:\s*['"]varchar['"]/, "type: 'varchar',\n    length: 50");
      }

      return fixed;
    }
  );
}

// Xử lý từng file
files.forEach(filename => {
  const filePath = path.join(entitiesDir, filename);

  if (fs.existsSync(filePath)) {
    console.log(`Đang sửa file: ${filename}`);

    // Đọc nội dung file
    const content = fs.readFileSync(filePath, 'utf8');

    // Sửa kiểu enum
    const fixedContent = fixEnumTypes(content);

    // Ghi lại file
    fs.writeFileSync(filePath, fixedContent, 'utf8');

    console.log(`✅ ${filename} đã sửa xong`);
  } else {
    console.log(`⚠️  File không tồn tại: ${filename}`);
  }
});

console.log('🎉 Đã sửa xong tất cả kiểu enum!');
