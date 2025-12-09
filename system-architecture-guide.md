# Hướng Dẫn Kiến Trúc Hệ Thống

## Tổng Quan Dự Án

Đây là hệ thống quản lý quan hệ khách hàng CRM hiện đại dựa trên Vue 3 + TypeScript + Element Plus，sử dụng kiến trúc tách biệt frontend và backend.

## Công Nghệ Sử Dụng

### Công Nghệ Frontend
- **Framework**: Vue 3.4+ (Composition API)
- **Ngôn ngữ**: TypeScript 5.0+
- **Công cụ build**: Vite 5.0+
- **UI Framework**: Element Plus 2.5+
- **Quản lý trạng thái**: Pinia 2.1+
- **Routing**: Vue Router 4.2+
- **HTTP Client**: Axios 1.6+
- **Biểu đồ**: ECharts 5.4+
- **Trình soạn thảo văn bản phong phú**: Quill 2.0+

### Công Nghệ Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18+
- **Ngôn ngữ**: TypeScript
- **Database**: MySQL 8.0+
- **ORM**: TypeORM 0.3+
- **Quản lý process**: PM2

### Công Cụ Phát Triển
- **Quy tắc code**: ESLint + Prettier
- **Git hooks**: Husky
- **Package manager**: npm / pnpm

---

## Cấu Trúc Dự Án

```
CRM/
├── backend/                 # Backend service
│   ├── src/
│   │   ├── app.ts          # Entry point ứng dụng
│   │   ├── config/         # File cấu hình
│   │   ├── controllers/    # Controllers
│   │   ├── routes/         # Routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tsconfig.json
│
├── src/                     # Frontend source code
│   ├── api/                # API interfaces
│   ├── assets/             # Static resources
│   ├── components/         # Public components
│   ├── config/             # Configuration files
│   ├── router/             # Route configuration
│   ├── stores/             # Pinia state management
│   ├── utils/              # Utility functions
│   ├── views/              # Page components
│   ├── App.vue             # Root component
│   └── main.ts             # Application entry
│
├── public/                  # Public resources
├── database/               # Database scripts
├── dist/                   # Build output
├── node_modules/           # Dependencies
│
├── index.html              # HTML template
├── package.json            # Project configuration
├── tsconfig.json           # TS configuration
├── vite.config.ts          # Vite configuration
├── .env                    # Environment variables
├── .env.development        # Development environment variables
├── .env.production         # Production environment variables
└── README.md               # Project documentation
```

---

## Module Core

### 1. Module Xác Thực Người Dùng
**Vị trí**: `src/stores/user.ts`, `src/services/authApiService.ts`

**Chức năng**:
- Đăng nhập/Đăng xuất người dùng
- Quản lý Token
- Xác thực quyền
- Quản lý thông tin người dùng

**Đặc điểm**:
- Hỗ trợ tài khoản mặc định（cấu hình trong source code）
- Hỗ trợ tạo người dùng động
- Xác thực JWT Token
- Xác thực quyền real-time

---

### 2. Module Quản Lý Quyền
**Vị trí**: `src/config/defaultRolePermissions.ts`, `src/stores/user.ts`

**Chức năng**:
- Kiểm soát truy cập dựa trên vai trò（RBAC）
- Cấu hình quyền động
- Kiểm soát quyền menu
- Kiểm soát quyền nút
- Kiểm soát quyền dữ liệu

**Cách kiểm tra quyền**:
```typescript
// 1. Kiểm tra quyền trong component
const userStore = useUserStore()
const hasPermission = userStore.hasPermission('customer.add')

// 2. Sử dụng directive kiểm soát nút
<el-button v-permission="'customer.add'">Thêm</el-button>

// 3. Route guard tự động kiểm tra
router.beforeEach((to, from, next) => {
  // Tự động kiểm tra quyền route
})
```

---

### 3. Module Lưu Trữ Dữ Liệu
**Vị trí**: `src/utils/storage.ts`, `src/utils/env.ts`

**Chiến lược lưu trữ**:
- **Môi trường phát triển**: localStorage（Frontend mô phỏng）
- **Môi trường production**: MySQL database（Backend API）

