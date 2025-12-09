# Hướng Dẫn Đăng Nhập Người Dùng

## Tài Khoản Test Mặc Định

Hệ thống có sẵn 5 tài khoản mặc định，các tài khoản này được viết trong source code（`src/config/presetAccounts.ts`），có hiệu lực vĩnh viễn，không bị xóa.

### Danh Sách Tài Khoản

| Vai trò | Tên đăng nhập | Mật khẩu | Họ tên | Phòng ban | Mô tả |
|------|--------|------|------|------|------|
| Siêu quản trị viên | `superadmin` | `super123456` | Siêu quản trị viên | Phòng quản lý hệ thống | Có tất cả quyền |
| Quản trị viên hệ thống | `admin` | `admin123` | Quản trị viên hệ thống | Phòng quản lý | Có tất cả quyền |
| Trưởng phòng ban | `manager` | `manager123` | Trưởng phòng Trương | Phòng bán hàng | Quản lý nghiệp vụ và team phòng ban |
| Nhân viên bán hàng | `sales` | `sales123` | Nhân viên bán hàng Lý | Phòng bán hàng | Phát triển khách hàng và quản lý đơn hàng |
| Dịch vụ khách hàng | `service` | `service123` | Dịch vụ khách hàng Vương | Phòng dịch vụ khách hàng | Xử lý đơn hàng、logistics、dịch vụ sau bán hàng |

## Đăng Nhập Nhanh

### Cách 1：Đăng Nhập Trực Tiếp
1. Mở trang đăng nhập hệ thống
2. Nhập tên đăng nhập và mật khẩu
3. Click nút "Đăng nhập"

### Cách 2：Đăng Nhập Nhanh Tài Khoản Test
Trang đăng nhập cung cấp nút đăng nhập nhanh，click để tự động điền tài khoản mật khẩu：
- Siêu quản trị viên
- Quản trị viên
- Trưởng phòng ban
- Nhân viên bán hàng
- Dịch vụ khách hàng

## Mô Tả Quyền Vai Trò

### Siêu Quản Trị Viên / Quản Trị Viên
- ✅ Tất cả quyền chức năng
- ✅ Quyền quản lý hệ thống
- ✅ Quyền quản lý người dùng
- ✅ Cấu hình quyền vai trò
- ✅ Xem tất cả dữ liệu

### Trưởng Phòng Ban
- ✅ Dashboard dữ liệu
- ✅ Quản lý khách hàng（Xem、Thêm、Sửa、Import/Export）
- ✅ Quản lý đơn hàng（Xem、Thêm）
- ✅ Thống kê thành tích（Thành tích cá nhân、Thành tích team）
- ✅ Quản lý logistics（Xem、Theo dõi）
- ✅ Quản lý dịch vụ sau bán hàng（Xem、Thêm）
- ✅ Quản lý tài liệu（Xem、Tìm kiếm）
- ✅ Quản lý cuộc gọi（Xem、Gọi）
- ❌ Chức năng quản lý hệ thống

### Nhân Viên Bán Hàng
- ✅ Dashboard dữ liệu
- ✅ Quản lý khách hàng（Xem、Thêm）
- ✅ Quản lý đơn hàng（Xem、Thêm）
- ✅ Thống kê thành tích（Thành tích cá nhân、Thành tích team）
- ✅ Quản lý logistics（Xem、Theo dõi）
- ✅ Quản lý dịch vụ sau bán hàng（Xem、Thêm）
- ✅ Quản lý tài liệu（Xem、Tìm kiếm）
- ✅ Quản lý cuộc gọi（Xem、Gọi）
- ❌ Import/Export khách hàng
- ❌ Chức năng quản lý hệ thống

### Dịch Vụ Khách Hàng
- ✅ Dashboard dữ liệu
- ✅ Quản lý đơn hàng（Xem、Phê duyệt）
- ✅ Quản lý logistics（Xem、Theo dõi、Gửi hàng、Cập nhật trạng thái）⭐
- ✅ Quản lý dịch vụ sau bán hàng（Quyền đầy đủ：Xem、Thêm、Dữ liệu dịch vụ sau bán hàng）⭐
- ✅ Quản lý tài liệu（Xem、Tìm kiếm）
- ❌ Quản lý khách hàng
- ❌ Thống kê thành tích
- ❌ Chức năng quản lý hệ thống

**Lưu ý**：Vai trò dịch vụ khách hàng tập trung vào xử lý đơn hàng、theo dõi logistics và dịch vụ sau bán hàng，có quyền đặc biệt cập nhật trạng thái và dữ liệu dịch vụ sau bán hàng.

## Thêm Người Dùng

Siêu quản trị viên và quản trị viên có thể thêm người dùng trong "Quản lý hệ thống → Quản lý người dùng"：

1. Click nút "Thêm người dùng"
2. Điền thông tin người dùng：
   - Tên đăng nhập（Tài khoản đăng nhập）
   - Mật khẩu
   - Họ tên
   - Số điện thoại
   - Email
   - Phòng ban thuộc về
   - Chức vụ
   - Vai trò
3. Click "Xác nhận" để lưu

Người dùng mới có thể sử dụng tài khoản mật khẩu đăng nhập hệ thống ngay.

## Đổi Mật Khẩu

Người dùng sau khi đăng nhập có thể đổi mật khẩu của mình：

1. Click avatar góc trên bên phải
2. Chọn "Đổi mật khẩu"
3. Nhập mật khẩu cũ và mật khẩu mới
4. Click "Xác nhận" để lưu

## Lưu Ý

1. **Tài khoản mặc định không thể xóa**：5 tài khoản mặc định là tích hợp sẵn trong hệ thống，không thể xóa hoặc vô hiệu hóa
2. **Quyền có hiệu lực ngay**：Sau khi quản trị viên sửa quyền vai trò，người dùng làm mới trang sẽ thấy quyền mới
3. **Phân tách dữ liệu**：Vai trò khác nhau thấy phạm vi dữ liệu khác nhau，hệ thống tự động kiểm soát quyền dữ liệu
4. **Khuyến nghị bảo mật**：
   - Sau khi đăng nhập lần đầu vui lòng đổi mật khẩu ngay
   - Đổi mật khẩu định kỳ
   - Không cho người khác biết tài khoản mật khẩu
   - Khi rời đi vui lòng đăng xuất kịp thời

## Câu Hỏi Thường Gặp

### Q: Quên mật khẩu phải làm sao？
A: Vui lòng liên hệ quản trị viên hệ thống để reset mật khẩu.

### Q: Tại sao không thấy một số menu？
A: Đây là kiểm soát quyền bình thường，vai trò khác nhau thấy menu khác nhau. Nếu cần thêm quyền，vui lòng liên hệ quản trị viên.

### Q: Người dùng mới thêm tại sao không thể đăng nhập？
A: Vui lòng kiểm tra：
1. Trạng thái người dùng có phải "Đang làm việc" không
2. Tên đăng nhập và mật khẩu có đúng không
3. Đã phân vai trò chưa

### Q: Làm thế nào để xem quyền của mình？
A: Sau khi đăng nhập，menu bạn thấy được chính là quyền bạn có. Cũng có thể xem thông tin vai trò trong "Cài đặt cá nhân".
