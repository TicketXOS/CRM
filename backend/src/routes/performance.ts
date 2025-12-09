import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticateToken);

/**
 * @route GET /api/v1/performance/shares
 * @desc Lấy danh sách chia sẻ thành tích
 */
router.get('/shares', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, userId, orderId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sql = `SELECT ps.*,
               (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                 'id', psm.id, 'userId', psm.user_id, 'userName', psm.user_name,
                 'department', psm.department, 'percentage', psm.share_percentage,
                 'shareAmount', psm.share_amount, 'status', psm.status
               )) FROM performance_share_members psm WHERE psm.share_id = ps.id) as shareMembers
               FROM performance_shares ps WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      sql += ` AND ps.status = ?`;
      params.push(status);
    }

    if (orderId) {
      sql += ` AND ps.order_id = ?`;
      params.push(orderId);
    }

    if (userId) {
      sql += ` AND (ps.created_by = ? OR EXISTS (SELECT 1 FROM performance_share_members psm WHERE psm.share_id = ps.id AND psm.user_id = ?))`;
      params.push(userId, userId);
    }

    sql += ` ORDER BY ps.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const shares = await AppDataSource.query(sql, params);

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM performance_shares ps WHERE 1=1`;
    const countParams: any[] = [];
    if (status) { countSql += ` AND ps.status = ?`; countParams.push(status); }
    if (orderId) { countSql += ` AND ps.order_id = ?`; countParams.push(orderId); }

    const [countResult] = await AppDataSource.query(countSql, countParams);

    res.json({
      success: true,
      data: {
        shares: shares.map((s: any) => ({
          ...s,
          shareMembers: s.shareMembers ? JSON.parse(s.shareMembers) : []
        })),
        total: countResult?.total || 0,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Lấy danh sách chia sẻ thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy danh sách chia sẻ thành tích thất bại' });
  }
});


/**
 * @route GET /api/v1/performance/shares/:id
 * @desc Lấy chi tiết một chia sẻ thành tích
 */
router.get('/shares/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [share] = await AppDataSource.query(
      `SELECT * FROM performance_shares WHERE id = ?`, [id]
    );

    if (!share) {
      return res.status(404).json({ success: false, message: '业绩分享记录不存在' });
    }

    const members = await AppDataSource.query(
      `SELECT * FROM performance_share_members WHERE share_id = ?`, [id]
    );

    res.json({
      success: true,
      data: { ...share, shareMembers: members }
    });
  } catch (error) {
    console.error('Lấy chi tiết chia sẻ thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy chi tiết chia sẻ thành tích thất bại' });
  }
});

/**
 * @route POST /api/v1/performance/shares
 * @desc Tạo chia sẻ thành tích
 */
router.post('/shares', async (req: Request, res: Response) => {
  try {
    const { orderId, orderNumber, orderAmount, shareMembers, description } = req.body;
    const currentUser = (req as any).user;

    if (!orderId || !orderNumber || !orderAmount || !shareMembers || shareMembers.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu các trường bắt buộc' });
    }

    // Xác thực tổng tỷ lệ chia sẻ
    const totalPercentage = shareMembers.reduce((sum: number, m: any) => sum + m.percentage, 0);
    if (totalPercentage !== 100) {
      return res.status(400).json({ success: false, message: 'Tổng tỷ lệ chia sẻ phải bằng 100%' });
    }

    const shareId = uuidv4();
    const shareNumber = `SHARE${Date.now()}`;
    const totalShareAmount = orderAmount;

    // Chèn bản ghi chia sẻ
    await AppDataSource.query(
      `INSERT INTO performance_shares
       (id, share_number, order_id, order_number, order_amount, total_share_amount, share_count,
        status, description, created_by, created_by_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [shareId, shareNumber, orderId, orderNumber, orderAmount, totalShareAmount,
       shareMembers.length, 'active', description || '',
       currentUser?.userId, currentUser?.realName || currentUser?.username]
    );

    // Chèn bản ghi thành viên
    for (const member of shareMembers) {
      const memberId = uuidv4();
      const shareAmount = (orderAmount * member.percentage) / 100;
      await AppDataSource.query(
        `INSERT INTO performance_share_members
         (id, share_id, user_id, user_name, department, share_percentage, share_amount, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [memberId, shareId, member.userId, member.userName, member.department || '',
         member.percentage, shareAmount]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Tạo chia sẻ thành tích thành công',
      data: { id: shareId, shareNumber }
    });
  } catch (error) {
    console.error('Tạo chia sẻ thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Tạo chia sẻ thành tích thất bại' });
  }
});

/**
 * @route DELETE /api/v1/performance/shares/:id
 * @desc Hủy chia sẻ thành tích
 */
router.delete('/shares/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    const [share] = await AppDataSource.query(
      `SELECT * FROM performance_shares WHERE id = ?`, [id]
    );

    if (!share) {
      return res.status(404).json({ success: false, message: 'Bản ghi chia sẻ thành tích không tồn tại' });
    }

    if (share.created_by !== currentUser?.userId) {
      return res.status(403).json({ success: false, message: 'Không có quyền hủy bản ghi chia sẻ này' });
    }

    if (share.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể hủy bản ghi chia sẻ ở trạng thái hoạt động' });
    }

    await AppDataSource.query(
      `UPDATE performance_shares SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Chia sẻ thành tích đã được hủy' });
  } catch (error) {
    console.error('Hủy chia sẻ thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Hủy chia sẻ thành tích thất bại' });
  }
});

