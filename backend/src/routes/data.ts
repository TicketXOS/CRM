import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { User } from '../entities/User';
import { Not, IsNull } from 'typeorm';

const router = Router();

router.use(authenticateToken);

/**
 * @route GET /api/v1/data/list
 * @desc Lấy danh sách dữ liệu (dữ liệu khách hàng)
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status, keyword, assigneeId } = req.query;
    const currentUser = req.user;
    const customerRepository = AppDataSource.getRepository(Customer);

    const queryBuilder = customerRepository.createQueryBuilder('customer');

    // Lọc quyền dữ liệu
    const role = currentUser?.role || '';
    const allowAllRoles = ['super_admin', 'superadmin', 'admin'];
    if (!allowAllRoles.includes(role)) {
      if (role === 'manager' || role === 'department_manager') {
        // Quản lý xem phòng ban của mình
      } else {
        // Nhân viên bán hàng chỉ xem của mình
        queryBuilder.andWhere('customer.salesPersonId = :userId', {
          userId: currentUser?.userId
        });
      }
    }

    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(customer.name LIKE :keyword OR customer.phone LIKE :keyword OR customer.customerCode LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    if (assigneeId) {
      queryBuilder.andWhere('customer.salesPersonId = :assigneeId', { assigneeId });
    }

    queryBuilder.orderBy('customer.createdAt', 'DESC');
    queryBuilder.skip((Number(page) - 1) * Number(pageSize));
    queryBuilder.take(Number(pageSize));

    const [list, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      data: { list, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Lấy danh sách dữ liệu thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy danh sách dữ liệu thất bại' });
  }
});


/**
 * @route POST /api/v1/data/batch-assign
 * @desc Phân bổ hàng loạt dữ liệu
 */
router.post('/batch-assign', async (req: Request, res: Response) => {
  try {
    const { dataIds, assigneeId } = req.body;

    if (!dataIds || dataIds.length === 0 || !assigneeId) {
      return res.status(400).json({ success: false, message: 'Tham số không đầy đủ' });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const userRepository = AppDataSource.getRepository(User);

    const assignee = await userRepository.findOne({ where: { id: assigneeId } });
    if (!assignee) {
      return res.status(404).json({ success: false, message: 'Người được phân bổ không tồn tại' });
    }

    let successCount = 0;
    for (const id of dataIds) {
      try {
        const customer = await customerRepository.findOne({ where: { id } });
        if (customer) {
          customer.salesPersonId = assigneeId;
          customer.salesPersonName = assignee.realName || assignee.username;
          await customerRepository.save(customer);
          successCount++;
        }
      } catch (e) {
        console.error('Phân bổ một dữ liệu thất bại:', e);
      }
    }

    res.json({
      success: true,
      message: 'Phân bổ thành công',
      data: { successCount, failCount: dataIds.length - successCount }
    });
  } catch (error) {
    console.error('Phân bổ hàng loạt thất bại:', error);
    res.status(500).json({ success: false, message: 'Phân bổ hàng loạt thất bại' });
  }
});

/**
 * @route POST /api/v1/data/batch-archive
 * @desc Lưu trữ hàng loạt dữ liệu
 */
router.post('/batch-archive', async (req: Request, res: Response) => {
  try {
    const { dataIds } = req.body;

    if (!dataIds || dataIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Tham số không đầy đủ' });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    let successCount = 0;

    for (const id of dataIds) {
      try {
        const customer = await customerRepository.findOne({ where: { id } });
        if (customer) {
          customer.status = 'archived';
          await customerRepository.save(customer);
          successCount++;
        }
      } catch (e) {
        console.error('Lưu trữ một dữ liệu thất bại:', e);
      }
    }

    res.json({
      success: true,
      message: 'Lưu trữ thành công',
      data: { successCount, failCount: dataIds.length - successCount }
    });
  } catch (error) {
    console.error('Lưu trữ hàng loạt thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu trữ hàng loạt thất bại' });
  }
});

/**
 * @route POST /api/v1/data/recover
 * @desc Khôi phục dữ liệu
 */
router.post('/recover', async (req: Request, res: Response) => {
  try {
    const { dataIds } = req.body;

    if (!dataIds || dataIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Tham số không đầy đủ' });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    let successCount = 0;

    for (const id of dataIds) {
      try {
        const customer = await customerRepository.findOne({ where: { id } });
        if (customer) {
          customer.status = 'active';
          await customerRepository.save(customer);
          successCount++;
        }
      } catch (e) {
        console.error('Khôi phục một dữ liệu thất bại:', e);
      }
    }

    res.json({
      success: true,
      message: 'Khôi phục thành công',
      data: { successCount, failCount: dataIds.length - successCount }
    });
  } catch (error) {
    console.error('Khôi phục dữ liệu thất bại:', error);
    res.status(500).json({ success: false, message: 'Khôi phục dữ liệu thất bại' });
  }
});

/**
 * @route GET /api/v1/data/assignee-options
 * @desc Lấy tùy chọn người được phân bổ
 */
router.get('/assignee-options', async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      where: { status: 'active' },
      select: ['id', 'username', 'realName', 'departmentName', 'position']
    });

    const options = users.map(u => ({
      id: u.id,
      name: u.realName || u.username,
      department: u.departmentName,
      position: u.position
    }));

    res.json({ success: true, data: options });
  } catch (error) {
    console.error('Lấy tùy chọn người được phân bổ thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy tùy chọn người được phân bổ thất bại' });
  }
});

