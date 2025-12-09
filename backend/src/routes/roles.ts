import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const roleController = new RoleController();

// Lấy danh sách vai trò - sử dụng xác thực tùy chọn
router.get('/', optionalAuth, (req, res) => roleController.getRoles(req, res));

// Lấy thống kê vai trò - sử dụng xác thực tùy chọn
router.get('/stats', optionalAuth, (req, res) => roleController.getRoleStats(req, res));

// Lấy quyền hạn vai trò - sử dụng xác thực tùy chọn
router.get('/:id/permissions', optionalAuth, (req, res) => roleController.getRolePermissions(req, res));

// Lấy một vai trò - sử dụng xác thực tùy chọn
router.get('/:id', optionalAuth, (req, res) => roleController.getRoleById(req, res));

// Các thao tác sau đây cần xác thực
router.use(authenticateToken);

// Tạo vai trò
router.post('/', (req, res) => roleController.createRole(req, res));

// Cập nhật vai trò
router.put('/:id', (req, res) => roleController.updateRole(req, res));

// Xóa vai trò
router.delete('/:id', (req, res) => roleController.deleteRole(req, res));

export default router;