/**
 * @route POST /api/v1/performance/shares/:id/confirm
 * @desc Xác nhận chia sẻ thành tích
 */
router.post('/shares/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Cập nhật trạng thái thành viên
    await AppDataSource.query(
      `UPDATE performance_share_members SET status = 'confirmed', confirm_time = NOW()
       WHERE share_id = ? AND user_id = ?`,
      [id, currentUser?.userId]
    );

    // Kiểm tra xem tất cả thành viên đã xác nhận chưa
    const [pendingCount] = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM performance_share_members WHERE share_id = ? AND status != 'confirmed'`,
      [id]
    );

    if (pendingCount?.count === 0) {
      await AppDataSource.query(
        `UPDATE performance_shares SET status = 'completed', completed_at = NOW() WHERE id = ?`,
        [id]
      );
    }

    res.json({ success: true, message: 'Xác nhận chia sẻ thành tích thành công' });
  } catch (error) {
    console.error('Xác nhận chia sẻ thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Xác nhận chia sẻ thành tích thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/stats
 * @desc Lấy dữ liệu thống kê chia sẻ thành tích
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    const [totalResult] = await AppDataSource.query(
      `SELECT COUNT(*) as total, SUM(order_amount) as totalAmount FROM performance_shares`
    );

    const [pendingResult] = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM performance_shares WHERE status = 'active'`
    );

    const [completedResult] = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM performance_shares WHERE status = 'completed'`
    );

    // Thống kê liên quan đến người dùng
    const [userResult] = await AppDataSource.query(
      `SELECT COUNT(DISTINCT ps.id) as count, SUM(psm.share_amount) as amount
       FROM performance_shares ps
       JOIN performance_share_members psm ON ps.id = psm.share_id
       WHERE psm.user_id = ? OR ps.created_by = ?`,
      [currentUser?.userId, currentUser?.userId]
    );

    res.json({
      success: true,
      data: {
        totalShares: totalResult?.total || 0,
        totalAmount: totalResult?.totalAmount || 0,
        pendingShares: pendingResult?.count || 0,
        completedShares: completedResult?.count || 0,
        userStats: {
          totalShares: userResult?.count || 0,
          totalAmount: userResult?.amount || 0
        }
      }
    });
  } catch (error) {
    console.error('Lấy thống kê chia sẻ thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy thống kê chia sẻ thành tích thất bại' });
  }
});


/**
 * @route GET /api/v1/performance/personal
 * @desc Lấy dữ liệu thành tích cá nhân
 */
router.get('/personal', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = (req.query.userId as string) || currentUser?.userId;

    // Thống kê thành tích cá nhân từ bảng đơn hàng
    const [orderStats] = await AppDataSource.query(
      `SELECT
         COUNT(*) as totalOrders,
         SUM(total_amount) as totalAmount,
         SUM(CASE WHEN status IN ('completed', 'delivered') THEN 1 ELSE 0 END) as completedOrders,
         SUM(CASE WHEN status IN ('completed', 'delivered') THEN total_amount ELSE 0 END) as completedAmount,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledOrders
       FROM orders WHERE created_by = ?`,
      [userId]
    );

    // Số khách hàng mới
    const [customerStats] = await AppDataSource.query(
      `SELECT COUNT(*) as newCustomers FROM customers WHERE sales_person_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        userId,
        totalOrders: orderStats?.totalOrders || 0,
        totalAmount: orderStats?.totalAmount || 0,
        completedOrders: orderStats?.completedOrders || 0,
        completedAmount: orderStats?.completedAmount || 0,
        pendingOrders: orderStats?.pendingOrders || 0,
        cancelledOrders: orderStats?.cancelledOrders || 0,
        newCustomers: customerStats?.newCustomers || 0
      }
    });
  } catch (error) {
    console.error('Lấy thành tích cá nhân thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy thành tích cá nhân thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/team
 * @desc Lấy dữ liệu thành tích nhóm
 */
router.get('/team', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const departmentId = (req.query.departmentId as string) || currentUser?.departmentId;

    // Lấy thành tích thành viên phòng ban
    const members = await AppDataSource.query(
      `SELECT u.id as userId, u.real_name as userName, u.department_name as department,
              COUNT(o.id) as totalOrders,
              COALESCE(SUM(o.total_amount), 0) as totalAmount,
              SUM(CASE WHEN o.status IN ('completed', 'delivered') THEN 1 ELSE 0 END) as completedOrders,
              COALESCE(SUM(CASE WHEN o.status IN ('completed', 'delivered') THEN o.total_amount ELSE 0 END), 0) as completedAmount
       FROM users u
       LEFT JOIN orders o ON o.created_by = u.id
       WHERE u.department_id = ?
       GROUP BY u.id, u.real_name, u.department_name`,
      [departmentId]
    );

    const teamPerformance = {
      totalOrders: members.reduce((sum: number, m: any) => sum + (m.totalOrders || 0), 0),
      totalAmount: members.reduce((sum: number, m: any) => sum + parseFloat(m.totalAmount || 0), 0),
      completedOrders: members.reduce((sum: number, m: any) => sum + (m.completedOrders || 0), 0),
      completedAmount: members.reduce((sum: number, m: any) => sum + parseFloat(m.completedAmount || 0), 0),
      memberCount: members.length,
      members
    };

    res.json({ success: true, data: teamPerformance });
  } catch (error) {
    console.error('Lấy thành tích nhóm thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy thành tích nhóm thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/analysis
 * @desc Lấy dữ liệu phân tích thành tích
 */
router.get('/analysis', async (req: Request, res: Response) => {
  try {
    // Lấy xu hướng 7 ngày gần đây
    const trendData = await AppDataSource.query(
      `SELECT DATE(created_at) as date,
              COUNT(*) as orders,
              SUM(total_amount) as amount
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    // Phân bố trạng thái đơn hàng
    const statusDistribution = await AppDataSource.query(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    );

    // Dữ liệu tổng hợp
    const [summary] = await AppDataSource.query(
      `SELECT COUNT(*) as totalOrders,
              SUM(total_amount) as totalAmount,
              AVG(total_amount) as avgOrderAmount
       FROM orders`
    );

    res.json({
      success: true,
      data: {
        trend: trendData,
        statusDistribution,
        summary: {
          totalOrders: summary?.totalOrders || 0,
          totalAmount: summary?.totalAmount || 0,
          avgOrderAmount: Math.round(summary?.avgOrderAmount || 0)
        }
      }
    });
  } catch (error) {
    console.error('Lấy phân tích thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy phân tích thành tích thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/analysis/personal
 * @desc Lấy dữ liệu phân tích thành tích cá nhân
 */
router.get('/analysis/personal', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = (req.query.userId as string) || currentUser?.userId;

    const [stats] = await AppDataSource.query(
      `SELECT
         COUNT(*) as orderCount,
         SUM(total_amount) as orderAmount,
         SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipCount,
         SUM(CASE WHEN status = 'shipped' THEN total_amount ELSE 0 END) as shipAmount,
         SUM(CASE WHEN status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as signCount,
         SUM(CASE WHEN status IN ('delivered', 'completed') THEN total_amount ELSE 0 END) as signAmount,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as rejectCount,
         SUM(CASE WHEN status = 'cancelled' THEN total_amount ELSE 0 END) as rejectAmount,
         SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as returnCount,
         SUM(CASE WHEN status = 'refunded' THEN total_amount ELSE 0 END) as returnAmount
       FROM orders WHERE created_by = ?`,
      [userId]
    );

    const orderCount = stats?.orderCount || 1;
    res.json({
      success: true,
      data: {
        name: currentUser?.realName || currentUser?.username,
        orderCount: stats?.orderCount || 0,
        orderAmount: stats?.orderAmount || 0,
        shipCount: stats?.shipCount || 0,
        shipAmount: stats?.shipAmount || 0,
        shipRate: ((stats?.shipCount || 0) / orderCount * 100).toFixed(1),
        signCount: stats?.signCount || 0,
        signAmount: stats?.signAmount || 0,
        signRate: ((stats?.signCount || 0) / orderCount * 100).toFixed(1),
        rejectCount: stats?.rejectCount || 0,
        rejectAmount: stats?.rejectAmount || 0,
        rejectRate: ((stats?.rejectCount || 0) / orderCount * 100).toFixed(1),
        returnCount: stats?.returnCount || 0,
        returnAmount: stats?.returnAmount || 0,
        returnRate: ((stats?.returnCount || 0) / orderCount * 100).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Lấy phân tích thành tích cá nhân thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy phân tích thành tích cá nhân thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/analysis/department
 * @desc Lấy dữ liệu phân tích thành tích phòng ban
 */
router.get('/analysis/department', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const departmentId = (req.query.departmentId as string) || currentUser?.departmentId;

    const [stats] = await AppDataSource.query(
      `SELECT
         COUNT(o.id) as orderCount,
         SUM(o.total_amount) as orderAmount,
         SUM(CASE WHEN o.status = 'shipped' THEN 1 ELSE 0 END) as shipCount,
         SUM(CASE WHEN o.status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as signCount,
         SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as rejectCount,
         SUM(CASE WHEN o.status = 'refunded' THEN 1 ELSE 0 END) as returnCount
       FROM orders o
       JOIN users u ON o.created_by = u.id
       WHERE u.department_id = ?`,
      [departmentId]
    );

    const orderCount = stats?.orderCount || 1;
    res.json({
      success: true,
      data: {
        name: '部门',
        orderCount: stats?.orderCount || 0,
        orderAmount: stats?.orderAmount || 0,
        shipCount: stats?.shipCount || 0,
        shipRate: ((stats?.shipCount || 0) / orderCount * 100).toFixed(1),
        signCount: stats?.signCount || 0,
        signRate: ((stats?.signCount || 0) / orderCount * 100).toFixed(1),
        rejectCount: stats?.rejectCount || 0,
        rejectRate: ((stats?.rejectCount || 0) / orderCount * 100).toFixed(1),
        returnCount: stats?.returnCount || 0,
        returnRate: ((stats?.returnCount || 0) / orderCount * 100).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Lấy phân tích thành tích phòng ban thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy phân tích thành tích phòng ban thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/analysis/company
 * @desc Lấy dữ liệu phân tích thành tích công ty
 */
router.get('/analysis/company', async (_req: Request, res: Response) => {
  try {
    const [stats] = await AppDataSource.query(
      `SELECT
         COUNT(*) as orderCount,
         SUM(total_amount) as orderAmount,
         SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipCount,
         SUM(CASE WHEN status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as signCount,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as rejectCount,
         SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as returnCount
       FROM orders`
    );

    const orderCount = stats?.orderCount || 1;
    res.json({
      success: true,
      data: {
        name: 'Tổng thể công ty',
        orderCount: stats?.orderCount || 0,
        orderAmount: stats?.orderAmount || 0,
        shipCount: stats?.shipCount || 0,
        shipRate: ((stats?.shipCount || 0) / orderCount * 100).toFixed(1),
        signCount: stats?.signCount || 0,
        signRate: ((stats?.signCount || 0) / orderCount * 100).toFixed(1),
        rejectCount: stats?.rejectCount || 0,
        rejectRate: ((stats?.rejectCount || 0) / orderCount * 100).toFixed(1),
        returnCount: stats?.returnCount || 0,
        returnRate: ((stats?.returnCount || 0) / orderCount * 100).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Lấy phân tích thành tích công ty thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy phân tích thành tích công ty thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/analysis/metrics
 * @desc Lấy chỉ số thống kê thành tích
 */
router.get('/analysis/metrics', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const currentUser = (req as any).user;

    let whereClause = '';
    const params: unknown[] = [];

    if (type === 'personal') {
      whereClause = 'WHERE o.created_by = ?';
      params.push(currentUser?.userId);
    } else if (type === 'department') {
      whereClause = 'WHERE u.department_id = ?';
      params.push(currentUser?.departmentId);
    }

    const sql = `SELECT
       SUM(o.total_amount) as totalPerformance,
       COUNT(o.id) as totalOrders,
       SUM(CASE WHEN o.status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as signOrders,
       SUM(CASE WHEN o.status IN ('delivered', 'completed') THEN o.total_amount ELSE 0 END) as signPerformance
     FROM orders o
     ${type === 'department' ? 'JOIN users u ON o.created_by = u.id' : ''}
     ${whereClause}`;

    const [stats] = await AppDataSource.query(sql, params);

    const totalOrders = stats?.totalOrders || 1;
    res.json({
      success: true,
      data: {
        totalPerformance: stats?.totalPerformance || 0,
        totalOrders: stats?.totalOrders || 0,
        avgPerformance: Math.round((stats?.totalPerformance || 0) / totalOrders),
        signOrders: stats?.signOrders || 0,
        signRate: ((stats?.signOrders || 0) / totalOrders * 100).toFixed(1),
        signPerformance: stats?.signPerformance || 0
      }
    });
  } catch (error) {
    console.error('Lấy chỉ số thống kê thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy chỉ số thống kê thành tích thất bại' });
  }
});

/**
 * @route GET /api/v1/performance/analysis/trend
 * @desc Lấy dữ liệu xu hướng thành tích
 */
router.get('/analysis/trend', async (req: Request, res: Response) => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '30d' ? 30 : 7;

    const trendData = await AppDataSource.query(
      `SELECT DATE(created_at) as date,
              SUM(total_amount) as sales,
              COUNT(*) as orders
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [days]
    );

    res.json({ success: true, data: trendData });
  } catch (error) {
    console.error('Lấy xu hướng thành tích thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy xu hướng thành tích thất bại' });
  }
});

export default router;
