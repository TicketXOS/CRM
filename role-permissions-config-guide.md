# Hướng Dẫn Cấu Hình Quyền Vai Trò

## Tổng Quan

Hệ thống này sử dụng kiểm soát truy cập dựa trên vai trò（RBAC），quản lý quyền người dùng thông qua vai trò. Hệ thống có sẵn 5 loại vai trò，mỗi vai trò có phạm vi quyền khác nhau.

## Hệ Thống Vai Trò

### 1. Siêu Quản Trị Viên（super_admin）
**Phạm vi quyền**：Tất cả quyền（`*`）

**Trách nhiệm**：
- Người quản lý quyền cao nhất của hệ thống
- Quản lý tất cả người dùng và vai trò
- Cấu hình cài đặt hệ thống
- Xem và quản lý tất cả dữ liệu

---

### 2. Quản Trị Viên（admin）
**Phạm vi quyền**：Tất cả quyền（`*`）

**Trách nhiệm**：
- Quyền giống siêu quản trị viên
- Công việc quản lý hệ thống hàng ngày
- Quản lý người dùng và dữ liệu

---

### 3. Trưởng Phòng Ban（department_manager）

#### Quyền Menu Cấp Một

| Menu cấp một | Mã quyền | Có quyền không |
|---------|---------|:---:|
| Dashboard dữ liệu | dashboard | ✅ |
| Quản lý khách hàng | customer | ✅ |
| Quản lý đơn hàng | order | ✅ |
| Quản lý dịch vụ | service | ✅ |
| Thống kê thành tích | performance | ✅ |
| Quản lý logistics | logistics | ✅ |
| Quản lý dịch vụ sau bán hàng | aftersale | ✅ |
| Quản lý tài liệu | data | ✅ |
| Quản lý sản phẩm | product | ❌ |
| Quản lý hệ thống | system | ❌ |

#### Quyền Menu Cấp Hai

| Menu cấp một | Menu cấp hai | Mã quyền | Có quyền không |
|---------|---------|---------|:---:|
| Dashboard dữ liệu | Dashboard dữ liệu | dashboard | ✅ |
| Quản lý khách hàng | Danh sách khách hàng | customer:list | ✅ |
| Quản lý khách hàng | Thêm khách hàng | customer:add | ✅ |
| Quản lý khách hàng | Nhóm khách hàng | customer:groups | ❌ |
| Quản lý khách hàng | Nhãn khách hàng | customer:tags | ❌ |
| Quản lý đơn hàng | Danh sách đơn hàng | order:list | ✅ |
| Quản lý đơn hàng | Thêm đơn hàng | order:add | ✅ |
| Quản lý đơn hàng | Phê duyệt đơn hàng | order:audit | ❌ |
| Quản lý dịch vụ | Quản lý cuộc gọi | service:call | ✅ |
| Quản lý dịch vụ | Quản lý SMS | service:sms | ❌ |
| Thống kê thành tích | Thành tích cá nhân | performance:personal | ✅ |
| Thống kê thành tích | Thành tích team | performance:team | ✅ |
| Thống kê thành tích | Phân tích thành tích | performance:analysis | ✅ |
| Thống kê thành tích | Chia sẻ thành tích | performance:share | ✅ |
| Quản lý logistics | Danh sách logistics | logistics:list | ✅ |
| Quản lý logistics | Theo dõi logistics | logistics:tracking | ✅ |
| Quản lý logistics | Danh sách gửi hàng | logistics:shipping | ❌ |
| Quản lý logistics | Cập nhật trạng thái | logistics:status | ❌ |
| Quản lý dịch vụ sau bán hàng | Danh sách dịch vụ sau bán hàng | aftersale:order | ✅ |
| Quản lý dịch vụ sau bán hàng | Tạo dịch vụ sau bán hàng mới | aftersale:add | ✅ |
| Quản lý dịch vụ sau bán hàng | Dữ liệu dịch vụ sau bán hàng | aftersale:analysis | ✅ |
| Quản lý tài liệu | Danh sách tài liệu | data:list | ❌ |
| Quản lý tài liệu | Tìm kiếm khách hàng | data:customer | ✅ |
| Quản lý tài liệu | Thùng rác | data:recycle | ❌ |

#### Quyền Nút Chức Năng

