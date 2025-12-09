import { Router, Request, Response } from 'express';
import { LogisticsController } from '../controllers/LogisticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const logisticsController = new LogisticsController();

// Áp dụng middleware xác thực
router.use(authenticateToken);

// Lấy danh sách logistics
router.get('/list', (req, res) => logisticsController.getLogisticsList(req, res));

// Lấy danh sách công ty vận chuyển được hỗ trợ
router.get('/companies', (req, res) => logisticsController.getSupportedCompanies(req, res));

// Tạo theo dõi logistics
router.post('/tracking', (req, res) => logisticsController.createLogisticsTracking(req, res));

// Truy vấn lịch sử vận chuyển
router.get('/trace', (req, res) => logisticsController.getLogisticsTrace(req, res));

// Đồng bộ hàng loạt trạng thái logistics
router.post('/batch-sync', (req, res) => logisticsController.batchSyncLogistics(req, res));

// Cập nhật trạng thái logistics
router.put('/tracking/:id', (req, res) => logisticsController.updateLogisticsStatus(req, res));

// Lấy quyền logistics của người dùng
router.get('/permission', (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Trả về thông tin quyền dựa trên vai trò người dùng
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const isManager = user?.role === 'manager' || user?.role === 'department_head';
    const isLogisticsStaff = user?.department === 'logistics';

    const permission = {
      canView: true,
      canUpdate: isAdmin || isManager || isLogisticsStaff,
      canBatchUpdate: isAdmin || isManager,
      canExport: isAdmin || isManager,
      role: user?.role || 'user',
      department: user?.department || ''
    };

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('Lấy quyền logistics thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy quyền logistics thất bại'
    });
  }
});

// Lấy danh sách đơn hàng cho trang cập nhật trạng thái logistics
router.get('/status-update/orders', async (req, res) => {
  try {
    const { tab: _tab = 'pending', page = 1, pageSize = 20, keyword: _keyword, status: _status, dateRange: _dateRange } = req.query;

    // Ở đây nên lấy dữ liệu đơn hàng từ cơ sở dữ liệu
    // Hiện tại trả về cấu trúc dữ liệu mô phỏng
    res.json({
      success: true,
      data: {
        list: [],
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('Lấy danh sách đơn hàng cập nhật trạng thái logistics thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách đơn hàng thất bại'
    });
  }
});

// Lấy dữ liệu tổng hợp cập nhật trạng thái logistics
router.get('/status-update/summary', async (_req, res) => {
  try {
    res.json({
      success: true,
      data: {
        pending: 0,
        updated: 0,
        todo: 0,
        total: 0
      }
    });
  } catch (error) {
    console.error('Lấy tổng hợp trạng thái logistics thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy dữ liệu tổng hợp thất bại'
    });
  }
});

// Lấy dữ liệu tổng hợp logistics
router.get('/summary', async (_req, res) => {
  try {
    res.json({
      success: true,
      data: {
        pending: 0,
        inTransit: 0,
        delivered: 0,
        exception: 0,
        total: 0
      }
    });
  } catch (error) {
    console.error('Lấy tổng hợp logistics thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy dữ liệu tổng hợp thất bại'
    });
  }
});

// Cập nhật trạng thái logistics đơn hàng
router.post('/order/status', async (req, res) => {
  try {
    const { orderNo, newStatus, remark } = req.body;

    // Ở đây nên cập nhật trạng thái logistics đơn hàng trong cơ sở dữ liệu
    console.log('Cập nhật trạng thái logistics đơn hàng:', { orderNo, newStatus, remark });

    res.json({
      success: true,
      message: 'Cập nhật trạng thái logistics thành công'
    });
  } catch (error) {
    console.error('Cập nhật trạng thái logistics đơn hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Cập nhật trạng thái logistics thất bại'
    });
  }
});

// Cập nhật hàng loạt trạng thái logistics đơn hàng
router.post('/order/batch-status', async (req, res) => {
  try {
    const { orderNos, newStatus, remark } = req.body;

    console.log('Cập nhật hàng loạt trạng thái logistics đơn hàng:', { orderNos, newStatus, remark });

    res.json({
      success: true,
      message: 'Cập nhật hàng loạt thành công',
      data: {
        successCount: orderNos?.length || 0,
        failCount: 0
      }
    });
  } catch (error) {
    console.error('Cập nhật hàng loạt trạng thái logistics đơn hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Cập nhật hàng loạt thất bại'
    });
  }
});

// Thiết lập đơn hàng cần làm
router.post('/order/todo', async (req, res) => {
  try {
    const { orderNo, days, remark } = req.body;

    console.log('Thiết lập đơn hàng cần làm:', { orderNo, days, remark });

    res.json({
      success: true,
      message: 'Thiết lập cần làm thành công'
    });
  } catch (error) {
    console.error('Thiết lập đơn hàng cần làm thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Thiết lập cần làm thất bại'
    });
  }
});

// Lấy nhật ký trạng thái logistics
router.get('/log', async (req, res) => {
  try {
    const { orderNo: _orderNo, page = 1, pageSize = 20 } = req.query;

    res.json({
      success: true,
      data: {
        list: [],
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('Lấy nhật ký logistics thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy nhật ký thất bại'
    });
  }
});

// Xuất dữ liệu trạng thái logistics
router.get('/export', async (_req, res) => {
  try {
    res.json({
      success: true,
      data: {
        url: '',
        filename: 'logistics_export.xlsx'
      }
    });
  } catch (error) {
    console.error('Xuất dữ liệu logistics thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Xuất dữ liệu thất bại'
    });
  }
});

export default router;
