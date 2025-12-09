import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { SmsTemplate } from '../entities/SmsTemplate';
import { SmsRecord } from '../entities/SmsRecord';

const router = Router();

router.use(authenticateToken);

// Lấy danh sách mẫu tin nhắn SMS
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    const templateRepository = AppDataSource.getRepository(SmsTemplate);

    const queryBuilder = templateRepository.createQueryBuilder('template');

    if (status) {
      queryBuilder.andWhere('template.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('template.category = :category', { category });
    }

    queryBuilder.orderBy('template.createdAt', 'DESC');

    const templates = await queryBuilder.getMany();

    res.json({ success: true, code: 200, data: { templates } });
  } catch (error) {
    console.error('Lấy mẫu thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy mẫu thất bại' });
  }
});

// Tạo mẫu tin nhắn SMS
router.post('/templates', requireAdmin, async (req: Request, res: Response) => {
  try {
    const templateRepository = AppDataSource.getRepository(SmsTemplate);
    const currentUser = (req as any).user;
    const { name, category, content, variables, description } = req.body;

    const template = templateRepository.create({
      name,
      category,
      content,
      variables: variables || [],
      description,
      applicant: currentUser?.userId,
      applicantName: currentUser?.realName || currentUser?.username,
      status: 'pending'
    });

    const savedTemplate = await templateRepository.save(template);

    res.status(201).json({ success: true, code: 200, data: savedTemplate });
  } catch (error) {
    console.error('Tạo mẫu thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Tạo mẫu thất bại' });
  }
});


// Phê duyệt mẫu tin nhắn SMS
router.post('/templates/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const templateRepository = AppDataSource.getRepository(SmsTemplate);
    const { id } = req.params;
    const { approved } = req.body;
    const currentUser = (req as any).user;

    const template = await templateRepository.findOne({ where: { id: Number(id) } });
    if (!template) {
      return res.status(404).json({ success: false, code: 404, message: 'Mẫu không tồn tại' });
    }

    template.status = approved ? 'approved' : 'rejected';
    template.approvedBy = currentUser?.userId;
    template.approvedAt = new Date();

    await templateRepository.save(template);

    res.json({
      success: true, code: 200,
      message: approved ? 'Phê duyệt thành công' : 'Từ chối phê duyệt',
      data: { id, status: template.status }
    });
  } catch (error) {
    console.error('Phê duyệt thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Phê duyệt thất bại' });
  }
});

// Lấy lịch sử gửi tin nhắn SMS
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const recordRepository = AppDataSource.getRepository(SmsRecord);

    const queryBuilder = recordRepository.createQueryBuilder('record');

    if (status) {
      queryBuilder.andWhere('record.status = :status', { status });
    }

    queryBuilder.orderBy('record.createdAt', 'DESC');
    queryBuilder.skip((Number(page) - 1) * Number(pageSize));
    queryBuilder.take(Number(pageSize));

    const [records, total] = await queryBuilder.getManyAndCount();

    res.json({ success: true, code: 200, data: { records, total } });
  } catch (error) {
    console.error('Lấy lịch sử thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy lịch sử thất bại' });
  }
});

// Gửi tin nhắn SMS
router.post('/send', async (req: Request, res: Response) => {
  try {
    const recordRepository = AppDataSource.getRepository(SmsRecord);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = (req as any).user;
    const { templateId, templateName, recipients, content } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ success: false, code: 400, message: 'Người nhận không được để trống' });
    }

    const record = recordRepository.create({
      templateId: templateId ? String(templateId) : null,
      templateName,
      content,
      recipients,
      recipientCount: recipients.length,
      successCount: recipients.length, // Mô phỏng tất cả thành công
      failCount: 0,
      status: 'completed',
      applicant: currentUser?.userId,
      applicantName: currentUser?.realName || currentUser?.username,
      sentAt: new Date()
    });

    const savedRecord = await recordRepository.save(record);

    res.json({ success: true, code: 200, data: savedRecord });
  } catch (error) {
    console.error('Gửi thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Gửi thất bại' });
  }
});

// Lấy thống kê tin nhắn SMS
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const templateRepository = AppDataSource.getRepository(SmsTemplate);
    const recordRepository = AppDataSource.getRepository(SmsRecord);

    const pendingTemplates = await templateRepository
      .createQueryBuilder('template')
      .where('template.status = :status', { status: 'pending' })
      .getCount();

    // Tổng số lượng gửi
    const totalSentResult = await recordRepository
      .createQueryBuilder('record')
      .select('SUM(record.successCount)', 'total')
      .getRawOne();

    // Số lượng gửi hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySentResult = await recordRepository
      .createQueryBuilder('record')
      .select('SUM(record.successCount)', 'total')
      .where('record.sentAt >= :today', { today })
      .getRawOne();

    res.json({
      success: true, code: 200,
      data: {
        pendingTemplates,
        pendingSms: 0,
        todaySent: todaySentResult?.total || 0,
        totalSent: totalSentResult?.total || 0
      }
    });
  } catch (error) {
    console.error('Lấy thống kê thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy thống kê thất bại' });
  }
});

export default router;