| Module chức năng | Chức năng nút | Mã quyền | Có quyền không |
|---------|---------|---------|:---:|
| Quản lý khách hàng | Xem khách hàng | customer:view:department | ✅ |
| Quản lý khách hàng | Sửa khách hàng | customer:edit | ✅ |
| Quản lý khách hàng | Import khách hàng | customer:import | ✅ |
| Quản lý khách hàng | Export khách hàng | customer:export | ✅ |
| Quản lý đơn hàng | Xem đơn hàng | order:view:department | ✅ |
| Quản lý đơn hàng | Sửa đơn hàng | order:edit | ✅ |
| Quản lý logistics | Xem logistics | logistics:view | ✅ |
| Quản lý logistics | Thêm logistics | logistics:add | ✅ |
| Quản lý logistics | Sửa logistics | logistics:edit | ✅ |
| Quản lý dịch vụ sau bán hàng | Xem dịch vụ sau bán hàng | aftersale:view:department | ✅ |
| Quản lý dịch vụ sau bán hàng | Sửa dịch vụ sau bán hàng | aftersale:edit | ✅ |

**Quyền dữ liệu**：Xem tất cả dữ liệu phòng ban

---

### 4. Nhân Viên Bán Hàng（sales_staff）

#### Quyền Menu Cấp Một

| Menu cấp một | Mã quyền | Có quyền không |
|---------|---------|:---:|
| Dashboard dữ liệu | dashboard | ✅ |
| Quản lý khách hàng | customer | ✅ |
| Quản lý đơn hàng | order | ✅ |
| Quản lý dịch vụ | service | ✅ |
| Thống kê thành tích | performance | ✅ |
| Quản lý logistics | logistics | ✅ |
| Quản lý dịch vụ sau bán hàng | aftersale | ✅ |
| Quản lý tài liệu | data | ✅ |
| Quản lý sản phẩm | product | ❌ |
| Quản lý hệ thống | system | ❌ |

#### Quyền Menu Cấp Hai

| Menu cấp một | Menu cấp hai | Mã quyền | Có quyền không |
|---------|---------|---------|:---:|
| Dashboard dữ liệu | Dashboard dữ liệu | dashboard | ✅ |
| Quản lý khách hàng | Danh sách khách hàng | customer:list | ✅ |
| Quản lý khách hàng | Thêm khách hàng | customer:add | ✅ |
| Quản lý khách hàng | Nhóm khách hàng | customer:groups | ❌ |
| Quản lý khách hàng | Nhãn khách hàng | customer:tags | ❌ |
| Quản lý đơn hàng | Danh sách đơn hàng | order:list | ✅ |
| Quản lý đơn hàng | Thêm đơn hàng | order:add | ✅ |
| Quản lý đơn hàng | Phê duyệt đơn hàng | order:audit | ❌ |
| Quản lý dịch vụ | Quản lý cuộc gọi | service:call | ✅ |
| Quản lý dịch vụ | Quản lý SMS | service:sms | ❌ |
| Thống kê thành tích | Thành tích cá nhân | performance:personal | ✅ |
| Thống kê thành tích | Thành tích team | performance:team | ✅ |
| Thống kê thành tích | Phân tích thành tích | performance:analysis | ❌ |
| Thống kê thành tích | Chia sẻ thành tích | performance:share | ❌ |
| Quản lý logistics | Danh sách logistics | logistics:list | ✅ |
| Quản lý logistics | Theo dõi logistics | logistics:tracking | ✅ |
| Quản lý logistics | Danh sách gửi hàng | logistics:shipping | ❌ |
| Quản lý logistics | Cập nhật trạng thái | logistics:status | ❌ |
| Quản lý dịch vụ sau bán hàng | Danh sách dịch vụ sau bán hàng | aftersale:order | ✅ |
| Quản lý dịch vụ sau bán hàng | Tạo dịch vụ sau bán hàng mới | aftersale:add | ✅ |
| Quản lý dịch vụ sau bán hàng | Dữ liệu dịch vụ sau bán hàng | aftersale:analysis | ❌ |
| Quản lý tài liệu | Danh sách tài liệu | data:list | ❌ |
| Quản lý tài liệu | Tìm kiếm khách hàng | data:customer | ✅ |
| Quản lý tài liệu | Thùng rác | data:recycle | ❌ |

#### Quyền Nút Chức Năng

| Module chức năng | Chức năng nút | Mã quyền | Có quyền không |
|---------|---------|---------|:---:|
| Quản lý khách hàng | Xem khách hàng | customer:view:personal | ✅ |
| Quản lý khách hàng | Sửa khách hàng | customer:edit | ❌ |
| Quản lý khách hàng | Import khách hàng | customer:import | ❌ |
| Quản lý khách hàng | Export khách hàng | customer:export | ❌ |
| Quản lý đơn hàng | Xem đơn hàng | order:view:personal | ✅ |
| Quản lý đơn hàng | Sửa đơn hàng | order:edit | ✅ |
| Quản lý logistics | Xem logistics | logistics:view | ✅ |
| Quản lý cuộc gọi | Xem cuộc gọi | service:call:view | ✅ |
| Quản lý cuộc gọi | Thêm cuộc gọi | service:call:add | ✅ |
| Quản lý cuộc gọi | Sửa cuộc gọi | service:call:edit | ✅ |
| Quản lý dịch vụ sau bán hàng | Xem dịch vụ sau bán hàng | aftersale:view:personal | ✅ |

