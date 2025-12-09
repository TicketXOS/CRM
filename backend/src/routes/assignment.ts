import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticateToken);

// Lưu ý: Bảng customer_assignments cần được tạo trước trong cơ sở dữ liệu
// Ở đây tạm thời sử dụng truy vấn SQL gốc vì không có entity tương ứng

/**
 * @route GET /api/v1/assignment/history
 * @desc Lấy lịch sử phân bổ
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, customerId, toUserId } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let sql = `SELECT * FROM customer_assignments WHERE 1=1`;
    const params: any[] = [];

    if (customerId) {
      sql += ` AND customer_id = ?`;
      params.push(customerId);
    }

    if (toUserId) {
      sql += ` AND to_user_id = ?`;
      params.push(toUserId);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), offset);

    const list = await AppDataSource.query(sql, params);

    // Lấy tổng số
    let countSql = `SELECT COUNT(*) as total FROM customer_assignments WHERE 1=1`;
    const countParams: any[] = [];
    if (customerId) {
      countSql += ` AND customer_id = ?`;
      countParams.push(customerId);
    }
    if (toUserId) {
      countSql += ` AND to_user_id = ?`;
      countParams.push(toUserId);
    }

    const countResult = await AppDataSource.query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        list,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('Lấy lịch sử phân bổ thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy lịch sử phân bổ thất bại'
    });
  }
});


/**
 * @route POST /api/v1/assignment/assign
 * @desc Phân bổ khách hàng
 */
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const { customerId, toUserId, reason } = req.body;
    const currentUser = (req as any).user;

    if (!customerId || !toUserId) {
      return res.status(400).json({ success: false, message: 'Tham số không đầy đủ' });
    }

    // Lấy thông tin khách hàng
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Khách hàng không tồn tại' });
    }

    // Lấy thông tin người dùng đích
    const userRepository = AppDataSource.getRepository(User);
    const toUser = await userRepository.findOne({ where: { id: toUserId } });
    if (!toUser) {
      return res.status(404).json({ success: false, message: 'Người dùng đích không tồn tại' });
    }

    const assignmentId = uuidv4();
    const now = new Date();

    // Chèn bản ghi phân bổ
    await AppDataSource.query(
      `INSERT INTO customer_assignments
       (id, customer_id, customer_name, from_user_id, from_user_name, to_user_id, to_user_name,
        assignment_type, reason, operator_id, operator_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignmentId,
        customerId,
        customer.name,
        customer.salesPersonId,
        customer.salesPersonName,
        toUserId,
        toUser.realName || toUser.username,
        'manual',
        reason || '',
        currentUser?.userId,
        currentUser?.realName || currentUser?.username,
        now
      ]
    );

    // Cập nhật nhân viên bán hàng của khách hàng
    customer.salesPersonId = toUserId;
    customer.salesPersonName = toUser.realName || toUser.username;
    await customerRepository.save(customer);

    res.json({
      success: true,
      message: 'Phân bổ thành công',
      data: { id: assignmentId }
    });
  } catch (error) {
    console.error('Phân bổ khách hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Phân bổ khách hàng thất bại'
    });
  }
});

/**
 * @route POST /api/v1/assignment/batch-assign
 * @desc Phân bổ khách hàng hàng loạt
 */
router.post('/batch-assign', async (req: Request, res: Response) => {
  try {
    const { customerIds, toUserId, reason } = req.body;
    const currentUser = (req as any).user;

    if (!customerIds || customerIds.length === 0 || !toUserId) {
      return res.status(400).json({ success: false, message: 'Tham số không đầy đủ' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const toUser = await userRepository.findOne({ where: { id: toUserId } });
    if (!toUser) {
      return res.status(404).json({ success: false, message: 'Người dùng đích không tồn tại' });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    let successCount = 0;

    for (const customerId of customerIds) {
      try {
        const customer = await customerRepository.findOne({ where: { id: customerId } });
        if (customer) {
          const assignmentId = uuidv4();
          await AppDataSource.query(
            `INSERT INTO customer_assignments
             (id, customer_id, customer_name, from_user_id, from_user_name, to_user_id, to_user_name,
              assignment_type, reason, operator_id, operator_name, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              assignmentId, customerId, customer.name,
              customer.salesPersonId, customer.salesPersonName,
              toUserId, toUser.realName || toUser.username,
              'manual', reason || '',
              currentUser?.userId, currentUser?.realName || currentUser?.username,
              new Date()
            ]
          );

          customer.salesPersonId = toUserId;
          customer.salesPersonName = toUser.realName || toUser.username;
          await customerRepository.save(customer);
          successCount++;
        }
      } catch (e) {
        console.error('Phân bổ một khách hàng thất bại:', e);
      }
    }

    res.json({
      success: true,
      message: 'Phân bổ hàng loạt hoàn tất',
      data: { successCount, failCount: customerIds.length - successCount }
    });
  } catch (error) {
    console.error('Phân bổ hàng loạt thất bại:', error);
    res.status(500).json({ success: false, message: 'Phân bổ hàng loạt thất bại' });
  }
});

/**
 * @route GET /api/v1/assignment/stats
 * @desc Lấy thống kê phân bổ
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [totalResult] = await AppDataSource.query(
      `SELECT COUNT(*) as total FROM customer_assignments`
    );
    const [todayResult] = await AppDataSource.query(
      `SELECT COUNT(*) as total FROM customer_assignments WHERE created_at >= ?`,
      [today]
    );
    const [weekResult] = await AppDataSource.query(
      `SELECT COUNT(*) as total FROM customer_assignments WHERE created_at >= ?`,
      [weekAgo]
    );
    const [monthResult] = await AppDataSource.query(
      `SELECT COUNT(*) as total FROM customer_assignments WHERE created_at >= ?`,
      [monthAgo]
    );

    res.json({
      success: true,
      data: {
        totalAssignments: totalResult?.total || 0,
        todayAssignments: todayResult?.total || 0,
        weekAssignments: weekResult?.total || 0,
        monthAssignments: monthResult?.total || 0
      }
    });
  } catch (error) {
    console.error('Lấy thống kê phân bổ thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy thống kê phân bổ thất bại' });
  }
});

export default router;