**Tự động chuyển đổi**:
```typescript
// Hệ thống tự động phát hiện môi trường và chuyển đổi cách lưu trữ
const isProduction = import.meta.env.VITE_USE_REAL_API === 'true'

if (isProduction) {
  // Sử dụng backend API
  await axios.post('/api/customers', data)
} else {
  // Sử dụng localStorage
  localStorage.setItem('crm_customers', JSON.stringify(data))
}
```

**Quy tắc tên khóa dữ liệu**:
```
crm_mock_users          # Dữ liệu người dùng
crm_mock_customers      # Dữ liệu khách hàng
crm_mock_orders         # Dữ liệu đơn hàng
crm_mock_departments    # Dữ liệu phòng ban
crm_mock_roles          # Dữ liệu vai trò
crm_performance_shares  # Dữ liệu chia sẻ thành tích
crm_logistics_status    # Dữ liệu trạng thái logistics
```

---

### 4. Module Quản Lý Khách Hàng
**Vị trí**: `src/views/Customer/`, `src/api/customerDetail.ts`

**Chức năng**:
- Danh sách khách hàng（Phân trang、Tìm kiếm、Lọc）
- Thêm/Sửa khách hàng
- Chi tiết khách hàng
- Quản lý nhãn khách hàng
- Quản lý nhóm khách hàng
- Quản lý cấp độ khách hàng
- Import/Export khách hàng
- Chia sẻ khách hàng

**Trường dữ liệu**:
```typescript
interface Customer {
  id: string
  name: string              // Tên khách hàng
  phone: string             // Số điện thoại liên hệ
  wechat: string           // WeChat ID
  address: string          // Địa chỉ
  level: string            // Cấp độ khách hàng
  tags: string[]           // Nhãn
  source: string           // Nguồn
  status: string           // Trạng thái
  salesPersonId: string    // ID nhân viên bán hàng
  createTime: string       // Thời gian tạo
  updateTime: string       // Thời gian cập nhật
}
```

---

### 5. Module Quản Lý Đơn Hàng
**Vị trí**: `src/views/Order/`, `src/stores/order.ts`

**Chức năng**:
- Danh sách đơn hàng（Lọc nhiều trạng thái）
- Thêm/Sửa đơn hàng
- Chi tiết đơn hàng
- Phê duyệt đơn hàng
- Export đơn hàng
- Cấu hình trường tùy chỉnh

**Luồng trạng thái đơn hàng**:
```
Chờ phê duyệt → Phê duyệt qua → Chờ gửi hàng → Đã gửi hàng → Đã nhận hàng → Hoàn thành
       ↓
     Phê duyệt không qua → Đã hủy
```

**Trường tùy chỉnh**:
Hệ thống hỗ trợ cấu hình động trường tùy chỉnh đơn hàng，cấu hình lưu trong `src/stores/orderFieldConfig.ts`.

---

### 6. Module Thống Kê Thành Tích
**Vị trí**: `src/views/Performance/`, `src/stores/performance.ts`

**Chức năng**:
- Thống kê thành tích cá nhân
- Thống kê thành tích team
- Phân tích thành tích（Biểu đồ）
- Cấu hình chia sẻ thành tích
- Xếp hạng thành tích

**Chiều thống kê**:
- Số lượng đơn hàng
- Số tiền đơn hàng
- Số lượng khách hàng
- Tỷ lệ giao dịch thành công
- Phạm vi thời gian（Ngày/Tuần/Tháng/Năm）

**Nguyên tắc bảo toàn thành tích**:
```
Tổng thành tích team = Σ(Thành tích cá nhân + Thành tích chia sẻ)
```

---

### 7. Module Quản Lý Logistics
**Vị trí**: `src/views/Logistics/`, `src/stores/logisticsStatus.ts`

**Chức năng**:
- Danh sách logistics
- Theo dõi logistics
- Danh sách gửi hàng
- Cập nhật trạng thái（Hàng loạt）
- Quản lý công ty logistics
- Tích hợp API SF Express/YTO Express

