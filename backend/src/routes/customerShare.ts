import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { CustomerShare } from '../entities/CustomerShare';
import { Customer } from '../entities/Customer';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';
import { LessThan } from 'typeorm';

const router = Router();

// Tất cả route chia sẻ khách hàng đều cần xác thực
router.use(authenticateToken);

/**
 * @route GET /api/v1/customer-share/history
 * @desc Lấy lịch sử chia sẻ
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, customerId, status } = req.query;
    const currentUser = (req as any).user;

    const shareRepository = AppDataSource.getRepository(CustomerShare);
    const queryBuilder = shareRepository.createQueryBuilder('share');

    // Chỉ có thể xem những gì mình chia sẻ hoặc được chia sẻ cho mình
    queryBuilder.where('(share.sharedBy = :userId OR share.sharedTo = :userId)', {
      userId: currentUser.userId
    });

    if (customerId) {
      queryBuilder.andWhere('share.customerId = :customerId', { customerId });
    }

    if (status) {
      queryBuilder.andWhere('share.status = :status', { status });
    }

    queryBuilder.orderBy('share.createdAt', 'DESC');
    queryBuilder.skip((Number(page) - 1) * Number(pageSize));
    queryBuilder.take(Number(pageSize));

    const [list, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      code: 200,
      data: { list, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Lấy lịch sử chia sẻ thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy lịch sử chia sẻ thất bại' });
  }
});


/**
 * @route POST /api/v1/customer-share/share
 * @desc Chia sẻ khách hàng
 */
router.post('/share', async (req: Request, res: Response) => {
  try {
    const { customerId, sharedTo, timeLimit, remark } = req.body;
    const currentUser = (req as any).user;

    if (!customerId || !sharedTo) {
      return res.status(400).json({ success: false, code: 400, message: 'Tham số không đầy đủ' });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const userRepository = AppDataSource.getRepository(User);
    const shareRepository = AppDataSource.getRepository(CustomerShare);

    // Lấy thông tin khách hàng
    const customer = await customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, code: 404, message: 'Khách hàng không tồn tại' });
    }

    // Lấy thông tin người nhận
    const targetUser = await userRepository.findOne({ where: { id: sharedTo } });
    if (!targetUser) {
      return res.status(404).json({ success: false, code: 404, message: 'Người nhận không tồn tại' });
    }

    // Tạo bản ghi chia sẻ
    const share = new CustomerShare();
    share.id = uuidv4();
    share.customerId = customerId;
    share.customerName = customer.name;
    share.sharedBy = currentUser.userId;
    share.sharedByName = currentUser.realName || currentUser.username;
    share.sharedTo = sharedTo;
    share.sharedToName = targetUser.realName || targetUser.username;
    share.timeLimit = timeLimit || 0;
    share.remark = remark || '';
    share.status = 'active';
    share.originalOwner = customer.salesPersonId || customer.createdBy;

    // Tính toán thời gian hết hạn
    if (timeLimit && timeLimit > 0) {
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + timeLimit);
      share.expireTime = expireTime;
    }

    await shareRepository.save(share);

    res.status(201).json({
      success: true,
      code: 200,
      message: 'Chia sẻ khách hàng thành công',
      data: share
    });
  } catch (error) {
    console.error('Chia sẻ khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Chia sẻ khách hàng thất bại' });
  }
});

/**
 * @route POST /api/v1/customer-share/recall
 * @desc Thu hồi khách hàng
 */
router.post('/recall', async (req: Request, res: Response) => {
  try {
    const { shareId, reason } = req.body;
    const currentUser = (req as any).user;

    if (!shareId) {
      return res.status(400).json({ success: false, code: 400, message: 'ID chia sẻ không được để trống' });
    }

    const shareRepository = AppDataSource.getRepository(CustomerShare);
    const share = await shareRepository.findOne({ where: { id: shareId } });

    if (!share) {
      return res.status(404).json({ success: false, code: 404, message: 'Bản ghi chia sẻ không tồn tại' });
    }

    // Chỉ người chia sẻ mới có thể thu hồi
    if (share.sharedBy !== currentUser.userId) {
      return res.status(403).json({ success: false, code: 403, message: 'Không có quyền thu hồi chia sẻ này' });
    }

    share.status = 'recalled';
    share.recallTime = new Date();
    share.recallReason = reason || '';

    await shareRepository.save(share);

    res.json({ success: true, code: 200, message: 'Thu hồi khách hàng thành công' });
  } catch (error) {
    console.error('Thu hồi khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Thu hồi khách hàng thất bại' });
  }
});

/**
 * @route GET /api/v1/customer-share/my-shared
 * @desc Lấy khách hàng tôi đã chia sẻ
 */
router.get('/my-shared', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const shareRepository = AppDataSource.getRepository(CustomerShare);

    const shares = await shareRepository.find({
      where: { sharedBy: currentUser.userId, status: 'active' },
      order: { createdAt: 'DESC' }
    });

    res.json({ success: true, code: 200, data: shares });
  } catch (error) {
    console.error('Lấy khách hàng tôi đã chia sẻ thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy dữ liệu thất bại' });
  }
});

/**
 * @route GET /api/v1/customer-share/shared-to-me
 * @desc Lấy khách hàng được chia sẻ cho tôi
 */
router.get('/shared-to-me', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const shareRepository = AppDataSource.getRepository(CustomerShare);

    // Cập nhật trạng thái hết hạn
    await shareRepository.update(
      { sharedTo: currentUser.userId, status: 'active', expireTime: LessThan(new Date()) },
      { status: 'expired' }
    );

    const shares = await shareRepository.find({
      where: { sharedTo: currentUser.userId, status: 'active' },
      order: { createdAt: 'DESC' }
    });

    res.json({ success: true, code: 200, data: shares });
  } catch (error) {
    console.error('Lấy khách hàng được chia sẻ cho tôi thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy dữ liệu thất bại' });
  }
});

/**
 * @route GET /api/v1/customer-share/shareable-users
 * @desc Lấy danh sách người dùng có thể chia sẻ
 */
router.get('/shareable-users', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userRepository = AppDataSource.getRepository(User);

    // Lấy tất cả người dùng đang hoạt động (loại trừ chính mình)
    const users = await userRepository.find({
      where: { status: 'active' },
      select: ['id', 'username', 'realName', 'departmentId', 'departmentName', 'position']
    });

    const shareableUsers = users
      .filter(u => u.id !== currentUser.userId)
      .map(u => ({
        id: u.id,
        name: u.realName || u.username,
        department: u.departmentName,
        position: u.position
      }));

    res.json({ success: true, code: 200, data: shareableUsers });
  } catch (error) {
    console.error('Lấy danh sách người dùng có thể chia sẻ thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy dữ liệu thất bại' });
  }
});

export default router;
