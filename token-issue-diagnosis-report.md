# Báo Cáo Chẩn Đoán Vấn Đề TOKEN

## Mô Tả Vấn Đề
Người dùng đăng nhập sau đó báo lỗi "không tìm thấy TOKEN"，dẫn đến không thể sử dụng hệ thống bình thường.

## Phân Tích Luồng Dữ Liệu

### 1. Format Phản Hồi Backend
```typescript
// backend/src/controllers/userController.ts (dòng 140-148)
res.json({
  success: true,
  message: 'Đăng nhập thành công',
  data: {
    user: userInfo,
    tokens: {
      accessToken: "jwt-token-string",
      refreshToken: "jwt-refresh-token-string"
    }
  }
});
```

### 2. Xử Lý apiService
```typescript
// src/services/apiService.ts (dòng 235-238)
async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config)
  return response.data.data as T  // Trả về data.data
}
```

**Điểm quan trọng：** `apiService.post()` trả về `response.data.data`，tức là nội dung trường `data` trong phản hồi backend.

### 3. authApiService Trả Về
```typescript
// src/services/authApiService.ts
async login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await this.api.post<LoginResponse>('/auth/login', credentials)
  // response chính là { user: {...}, tokens: {...} }
  return response
}
```

**Điểm quan trọng：** `authApiService.login()` trả về trực tiếp kết quả của `apiService.post()`，tức là：
```json
{
  "user": {...},
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 4. Trích Xuất Token Trong user.ts
```typescript
// src/stores/user.ts (dòng 508)
const accessToken = response.tokens?.accessToken || response.tokens?.access_token
```

**Điểm quan trọng：** Code đã trích xuất token đúng từ `response.tokens.accessToken`.

## Điểm Có Thể Có Vấn Đề

### Vấn Đề 1：Chế Độ Mock API
Nếu hệ thống chạy trong chế độ Mock API，logic đăng nhập Mock trong `authApiService.ts` có thể trả về format khác.

**Điểm kiểm tra：**
```typescript
// src/services/authApiService.ts (bắt đầu từ dòng 70)
if (shouldUseMockApi()) {
  // Logic đăng nhập chế độ Mock
  const loginResponse: LoginResponse = {
    user: completeUserInfo,
    tokens: {
      accessToken: `mock-token-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`
    },
    expiresIn: 3600
  }
  return loginResponse  // ✅ Trả về trực tiếp đối tượng LoginResponse
}
```

### Vấn Đề 2：Gọi API Thật
```typescript
// src/services/authApiService.ts (bắt đầu từ dòng 280)
// Gọi API thật
const response = await this.api.post<LoginResponse>('/auth/login', credentials)
// response nên là { user: {...}, tokens: {...} }
return response
```

## Xác Minh Sửa Chữa

### Trạng Thái Code Hiện Tại
✅ `apiService.post()` trả về đúng `response.data.data`
✅ `authApiService.login()` trả về trực tiếp đối tượng đó
✅ `user.ts` trích xuất token đúng từ `response.tokens.accessToken`
✅ Có xử lý tương thích：`accessToken || access_token`

### Gợi Ý Debug Thêm
Thêm log chi tiết hơn trong method `loginWithApi` của `src/stores/user.ts`：

```typescript
console.log('[Auth] === Cấu trúc phản hồi đầy đủ ===')
console.log('[Auth] response keys:', Object.keys(response))
console.log('[Auth] response.tokens keys:', response.tokens ? Object.keys(response.tokens) : 'undefined')
console.log('[Auth] response.tokens.accessToken:', response.tokens?.accessToken)
console.log('[Auth] response.tokens.access_token:', response.tokens?.access_token)
```

## Kết Luận

Từ phân tích code，sửa chữa hiện tại nên là đúng. Nếu vấn đề vẫn tồn tại，nguyên nhân có thể là：

1. **Vấn đề cache**：Trình duyệt cache code phiên bản cũ
   - Giải pháp：Xóa cache trình duyệt，làm mới cưỡng bức（Ctrl+Shift+R）

2. **Vấn đề build**：File trong thư mục dist chưa được cập nhật
   - Giải pháp：Xóa thư mục dist，build lại

3. **Vấn đề biến môi trường**：Cấu hình API_BASE_URL sai
   - Giải pháp：Kiểm tra file `.env.production`

4. **Format phản hồi backend thay đổi**：Format backend thực tế trả về không khớp với dự kiến
   - Giải pháp：Xem phản hồi API thực tế trong tab Network của Developer Tools trình duyệt

## Hành Động Tiếp Theo

1. Xóa cache trình duyệt và làm mới cưỡng bức
2. Kiểm tra log đầy đủ trong console trình duyệt
3. Kiểm tra phản hồi thực tế của interface `/auth/login` trong tab Network
4. Nếu vấn đề vẫn tồn tại，cung cấp log console đầy đủ và ảnh chụp màn hình phản hồi Network