**Trạng thái logistics**:
```typescript
enum LogisticsStatus {
  PENDING = 'pending',           // Chờ gửi hàng
  SHIPPED = 'shipped',           // Đã gửi hàng
  IN_TRANSIT = 'in_transit',     // Đang vận chuyển
  DELIVERED = 'delivered',       // Đã nhận hàng
  REJECTED = 'rejected',         // Từ chối nhận
  RETURNED = 'returned'          // Trả lại
}
```

**Tích hợp API**:
- Nền tảng SF Express Fengqiao
- API YTO Express
- Theo dõi logistics tự động

---

### 8. Module Quản Lý Dịch Vụ Sau Bán Hàng
**Vị trí**: `src/views/Service/`, `src/utils/servicePermission.ts`

**Chức năng**:
- Danh sách dịch vụ sau bán hàng
- Thêm/Sửa dịch vụ sau bán hàng
- Chi tiết dịch vụ sau bán hàng
- Thống kê dữ liệu dịch vụ sau bán hàng
- Cấu hình loại dịch vụ
- Phân công dịch vụ sau bán hàng

**Loại dịch vụ**:
- Trả hàng hoàn tiền
- Đổi hàng
- Sửa chữa
- Tư vấn
- Khiếu nại

**Kiểm soát quyền**:
Dịch vụ khách hàng có quyền quản lý dịch vụ sau bán hàng đầy đủ，bao gồm tạo dịch vụ sau bán hàng mới và xem dữ liệu dịch vụ sau bán hàng.

---

### 9. Module Quản Lý Tài Liệu
**Vị trí**: `src/views/Data/`

**Chức năng**:
- Danh sách tài liệu
- Tìm kiếm tài liệu
- Chi tiết tài liệu
- Luân chuyển tài liệu（Tự động tạo khi đơn hàng được nhận）

**Nguồn dữ liệu**:
Sau khi đơn hàng được nhận tự động tạo bản ghi tài liệu，bao gồm thông tin khách hàng、thông tin đơn hàng、thông tin logistics.

---

### 10. Module Quản Lý Hệ Thống
**Vị trí**: `src/views/System/`

**Chức năng**:
- Quản lý người dùng
- Quản lý vai trò
- Quản lý phòng ban
- Cài đặt hệ thống
- Backup dữ liệu
- Di chuyển dữ liệu

**Chỉ quản trị viên mới có thể truy cập**.

---

## Luồng Dữ Liệu

### 1. Khách Hàng → Đơn Hàng → Logistics → Dịch Vụ Sau Bán Hàng → Tài Liệu

```
Thêm khách hàng → Tạo đơn hàng → Phê duyệt đơn hàng → Gửi hàng → Theo dõi logistics → Nhận hàng → Tự động tạo tài liệu
                                                    ↓
                                                 Dịch vụ sau bán hàng
```

### 2. Quy Trình Tính Thành Tích

```
Tạo đơn hàng → Phê duyệt đơn hàng qua → Tính vào thành tích → Chia sẻ thành tích → Tổng hợp thành tích team
```

### 3. Quy Trình Xác Thực Quyền

```
Người dùng đăng nhập → Lấy vai trò → Load quyền → Route guard → Render menu → Kiểm soát nút
```

---

## Quản Lý Trạng Thái

Sử dụng Pinia để quản lý trạng thái toàn cục：

### Store Chính

| Store | File | Chức năng |
|-------|------|------|
| userStore | `src/stores/user.ts` | Thông tin người dùng、Quyền |
| customerStore | `src/stores/customer.ts` | Dữ liệu khách hàng |
| orderStore | `src/stores/order.ts` | Dữ liệu đơn hàng |
| performanceStore | `src/stores/performance.ts` | Dữ liệu thành tích |
| departmentStore | `src/stores/department.ts` | Dữ liệu phòng ban |
| configStore | `src/stores/config.ts` | Cấu hình hệ thống |
| notificationStore | `src/stores/notification.ts` | Thông báo tin nhắn |

---

## Thiết Kế API

### Quy Tắc RESTful API

```
GET    /api/customers          # Lấy danh sách khách hàng
POST   /api/customers          # Tạo khách hàng
GET    /api/customers/:id      # Lấy chi tiết khách hàng
PUT    /api/customers/:id      # Cập nhật khách hàng
DELETE /api/customers/:id      # Xóa khách hàng
```

