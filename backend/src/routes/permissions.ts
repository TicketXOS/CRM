import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const permissionController = new PermissionController();

// Tất cả các route đều cần xác thực
router.use(authenticateToken);

// Lấy cây quyền hạn
router.get('/tree', (req, res) => permissionController.getPermissionTree(req, res));

// Lấy danh sách quyền hạn
router.get('/', (req, res) => permissionController.getPermissions(req, res));

// Tạo quyền hạn
router.post('/', (req, res) => permissionController.createPermission(req, res));

// Cập nhật quyền hạn
router.put('/:id', (req, res) => permissionController.updatePermission(req, res));

// Xóa quyền hạn
router.delete('/:id', (req, res) => permissionController.deletePermission(req, res));

export default router;