**Quyền dữ liệu**：Chỉ xem dữ liệu của mình

---

### 5. Dịch Vụ Khách Hàng（customer_service）

#### Quyền Menu Cấp Một

| Menu cấp một | Mã quyền | Có quyền không |
|---------|---------|:---:|
| Dashboard dữ liệu | dashboard | ✅ |
| Quản lý khách hàng | customer | ❌ |
| Quản lý đơn hàng | order | ✅ |
| Quản lý dịch vụ | service | ❌ |
| Thống kê thành tích | performance | ❌ |
| Quản lý logistics | logistics | ✅ |
| Quản lý dịch vụ sau bán hàng | aftersale | ✅ |
| Quản lý tài liệu | data | ✅ |
| Quản lý sản phẩm | product | ❌ |
| Quản lý hệ thống | system | ❌ |

#### Quyền Menu Cấp Hai

| Menu cấp một | Menu cấp hai | Mã quyền | Có quyền không |
|---------|---------|---------|:---:|
| Dashboard dữ liệu | Dashboard dữ liệu | dashboard | ✅ |
| Quản lý đơn hàng | Danh sách đơn hàng | order:list | ❌ |
| Quản lý đơn hàng | Thêm đơn hàng | order:add | ❌ |
| Quản lý đơn hàng | Phê duyệt đơn hàng | order:audit | ✅ |
| Quản lý logistics | Danh sách logistics | logistics:list | ✅ |
| Quản lý logistics | Theo dõi logistics | logistics:tracking | ✅ |
| Quản lý logistics | Danh sách gửi hàng | logistics:shipping | ✅ |
| Quản lý logistics | Cập nhật trạng thái | logistics:status | ✅ |
| Quản lý dịch vụ sau bán hàng | Danh sách dịch vụ sau bán hàng | aftersale:order | ✅ |
| Quản lý dịch vụ sau bán hàng | Tạo dịch vụ sau bán hàng mới | aftersale:add | ✅ |
| Quản lý dịch vụ sau bán hàng | Dữ liệu dịch vụ sau bán hàng | aftersale:analysis | ✅ |
| Quản lý tài liệu | Danh sách tài liệu | data:list | ✅ |
| Quản lý tài liệu | Tìm kiếm khách hàng | data:customer | ✅ |
| Quản lý tài liệu | Thùng rác | data:recycle | ❌ |

#### Quyền Nút Chức Năng

| Module chức năng | Chức năng nút | Mã quyền | Có quyền không |
|---------|---------|---------|:---:|
| Quản lý đơn hàng | Phê duyệt đơn hàng | order:audit:view | ✅ |
| Quản lý logistics | Xem logistics | logistics:list:view | ✅ |
| Quản lý logistics | Thao tác gửi hàng | logistics:shipping:view | ✅ |
| Quản lý logistics | Cập nhật trạng thái | logistics:status_update | ✅ |
| Quản lý dịch vụ sau bán hàng | Xem dịch vụ sau bán hàng | aftersale:order:view | ✅ |

**Quyền dữ liệu**：Xem dữ liệu đơn hàng、logistics、dịch vụ sau bán hàng toàn công ty

---

## File Cấu Hình Quyền

### Vị Trí Cấu Hình Source Code
`src/config/defaultRolePermissions.ts`

### Điều Chỉnh Động
Siêu quản trị viên/Quản trị viên có thể điều chỉnh quyền động trong "Quản lý hệ thống → Quyền vai trò"：
1. Chọn vai trò cần cấu hình
2. Click nút "Cài đặt quyền"
3. Trong cây quyền tick hoặc bỏ tick quyền
4. Click "Lưu quyền"
5. Người dùng làm mới trang sau quyền có hiệu lực ngay

**Lưu ý**：Quyền cấu hình động sẽ lưu vào `localStorage` trong `crm_roles`，ưu tiên cao hơn cấu hình mặc định.

---

## Danh Sách Mã Quyền

### Dashboard Dữ Liệu
```
dashboard                    # Module dashboard dữ liệu
dashboard:personal          # Dữ liệu cá nhân
dashboard:department        # Dữ liệu phòng ban
```

