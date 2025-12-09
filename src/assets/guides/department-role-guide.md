# Hướng Dẫn Thao Tác Quản Lý Phòng Ban Và Quyền Vai Trò

## 📋 Tổng Quan

Hướng dẫn này sẽ giúp bạn hiểu và sử dụng chức năng quản lý phòng ban và quyền vai trò trong hệ thống CRM，đảm bảo bạn có thể quản lý cấu trúc tổ chức và phân bổ quyền một cách hiệu quả.

## 🏢 Quản Lý Phòng Ban

### Khái Niệm Cơ Bản
- **Phòng ban**：Đơn vị cơ bản của tổ chức，dùng để phân chia các lĩnh vực nghiệp vụ khác nhau
- **Cấu trúc phân cấp**：Hỗ trợ lồng ghép phòng ban đa cấp，tạo thành cấu trúc tổ chức hoàn chỉnh
- **Người phụ trách phòng ban**：Mỗi phòng ban có thể chỉ định một hoặc nhiều người phụ trách

### Chức Năng Chính

#### 1. Xem Danh Sách Phòng Ban
- **Chế độ xem card**：Hiển thị thông tin phòng ban dưới dạng card，bao gồm tên phòng ban、mã、trạng thái、người phụ trách v.v.
- **Chế độ xem bảng**：Hiển thị dữ liệu phòng ban chi tiết dưới dạng bảng，hỗ trợ sắp xếp và lọc
- **Chức năng tìm kiếm**：Hỗ trợ tìm kiếm nhanh theo tên phòng ban、mã

#### 2. Thao Tác Phòng Ban
- **Tạo phòng ban mới**：Tạo phòng ban mới，thiết lập thông tin cơ bản và quan hệ phân cấp
- **Sửa phòng ban**：Sửa thông tin phòng ban，bao gồm tên、mã、người phụ trách v.v.
- **Xem chi tiết**：Click nút "Chi tiết" để xem thông tin đầy đủ của phòng ban
- **Xóa phòng ban**：Xóa phòng ban không cần thiết（cần xử lý thành viên trong phòng ban trước）

#### 3. Quản Lý Trạng Thái Phòng Ban
- **Bật/Tắt**：Thông qua công tắc trạng thái kiểm soát trạng thái hoạt động của phòng ban
- **Lọc trạng thái**：Có thể lọc xem theo trạng thái phòng ban

## 👥 Quản Lý Quyền Vai Trò

### Khái Niệm Cơ Bản
- **Vai trò**：Tập hợp các quyền，dùng để định nghĩa các thao tác người dùng có thể thực hiện
- **Quyền**：Quyền truy cập chức năng cụ thể，như xem、sửa、xóa v.v.
- **Kế thừa quyền**：Phòng ban cấp dưới có thể kế thừa cài đặt quyền của phòng ban cấp trên

### Loại Quyền

#### 1. Quyền Chức Năng
- **Quản lý khách hàng**：Quyền thêm sửa xóa tra cứu thông tin khách hàng
- **Quản lý đơn hàng**：Quyền xử lý đơn hàng và cập nhật trạng thái
- **Quản lý sản phẩm**：Quyền bảo trì thông tin sản phẩm
- **Phân tích dữ liệu**：Quyền xem báo cáo và dữ liệu thống kê

#### 2. Quyền Dữ Liệu
- **Tất cả dữ liệu**：Có thể xem tất cả dữ liệu
- **Dữ liệu phòng ban**：Chỉ có thể xem dữ liệu phòng ban và phòng ban cấp dưới
- **Dữ liệu cá nhân**：Chỉ có thể xem dữ liệu do mình tạo

#### 3. Quyền Thao Tác
- **Quyền xem**：Chỉ có thể xem dữ liệu，không thể sửa
- **Quyền sửa**：Có thể sửa dữ liệu
- **Quyền xóa**：Có thể xóa dữ liệu
- **Quyền phê duyệt**：Có thể phê duyệt quy trình nghiệp vụ liên quan

## 🔗 Mối Quan Hệ Giữa Phòng Ban Và Vai Trò