### Format Phản Hồi

```typescript
interface ApiResponse<T> {
  code: number        // Status code：200 thành công，khác là thất bại
  message: string     // Thông tin gợi ý
  data: T            // Dữ liệu trả về
}
```

---

## Cơ Chế Bảo Mật

### 1. Bảo Mật Xác Thực
- Xác thực JWT Token
- Token hết hạn tự động refresh
- Giới hạn số lần đăng nhập thất bại

### 2. Bảo Mật Quyền
- Route guard frontend
- Xác thực quyền interface backend
- Phân tách quyền dữ liệu

### 3. Bảo Mật Dữ Liệu
- Dữ liệu nhạy cảm mã hóa lưu trữ
- Số điện thoại hiển thị ẩn danh
- Ghi log thao tác

### 4. Bảo Vệ XSS
- Lọc nội dung input
- Cấu hình bảo mật trình soạn thảo văn bản phong phú
- Chính sách CSP

---

## Tối Ưu Hiệu Suất

### 1. Tối Ưu Frontend
- Lazy load route
- Component load theo nhu cầu
- Lazy load ảnh
- Virtual scroll（Danh sách dữ liệu lớn）
- Debounce throttle

### 2. Tối Ưu Dữ Liệu
- Load phân trang
- Cache dữ liệu
- Gộp request
- Nén phản hồi

### 3. Tối Ưu Build
- Code splitting
- Tree Shaking
- Nén tài nguyên
- CDN tăng tốc

---

## Kiến Trúc Triển Khai

### Môi Trường Phát Triển
```
Frontend: http://localhost:5173 (Vite Dev Server)
Backend: http://localhost:3000 (Express)
Dữ liệu: localStorage (Frontend mô phỏng)
```

### Môi Trường Production
```
Frontend: Nginx phục vụ file tĩnh
Backend: PM2 quản lý process
Dữ liệu: MySQL database
Reverse proxy: Nginx
```

---

## Thiết Kế Khả Năng Mở Rộng

### 1. Thiết Kế Module Hóa
Mỗi module chức năng độc lập，dễ mở rộng và bảo trì.

### 2. Cấu Hình Hóa
Quyền、Menu、Trường v.v. hỗ trợ quản lý cấu hình hóa.

### 3. Plugin Hóa
Hỗ trợ tích hợp dịch vụ bên thứ ba（Logistics、Thanh toán v.v.）.

### 4. Hỗ Trợ Multi-Tenant
Dự phòng kiến trúc multi-tenant，hỗ trợ phân tách dữ liệu.

---

## Quy Tắc Phát Triển

### 1. Quy Tắc Code
- Sử dụng ESLint + Prettier
- Tuân theo Vue 3 Style Guide
- TypeScript strict mode

### 2. Quy Tắc Đặt Tên
- Component: PascalCase
- File: kebab-case
- Biến: camelCase
- Hằng số: UPPER_SNAKE_CASE

### 3. Quy Tắc Comment
- Hàm phải có JSDoc comment
- Logic phức tạp phải có comment nội dòng
- Interface phải có type definition

### 4. Quy Tắc Git
- feat: Chức năng mới
- fix: Sửa lỗi
- docs: Tài liệu
- style: Format
- refactor: Refactor
- test: Test
- chore: Build

---

## Câu Hỏi Thường Gặp

### Q: Làm thế nào để thêm quyền mới？
A: Thêm mã quyền trong `src/config/defaultRolePermissions.ts`，sau đó thêm vào mảng `permissions` của vai trò tương ứng.

### Q: Làm thế nào để thêm menu mới？
A: Thêm route trong `src/router/index.ts`，và cấu hình quyền trong route meta.

### Q: Làm thế nào để chuyển đổi môi trường phát triển/production？
A: Sửa biến `VITE_USE_REAL_API` trong `.env.development` hoặc `.env.production`.

### Q: Làm thế nào để tích hợp dịch vụ bên thứ ba mới？
A: Tạo service class mới trong `backend/src/services/`，thêm route trong `backend/src/routes/`.