### Quản Lý Khách Hàng
```
customer                    # Module quản lý khách hàng
customer:list              # Danh sách khách hàng
customer:view:personal     # Xem khách hàng cá nhân
customer:view:department   # Xem khách hàng phòng ban
customer:add               # Thêm khách hàng
customer:edit              # Sửa khách hàng
customer:import            # Import khách hàng
customer:export            # Export khách hàng
customer:groups            # Nhóm khách hàng
customer:tags              # Nhãn khách hàng
```

### Quản Lý Đơn Hàng
```
order                      # Module quản lý đơn hàng
order:list                # Danh sách đơn hàng
order:view:personal       # Xem đơn hàng cá nhân
order:view:department     # Xem đơn hàng phòng ban
order:add                 # Thêm đơn hàng
order:edit                # Sửa đơn hàng
order:audit               # Phê duyệt đơn hàng
order:audit:view          # Xem phê duyệt
```

### Quản Lý Dịch Vụ
```
service                   # Module quản lý dịch vụ
service:call             # Quản lý cuộc gọi
service:call:view        # Xem lịch sử cuộc gọi
service:call:add         # Thêm cuộc gọi
service:call:edit        # Sửa cuộc gọi
service:sms              # Quản lý SMS
```

### Thống Kê Thành Tích
```
performance                # Module thống kê thành tích
performance:personal       # Thành tích cá nhân
performance:personal:view  # Xem thành tích cá nhân
performance:team          # Thành tích team
performance:team:view     # Xem thành tích team
performance:analysis      # Phân tích thành tích
performance:share         # Chia sẻ thành tích
```

### Quản Lý Logistics
```
logistics                  # Module quản lý logistics
logistics:list            # Danh sách logistics
logistics:list:view       # Xem danh sách logistics
logistics:view            # Xem logistics
logistics:add             # Thêm logistics
logistics:edit            # Sửa logistics
logistics:tracking        # Theo dõi logistics
logistics:tracking:view   # Xem theo dõi logistics
logistics:shipping        # Danh sách gửi hàng（Dành riêng cho dịch vụ khách hàng）
logistics:shipping:view   # Xem danh sách gửi hàng
logistics:status          # Cập nhật trạng thái（Dành riêng cho dịch vụ khách hàng）
logistics:status_update   # Cập nhật trạng thái
```

### Quản Lý Dịch Vụ Sau Bán Hàng
```
aftersale                 # Module quản lý dịch vụ sau bán hàng
aftersale:order          # Danh sách dịch vụ sau bán hàng
aftersale:order:view     # Xem danh sách dịch vụ sau bán hàng
aftersale:view:personal  # Xem dịch vụ sau bán hàng cá nhân
aftersale:view:department # Xem dịch vụ sau bán hàng phòng ban
aftersale:add            # Thêm dịch vụ sau bán hàng
aftersale:edit           # Sửa dịch vụ sau bán hàng
aftersale:analysis       # Dữ liệu dịch vụ sau bán hàng
```

### Quản Lý Tài Liệu
```
data                      # Module quản lý tài liệu
data:list                # Danh sách tài liệu
data:customer            # Tìm kiếm khách hàng
data:customer:search     # Tìm kiếm khách hàng
data:recycle             # Thùng rác
```

### Quản Lý Hệ Thống
```
system                    # Module quản lý hệ thống（Chỉ quản trị viên）
system:user              # Quản lý người dùng
system:role              # Quản lý vai trò
system:department        # Quản lý phòng ban
system:settings          # Cài đặt hệ thống
```

---

## Cơ Chế Quyền Có Hiệu Lực

1. **Quyền mặc định**：Khi khởi động hệ thống load từ `src/config/defaultRolePermissions.ts`
2. **Quyền động**：Sau khi quản trị viên cấu hình trong trang "Quyền vai trò" lưu vào `crm_roles` trong `localStorage`
3. **Ưu tiên**：Cấu hình động > Cấu hình mặc định
4. **Thời điểm có hiệu lực**：Người dùng làm mới trang hoặc đăng nhập lại sau có hiệu lực ngay

---

## Changelog

- 2024-12-03：Sửa quyền thừa của nhân viên bán hàng（Nhóm khách hàng、Nhãn khách hàng、Danh sách gửi hàng、Cập nhật trạng thái、Dữ liệu dịch vụ sau bán hàng、Thùng rác、Quản lý SMS）
- 2024-12-03：Sửa quyền thiếu dashboard dữ liệu của dịch vụ khách hàng
- 2024-12-03：Sửa quyền thừa danh sách tài liệu của trưởng phòng ban
- 2024-12-03：Thực hiện chức năng cấu hình quyền động，quản trị viên có thể điều chỉnh quyền trong trang quyền vai trò
