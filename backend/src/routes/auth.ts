import { Router } from 'express';
import Joi from 'joi';
import { UserController } from '../controllers/UserController';
import { validate, commonValidations } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Quy tắc xác thực đăng nhập
const loginSchema = {
  body: Joi.object({
    username: commonValidations.username,
    password: Joi.string().min(1).max(128).required().messages({
      'string.base': 'Mật khẩu phải là chuỗi',
      'string.min': 'Mật khẩu không được để trống',
      'string.max': 'Mật khẩu tối đa 128 ký tự',
      'any.required': 'Mật khẩu là bắt buộc'
    })
  })
};

// Quy tắc xác thực làm mới mã thông báo
const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'string.base': 'Mã làm mới phải là chuỗi',
      'any.required': 'Mã làm mới là bắt buộc'
    })
  })
};

// Quy tắc xác thực đổi mật khẩu
const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.base': 'Mật khẩu hiện tại phải là chuỗi',
      'any.required': 'Mật khẩu hiện tại là bắt buộc'
    }),
    newPassword: commonValidations.password
  })
};

// Quy tắc xác thực cập nhật thông tin người dùng
const updateUserSchema = {
  body: Joi.object({
    realName: Joi.string().min(1).max(50).optional().messages({
      'string.base': 'Tên thật phải là chuỗi',
      'string.min': 'Tên thật không được để trống',
      'string.max': 'Tên thật tối đa 50 ký tự'
    }),
    email: commonValidations.optionalEmail,
    phone: commonValidations.phone.optional(),
    avatar: Joi.string().uri().max(200).optional().messages({
      'string.base': 'Ảnh đại diện phải là chuỗi',
      'string.uri': 'Ảnh đại diện phải là URL hợp lệ',
      'string.max': 'URL ảnh đại diện tối đa 200 ký tự'
    })
  })
};

/**
 * @route POST /api/v1/auth/login
 * @desc Đăng nhập người dùng
 * @access Public
 */
router.post('/login', validate(loginSchema), userController.login);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Làm mới mã truy cập
 * @access Public
 */
router.post('/refresh', validate(refreshTokenSchema), userController.refreshToken);

/**
 * @route GET /api/v1/auth/me
 * @desc Lấy thông tin người dùng hiện tại
 * @access Private
 */
router.get('/me', authenticateToken, userController.getCurrentUser);

/**
 * @route PUT /api/v1/auth/me
 * @desc Cập nhật thông tin người dùng hiện tại
 * @access Private
 */
router.put('/me', authenticateToken, validate(updateUserSchema), userController.updateCurrentUser);

/**
 * @route PUT /api/v1/auth/password
 * @desc Đổi mật khẩu
 * @access Private
 */
router.put('/password', authenticateToken, validate(changePasswordSchema), userController.changePassword);

/**
 * @route POST /api/v1/auth/logout
 * @desc Đăng xuất người dùng (phía khách hàng xử lý, phía máy chủ ghi log)
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  // Trong ứng dụng thực tế, ở đây có thể thêm mã thông báo vào danh sách đen
  // Hiện tại chỉ trả về phản hồi thành công, phía khách hàng chịu trách nhiệm xóa mã thông báo
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

export default router;