/**
 * @route GET /api/v1/data/search
 * @desc Tìm kiếm khách hàng (Quản lý tài liệu - Tìm kiếm khách hàng)
 * Hỗ trợ: Tên khách hàng, số điện thoại, mã khách hàng, số đơn hàng, số đơn vận chuyển
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const customerRepository = AppDataSource.getRepository(Customer);

    if (!keyword) {
      return res.json({ success: true, data: null });
    }

    console.log('🔍 [Tìm kiếm khách hàng] Từ khóa:', keyword);

    // 1. Tìm kiếm trực tiếp thông tin khách hàng (mã khách hàng, số điện thoại, tên)
    let customer = await customerRepository
      .createQueryBuilder('customer')
      .where('customer.customerCode = :keyword', { keyword })
      .orWhere('customer.phone = :keyword', { keyword })
      .orWhere('customer.name = :keyword', { keyword })
      .getOne();

    // 2. Nếu không tìm thấy, tìm kiếm qua số đơn hàng
    if (!customer) {
      console.log('🔍 [Tìm kiếm khách hàng] Thử tìm qua số đơn hàng');
      const orderResult = await AppDataSource.query(
        `SELECT c.* FROM customers c
         JOIN orders o ON c.id = o.customer_id
         WHERE o.order_no = ?
         LIMIT 1`,
        [keyword]
      );
      if (orderResult && orderResult.length > 0) {
        // Truy vấn lại qua ID để lấy entity Customer đầy đủ
        customer = await customerRepository.findOne({
          where: { id: orderResult[0].id }
        }) || null;
        if (customer) {
          console.log('✅ [Tìm kiếm khách hàng] Tìm thấy khách hàng qua số đơn hàng:', customer.name);
        }
      }
    }

    // 3. Nếu vẫn chưa tìm thấy, tìm kiếm qua số đơn vận chuyển
    if (!customer) {
      console.log('🔍 [Tìm kiếm khách hàng] Thử tìm qua số đơn vận chuyển');
      const logisticsResult = await AppDataSource.query(
        `SELECT c.* FROM customers c
         JOIN orders o ON c.id = o.customer_id
         JOIN logistics_tracking l ON o.id = l.order_id
         WHERE l.tracking_number = ?
         LIMIT 1`,
        [keyword]
      );
      if (logisticsResult && logisticsResult.length > 0) {
        // Truy vấn lại qua ID để lấy entity Customer đầy đủ
        customer = await customerRepository.findOne({
          where: { id: logisticsResult[0].id }
        }) || null;
        if (customer) {
          console.log('✅ [Tìm kiếm khách hàng] Tìm thấy khách hàng qua số đơn vận chuyển:', customer.name);
        }
      }
    }

    if (!customer) {
      console.log('❌ [Tìm kiếm khách hàng] Không tìm thấy khách hàng phù hợp');
      return res.json({ success: true, data: null, message: 'Không tìm thấy khách hàng phù hợp' });
    }

    // Lấy thông tin người bán hàng thuộc về khách hàng
    if (customer.salesPersonId) {
      const salesPersonResult = await AppDataSource.query(
        `SELECT id, username, real_name, department_name, position FROM users WHERE id = ?`,
        [customer.salesPersonId]
      );
      if (salesPersonResult && salesPersonResult.length > 0) {
        const salesPerson = salesPersonResult[0];

        (customer as any).salesPersonInfo = {
          id: salesPerson.id,
          name: salesPerson.real_name || salesPerson.username,
          department: salesPerson.department_name,
          position: salesPerson.position
        };
        console.log('✅ [Tìm kiếm khách hàng] Lấy được thông tin người bán hàng:', salesPerson.real_name || salesPerson.username);
      }
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('❌ [Tìm kiếm khách hàng] Thất bại:', error);
    res.status(500).json({ success: false, message: 'Tìm kiếm khách hàng thất bại' });
  }
});

/**
 * @route GET /api/v1/data/search-customer
 * @desc Tìm kiếm khách hàng (tìm kiếm mờ, trả về danh sách)
 */
router.get('/search-customer', async (req: Request, res: Response) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    const customerRepository = AppDataSource.getRepository(Customer);

    if (!keyword) {
      return res.json({ success: true, data: { list: [], total: 0 } });
    }

    const queryBuilder = customerRepository.createQueryBuilder('customer');
    queryBuilder.where(
      '(customer.customerCode LIKE :keyword OR customer.name LIKE :keyword OR customer.phone LIKE :keyword)',
      { keyword: `%${keyword}%` }
    );

    queryBuilder.orderBy('customer.createdAt', 'DESC');
    queryBuilder.skip((Number(page) - 1) * Number(pageSize));
    queryBuilder.take(Number(pageSize));

    const [list, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      data: { list, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Tìm kiếm khách hàng thất bại:', error);
    res.status(500).json({ success: false, message: 'Tìm kiếm khách hàng thất bại' });
  }
});

/**
 * @route GET /api/v1/data/statistics
 * @desc Lấy thống kê dữ liệu
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    const totalCount = await customerRepository.count();
    const assignedCount = await customerRepository.count({

      where: { salesPersonId: Not(IsNull()) } as any
    });
    const archivedCount = await customerRepository.count({
      where: { status: 'archived' }
    });

    res.json({
      success: true,
      data: {
        totalCount,
        assignedCount,
        unassignedCount: totalCount - assignedCount,
        archivedCount
      }
    });
  } catch (error) {
    console.error('Lấy thống kê dữ liệu thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy thống kê dữ liệu thất bại' });
  }
});

export default router;
