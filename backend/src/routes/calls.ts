import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Call } from '../entities/Call';
import { Between, Like } from 'typeorm';

const router = Router();

router.use(authenticateToken);

// Lấy dữ liệu thống kê cuộc gọi
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const callRepository = AppDataSource.getRepository(Call);

    const queryBuilder = callRepository.createQueryBuilder('call');

    if (startDate && endDate) {
      queryBuilder.where('call.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    const totalCalls = await queryBuilder.getCount();
    const successfulCalls = await queryBuilder.clone()
      .andWhere('call.status = :status', { status: 'completed' })
      .getCount();
    const failedCalls = await queryBuilder.clone()
      .andWhere('call.status IN (:...statuses)', { statuses: ['failed', 'missed', 'busy'] })
      .getCount();

    // Tính thời lượng cuộc gọi trung bình
    const avgResult = await queryBuilder.clone()
      .select('AVG(call.duration)', 'avgDuration')
      .getRawOne();

    res.json({
      success: true,
      data: {
        totalCalls,
        successfulCalls,
        failedCalls,
        averageDuration: Math.round(avgResult?.avgDuration || 0)
      }
    });
  } catch (error) {
    console.error('Lấy dữ liệu thống kê cuộc gọi thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy dữ liệu thống kê cuộc gọi thất bại'
    });
  }
});


// Lấy danh sách bản ghi cuộc gọi
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, keyword } = req.query;
    const callRepository = AppDataSource.getRepository(Call);

    const queryBuilder = callRepository.createQueryBuilder('call');

    if (status) {
      queryBuilder.andWhere('call.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('call.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    if (keyword) {
      queryBuilder.andWhere('(call.phoneNumber LIKE :keyword OR call.notes LIKE :keyword)', {
        keyword: `%${keyword}%`
      });
    }

    queryBuilder.orderBy('call.createdAt', 'DESC');
    queryBuilder.skip((Number(page) - 1) * Number(limit));
    queryBuilder.take(Number(limit));

    const [records, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        records
      }
    });
  } catch (error) {
    console.error('Lấy danh sách bản ghi cuộc gọi thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách bản ghi cuộc gọi thất bại'
    });
  }
});

// Tạo bản ghi cuộc gọi
router.post('/', async (req: Request, res: Response) => {
  try {
    const callRepository = AppDataSource.getRepository(Call);
    const { customerId, phoneNumber, duration, status, notes } = req.body;
    const currentUser = (req as any).user;

    const call = callRepository.create({
      customerId,
      userId: currentUser?.userId,
      phoneNumber,
      duration: duration || 0,
      status: status || 'completed',
      notes
    });

    const savedCall = await callRepository.save(call);

    res.status(201).json({
      success: true,
      message: 'Tạo bản ghi cuộc gọi thành công',
      data: savedCall
    });
  } catch (error) {
    console.error('Tạo bản ghi cuộc gọi thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Tạo bản ghi cuộc gọi thất bại'
    });
  }
});

// Xuất bản ghi cuộc gọi
router.get('/export', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        url: '',
        filename: `calls_export_${Date.now()}.xlsx`
      }
    });
  } catch (error) {
    console.error('Xuất bản ghi cuộc gọi thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Xuất bản ghi cuộc gọi thất bại'
    });
  }
});

export default router;