### Quy Trình Phân Bổ Quyền
1. **Tạo phòng ban** → Thiết lập thông tin cơ bản phòng ban
2. **Cấu hình vai trò** → Phân bổ quyền vai trò tương ứng cho phòng ban
3. **Phân bổ thành viên** → Phân người dùng vào phòng ban tương ứng
4. **Quyền có hiệu lực** → Người dùng tự động có quyền tương ứng với vai trò phòng ban

### Quy Tắc Kế Thừa Quyền
- Phòng ban con mặc định kế thừa quyền cơ bản của phòng ban cha
- Có thể cấu hình quyền bổ sung riêng cho phòng ban con
- Quyền chỉ có thể tăng，không thể giảm quyền đã có của phòng ban cha

## 📝 Các Bước Thao Tác

### Tạo Phòng Ban Mới
1. Click nút "Tạo phòng ban mới"
2. Điền thông tin cơ bản phòng ban（Tên、Mã、Mô tả v.v.）
3. Chọn phòng ban cấp trên（nếu là phòng ban con）
4. Chỉ định người phụ trách phòng ban
5. Lưu thông tin phòng ban

### Cấu Hình Quyền Phòng Ban
1. Tìm phòng ban mục tiêu trong danh sách phòng ban
2. Click nút "Quyền"
3. Chọn vai trò cần phân bổ
4. Cấu hình quyền chức năng cụ thể
5. Thiết lập phạm vi truy cập dữ liệu
6. Lưu cấu hình quyền

### Quản Lý Thành Viên Phòng Ban
1. Click nút "Thành viên" của phòng ban
2. Xem danh sách thành viên phòng ban hiện tại
3. Thêm thành viên mới hoặc loại bỏ thành viên hiện có
4. Phân vai trò cụ thể cho thành viên
5. Xác nhận cài đặt quyền thành viên

### Xem Chi Tiết Phòng Ban
1. Click nút "Chi tiết" của phòng ban
2. Xem thông tin đầy đủ của phòng ban
3. Xem cấu hình quyền của phòng ban
4. Xem danh sách thành viên phòng ban
5. Xem thống kê dữ liệu nghiệp vụ của phòng ban

## ⚠️ Lưu Ý

### Quản Lý Quyền
- Trước khi xóa phòng ban，vui lòng đảm bảo đã xử lý đầy đủ tất cả thành viên trong phòng ban
- Khi sửa quyền phòng ban，sẽ ảnh hưởng đến quyền của tất cả thành viên trong phòng ban
- Khuyến nghị định kỳ rà soát cấu hình quyền phòng ban，đảm bảo phù hợp với nhu cầu nghiệp vụ

### Bảo Mật Dữ Liệu
- Quyền truy cập dữ liệu nhạy cảm nên được kiểm soát chặt chẽ
- Định kỳ kiểm tra quyền người dùng，kịp thời thu hồi quyền không cần thiết
- Thao tác quan trọng khuyến nghị bật quy trình phê duyệt

### Thực Hành Tốt Nhất
- Phân chia phòng ban hợp lý theo chức năng nghiệp vụ
- Tuân theo nguyên tắc quyền tối thiểu，chỉ phân bổ quyền cần thiết
- Xây dựng mối quan hệ phân cấp phòng ban rõ ràng
- Định kỳ đào tạo người dùng sử dụng đúng chức năng quyền

## 🆘 Câu Hỏi Thường Gặp

### Q: Làm thế nào để tìm nhanh phòng ban cụ thể？
A: Sử dụng chức năng tìm kiếm，nhập tên phòng ban hoặc mã để định vị nhanh.

### Q: Sau khi sửa quyền phòng ban bao lâu thì có hiệu lực？
A: Sau khi sửa quyền có hiệu lực ngay，người dùng lần sau đăng nhập hoặc làm mới trang sẽ thấy quyền mới.

### Q: Làm thế nào để quản lý quyền hàng loạt nhiều phòng ban？
A: Có thể cấu hình quyền thống nhất thông qua phòng ban cấp trên，phòng ban cấp dưới sẽ tự động kế thừa.

### Q: Xóa nhầm phòng ban phải làm sao？
A: Vui lòng liên hệ quản trị viên hệ thống để khôi phục dữ liệu，khuyến nghị backup trước khi xóa.

---

💡 **Gợi ý**：Nếu cần thêm trợ giúp，vui lòng liên hệ quản trị viên hệ thống hoặc xem sổ tay người dùng chi tiết.
