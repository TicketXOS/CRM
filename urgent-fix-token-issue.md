# Sửa Chữa Khẩn Cấp - Vấn Đề TOKEN Không Tìm Thấy

## Nguyên Nhân Vấn Đề

Hệ thống của bạn đang sử dụng **chế độ Mock API**（API mô phỏng），nhưng trong localStorage **không có dữ liệu người dùng**，dẫn đến khi đăng nhập không tìm thấy người dùng，không thể tạo TOKEN.

## TOKEN Là Gì？

**TOKEN（Token）** = "Chứng minh thư số" của bạn
- Sau khi đăng nhập thành công，hệ thống cấp cho bạn một chuỗi mã hóa
- Sau đó mỗi lần thao tác đều mang theo TOKEN này để chứng minh danh tính
- Giống như vào khu dân cư cần thẻ ra vào vậy

## Giải Pháp Ngay Lập Tức

### Phương Án 1：Sử Dụng Tài Khoản Mặc Định Đăng Nhập（Khuyến nghị）

Hệ thống có sẵn tài khoản mặc định，sử dụng trực tiếp：

**Tài khoản siêu quản trị viên：**
- Tên đăng nhập：`admin`
- Mật khẩu：`admin123`

**Tài khoản quản lý phòng ban：**
- Tên đăng nhập：`manager`  
- Mật khẩu：`manager123`

**Tài khoản nhân viên bán hàng：**
- Tên đăng nhập：`sales001`
- Mật khẩu：`sales123`

### Phương Án 2：Chuyển Sang Backend API Thật

Nếu backend server của bạn đã khởi động，thực thi trong console trình duyệt：

```javascript
// Vô hiệu hóa Mock API
localStorage.removeItem('erp_mock_enabled')
// Làm mới trang
location.reload()
```

### Phương Án 3：Khởi Tạo Dữ Liệu Người Dùng Thủ Công

Thực thi code sau trong console trình duyệt：

```javascript
// Khởi tạo dữ liệu người dùng
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    realName: 'Quản Trị Viên Hệ Thống',
    email: 'admin@example.com',
    phone: '13800138000',
    role: 'super_admin',
    roleId: 'super_admin',
    status: 'active',
    departmentId: 1,
    departmentName: 'Phòng Quản Lý'
  }
];

localStorage.setItem('crm_mock_users', JSON.stringify(users));
console.log('Dữ liệu người dùng đã được khởi tạo，vui lòng làm mới trang và đăng nhập lại');
location.reload();
```

## Kiểm Tra Trạng Thái Hiện Tại

Thực thi trong console trình duyệt：

```javascript
// Kiểm tra có bật Mock API không
console.log('Trạng thái Mock API:', localStorage.getItem('erp_mock_enabled'));

// Kiểm tra có dữ liệu người dùng không
console.log('Dữ liệu người dùng:', localStorage.getItem('crm_mock_users'));

// Kiểm tra TOKEN hiện tại
console.log('TOKEN hiện tại:', localStorage.getItem('auth_token'));
```

## Tại Sao Lại Xuất Hiện Vấn Đề Này？

1. **Chế độ Mock API được bật**：Hệ thống đang sử dụng API mô phỏng frontend，không kết nối backend thật
2. **localStorage bị xóa**：Cache trình duyệt bị xóa，dữ liệu người dùng mất
3. **Tài khoản mặc định chưa được load**：Hệ thống không load đúng tài khoản mặc định có sẵn

## Giải Pháp Lâu Dài

### 1. Đảm Bảo Tài Khoản Mặc Định Luôn Khả Dụng

Tôi cần sửa code，đảm bảo ngay cả khi localStorage trống，tài khoản mặc định vẫn hoạt động bình thường.

### 2. Thêm Tự Động Khởi Tạo

Khi khởi động hệ thống tự động kiểm tra và khởi tạo dữ liệu cần thiết.

### 3. Cải Thiện Thông Báo Lỗi

Khi không tìm thấy TOKEN，đưa ra gợi ý giải pháp rõ ràng.

## Bước Tiếp Theo

1. **Thử ngay phương án 1**：Sử dụng `admin` / `admin123` đăng nhập
2. **Nếu vẫn thất bại**：Thực thi phương án 3 khởi tạo dữ liệu
3. **Cung cấp ảnh chụp màn hình**：
   - Log đầy đủ của console trình duyệt
   - Request đăng nhập trong tab Network
   - Nội dung localStorage（F12 → Application → Local Storage）

## Những Gì Tôi Sẽ Sửa

Tôi sẽ sửa code ngay，đảm bảo：
1. Tài khoản mặc định luôn khả dụng，không phụ thuộc localStorage
2. Khi đăng nhập thất bại đưa ra thông báo lỗi rõ ràng và giải pháp
3. Tự động khởi tạo dữ liệu cần thiết
