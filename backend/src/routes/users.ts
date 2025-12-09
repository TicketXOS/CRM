import { Router } from 'express';
import Joi from 'joi';
import { UserController } from '../controllers/UserController';
import { validate, commonValidations } from '../middleware/validation';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Quy tắc xác thực lấy danh sách người dùng
const getUsersSchema = {
  query: Joi.object({
    ...commonValidations.pagination,
    search: Joi.string().max(100).optional().messages({
      'string.base': 'Từ khóa tìm kiếm phải là chuỗi',
      'string.max': 'Từ khóa tìm kiếm tối đa 100 ký tự'
    }),
    departmentId: commonValidations.optionalId,
    role: commonValidations.status(['admin', 'manager', 'sales', 'service']).optional(),
    status: commonValidations.status(['active', 'inactive', 'locked']).optional()
  })
};

// Quy tắc xác thực tạo người dùng
const createUserSchema = {
  body: Joi.object({
    username: commonValidations.username,
    password: commonValidations.password,
    realName: Joi.string().min(1).max(50).required().messages({
      'string.base': 'Tên thật phải là chuỗi',
      'string.min': 'Tên thật không được để trống',
      'string.max': 'Tên thật tối đa 50 ký tự',
      'any.required': 'Tên thật là bắt buộc'
    }),
    email: Joi.string().max(100).optional().allow('', null).messages({
      'string.base': 'Email phải là chuỗi',
      'string.max': 'Email tối đa 100 ký tự'
    }),
    phone: Joi.string().max(20).optional().allow('', null).messages({
      'string.base': 'Số điện thoại phải là chuỗi',
      'string.max': 'Số điện thoại tối đa 20 ký tự'
    }),
    role: Joi.string().max(50).required().messages({
      'string.base': 'Vai trò phải là chuỗi',
      'string.max': 'Vai trò tối đa 50 ký tự',
      'any.required': 'Vai trò là bắt buộc'
    }),
    roleId: Joi.string().max(50).optional(),
    departmentId: Joi.alternatives().try(
      Joi.string().max(100).allow('', null),
      Joi.number()
    ).optional(),
    department: Joi.string().max(100).optional().allow('', null),
    position: Joi.string().max(50).optional().allow('', null),
    employeeNumber: Joi.string().max(50).optional().allow('', null),
    status: Joi.string().max(20).optional(),
    employmentStatus: Joi.string().max(20).optional(),
    remark: Joi.string().max(500).optional().allow('', null),
    name: Joi.string().max(50).optional(),
    createTime: Joi.any().optional(),
    isOnline: Joi.boolean().optional(),
    lastLoginTime: Joi.any().optional().allow(null),
    loginCount: Joi.number().optional()
  })
};

/**
 * @route GET /api/v1/users
 * @desc Lấy danh sách người dùng
 * @access Private (Manager/Admin)
 */
router.get('/', authenticateToken, requireManagerOrAdmin, validate(getUsersSchema), userController.getUsers);

/**
 * @route POST /api/v1/users
 * @desc Tạo người dùng
 * @access Private (Manager/Admin)
 */
router.post('/', authenticateToken, requireManagerOrAdmin, validate(createUserSchema), userController.createUser);

/**
 * @route GET /api/v1/users/statistics
 * @desc Lấy thống kê người dùng
 * @access Private (Manager/Admin)
 */
router.get('/statistics', authenticateToken, requireManagerOrAdmin, userController.getUserStatistics);

/**
 * @route GET /api/v1/users/:id
 * @desc Lấy chi tiết người dùng
 * @access Private (Manager/Admin)
 */
router.get('/:id', authenticateToken, requireManagerOrAdmin, userController.getUserById);

/**
 * @route PUT /api/v1/users/:id
 * @desc Cập nhật thông tin người dùng
 * @access Private (Manager/Admin)
 */
router.put('/:id', authenticateToken, requireManagerOrAdmin, userController.updateUser);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Xóa người dùng
 * @access Private (Manager/Admin)
 */
router.delete('/:id', authenticateToken, requireManagerOrAdmin, userController.deleteUser);

/**
 * @route PATCH /api/v1/users/:id/status
 * @desc Cập nhật trạng thái người dùng (kích hoạt/vô hiệu hóa/khóa)
 * @access Private (Manager/Admin)
 */
router.patch('/:id/status', authenticateToken, requireManagerOrAdmin, userController.updateUserStatus);

/**
 * @route PATCH /api/v1/users/:id/employment-status
 * @desc Cập nhật trạng thái làm việc của người dùng
 * @access Private (Manager/Admin)
 */
router.patch('/:id/employment-status', authenticateToken, requireManagerOrAdmin, userController.updateEmploymentStatus);

/**
 * @route POST /api/v1/users/:id/reset-password
 * @desc Đặt lại mật khẩu người dùng
 * @access Private (Manager/Admin)
 */
router.post('/:id/reset-password', authenticateToken, requireManagerOrAdmin, userController.resetUserPassword);

export default router;
