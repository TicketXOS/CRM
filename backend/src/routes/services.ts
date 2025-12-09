import { Router, Request, Response } from 'express';
import { getDataSource } from '../config/database';
import { AfterSalesService } from '../entities/AfterSalesService';
import { authenticateToken } from '../middleware/auth';
// import { Like, In } from 'typeorm'; // 暂时未使用

const router = Router();

// Lấy repository dịch vụ sau bán hàng
const getServiceRepository = () => {
  const dataSource = getDataSource();
  if (!dataSource) {
    throw new Error('Kết nối cơ sở dữ liệu chưa được khởi tạo');
  }
  return dataSource.getRepository(AfterSalesService);
};

/**
 * Lấy danh sách dịch vụ sau bán hàng
 * GET /api/v1/services
 * Hỗ trợ lọc quyền dữ liệu:
 * - Siêu quản trị viên/Quản trị viên/Dịch vụ khách hàng: Xem tất cả
 * - Quản lý: Xem phòng ban của mình
 * - Nhân viên bán hàng: Xem những gì mình tạo
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const currentUser = (req as any).user;
    const { page = 1, limit = 20, status, serviceType, search, orderNumber } = req.query;

    const queryBuilder = serviceRepository.createQueryBuilder('service');

    // Lọc quyền dữ liệu
    const role = currentUser?.role || '';
    const allowAllRoles = ['super_admin', 'superadmin', 'admin', 'service', 'customer_service'];

    if (!allowAllRoles.includes(role)) {
      if (role === 'manager' || role === 'department_manager') {
        // Quản lý xem phòng ban của mình
        if (currentUser?.departmentId) {
          queryBuilder.andWhere('service.departmentId = :departmentId', {
            departmentId: currentUser.departmentId
          });
        }
      } else {
        // Nhân viên bán hàng chỉ xem những gì mình tạo
        queryBuilder.andWhere('service.createdById = :userId', {
          userId: currentUser?.userId
        });
      }
    }

    // Lọc trạng thái
    if (status) {
      queryBuilder.andWhere('service.status = :status', { status });
    }

    // Lọc loại dịch vụ
    if (serviceType) {
      queryBuilder.andWhere('service.serviceType = :serviceType', { serviceType });
    }

    // Tìm kiếm số đơn hàng
    if (orderNumber) {
      queryBuilder.andWhere('service.orderNumber LIKE :orderNumber', {
        orderNumber: `%${orderNumber}%`
      });
    }

    // Tìm kiếm từ khóa
    if (search) {
      queryBuilder.andWhere(
        '(service.serviceNumber LIKE :search OR service.customerName LIKE :search OR service.orderNumber LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Phân trang
    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));

    // Sắp xếp
    queryBuilder.orderBy('service.createdAt', 'DESC');

    const [services, total] = await queryBuilder.getManyAndCount();

    // Định dạng dữ liệu trả về
    const formattedServices = services.map(service => ({
      id: service.id,
      serviceNumber: service.serviceNumber,
      orderId: service.orderId,
      orderNumber: service.orderNumber,
      customerId: service.customerId,
      customerName: service.customerName,
      customerPhone: service.customerPhone,
      serviceType: service.serviceType,
      status: service.status,
      priority: service.priority,
      reason: service.reason,
      description: service.description,
      productName: service.productName,
      productSpec: service.productSpec,
      quantity: service.quantity,
      price: service.price,
      contactName: service.contactName,
      contactPhone: service.contactPhone,
      contactAddress: service.contactAddress,
      assignedTo: service.assignedTo,
      assignedToId: service.assignedToId,
      remark: service.remark,
      attachments: service.attachments || [],
      createdBy: service.createdBy,
      createdById: service.createdById,
      departmentId: service.departmentId,
      createTime: service.createdAt?.toISOString().replace('T', ' ').substring(0, 19),
      updateTime: service.updatedAt?.toISOString().replace('T', ' ').substring(0, 19),
      expectedTime: service.expectedTime?.toISOString().replace('T', ' ').substring(0, 19),
      resolvedTime: service.resolvedTime?.toISOString().replace('T', ' ').substring(0, 19)
    }));

    res.json({
      success: true,
      data: {
        items: formattedServices,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[Services] Lấy danh sách dịch vụ sau bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách dịch vụ sau bán hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Lấy chi tiết dịch vụ sau bán hàng
 * GET /api/v1/services/:id
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const { id } = req.params;

    const service = await serviceRepository.findOne({ where: { id } });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '售后服务不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: service.id,
        serviceNumber: service.serviceNumber,
        orderId: service.orderId,
        orderNumber: service.orderNumber,
        customerId: service.customerId,
        customerName: service.customerName,
        customerPhone: service.customerPhone,
        serviceType: service.serviceType,
        status: service.status,
        priority: service.priority,
        reason: service.reason,
        description: service.description,
        productName: service.productName,
        productSpec: service.productSpec,
        quantity: service.quantity,
        price: service.price,
        contactName: service.contactName,
        contactPhone: service.contactPhone,
        contactAddress: service.contactAddress,
        assignedTo: service.assignedTo,
        assignedToId: service.assignedToId,
        remark: service.remark,
        attachments: service.attachments || [],
        createdBy: service.createdBy,
        createdById: service.createdById,
        departmentId: service.departmentId,
        createTime: service.createdAt?.toISOString().replace('T', ' ').substring(0, 19),
        updateTime: service.updatedAt?.toISOString().replace('T', ' ').substring(0, 19),
        expectedTime: service.expectedTime?.toISOString().replace('T', ' ').substring(0, 19),
        resolvedTime: service.resolvedTime?.toISOString().replace('T', ' ').substring(0, 19)
      }
    });
  } catch (error) {
    console.error('[Services] Lấy chi tiết dịch vụ sau bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy chi tiết dịch vụ sau bán hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Tạo dịch vụ sau bán hàng
 * POST /api/v1/services
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const currentUser = (req as any).user;
    const data = req.body;

    // Tạo ID và số đơn dịch vụ
    const timestamp = Date.now();
    const serviceId = `SH${timestamp}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const serviceNumber = `SH${timestamp}`;

    const service = serviceRepository.create({
      id: serviceId,
      serviceNumber,
      orderId: data.orderId || null,
      orderNumber: data.orderNumber || null,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      serviceType: data.serviceType || 'return',
      status: 'pending',
      priority: data.priority || 'normal',
      reason: data.reason || null,
      description: data.description || null,
      productName: data.productName || null,
      productSpec: data.productSpec || null,
      quantity: data.quantity || 1,
      price: data.price || 0,
      contactName: data.contactName || null,
      contactPhone: data.contactPhone || null,
      contactAddress: data.contactAddress || null,
      assignedTo: data.assignedTo || null,
      assignedToId: data.assignedToId || null,
      remark: data.remark || null,
      attachments: data.attachments || [],
      createdBy: currentUser?.username || data.createdBy || null,
      createdById: currentUser?.userId || data.createdById || null,
      departmentId: currentUser?.departmentId || data.departmentId || null,
      expectedTime: data.expectedTime ? new Date(data.expectedTime) : null
    });

    const savedService = await serviceRepository.save(service);

    console.log('[Services] Tạo dịch vụ sau bán hàng thành công:', savedService.serviceNumber);

    res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ sau bán hàng thành công',
      data: {
        id: savedService.id,
        serviceNumber: savedService.serviceNumber,
        status: savedService.status,
        createTime: savedService.createdAt?.toISOString().replace('T', ' ').substring(0, 19)
      }
    });
  } catch (error) {
    console.error('[Services] Tạo dịch vụ sau bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Tạo dịch vụ sau bán hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Cập nhật dịch vụ sau bán hàng
 * PUT /api/v1/services/:id
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const { id } = req.params;
    const data = req.body;

    const service = await serviceRepository.findOne({ where: { id } });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ sau bán hàng không tồn tại'
      });
    }

    // Cập nhật trường
    if (data.serviceType !== undefined) service.serviceType = data.serviceType;
    if (data.status !== undefined) service.status = data.status;
    if (data.priority !== undefined) service.priority = data.priority;
    if (data.reason !== undefined) service.reason = data.reason;
    if (data.description !== undefined) service.description = data.description;
    if (data.assignedTo !== undefined) service.assignedTo = data.assignedTo;
    if (data.assignedToId !== undefined) service.assignedToId = data.assignedToId;
    if (data.remark !== undefined) service.remark = data.remark;
    if (data.expectedTime !== undefined) service.expectedTime = data.expectedTime ? new Date(data.expectedTime) : null;

    // Nếu trạng thái chuyển thành đã giải quyết, ghi lại thời gian giải quyết
    if (data.status === 'resolved' && !service.resolvedTime) {
      service.resolvedTime = new Date();
    }

    const updatedService = await serviceRepository.save(service);

    console.log('[Services] Cập nhật dịch vụ sau bán hàng thành công:', updatedService.serviceNumber);

    res.json({
      success: true,
      message: 'Cập nhật dịch vụ sau bán hàng thành công',
      data: {
        id: updatedService.id,
        serviceNumber: updatedService.serviceNumber,
        status: updatedService.status,
        updateTime: updatedService.updatedAt?.toISOString().replace('T', ' ').substring(0, 19)
      }
    });
  } catch (error) {
    console.error('[Services] Cập nhật dịch vụ sau bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Cập nhật dịch vụ sau bán hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Cập nhật trạng thái dịch vụ sau bán hàng
 * PATCH /api/v1/services/:id/status
 */
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!['pending', 'processing', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị trạng thái không hợp lệ'
      });
    }

    const service = await serviceRepository.findOne({ where: { id } });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ sau bán hàng không tồn tại'
      });
    }

    service.status = status;
    if (remark) service.remark = remark;

    // Nếu trạng thái chuyển thành đã giải quyết, ghi lại thời gian giải quyết
    if (status === 'resolved' && !service.resolvedTime) {
      service.resolvedTime = new Date();
    }

    const updatedService = await serviceRepository.save(service);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: {
        id: updatedService.id,
        status: updatedService.status
      }
    });
  } catch (error) {
    console.error('[Services] Cập nhật trạng thái dịch vụ sau bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Cập nhật trạng thái thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Phân bổ người xử lý
 * PATCH /api/v1/services/:id/assign
 */
router.patch('/:id/assign', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const { id } = req.params;
    const { assignedTo, assignedToId, remark } = req.body;

    const service = await serviceRepository.findOne({ where: { id } });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ sau bán hàng không tồn tại'
      });
    }

    service.assignedTo = assignedTo;
    service.assignedToId = assignedToId;
    if (remark) service.remark = remark;

    // Sau khi phân bổ tự động chuyển thành đang xử lý
    if (service.status === 'pending') {
      service.status = 'processing';
    }

    const updatedService = await serviceRepository.save(service);

    res.json({
      success: true,
      message: 'Phân bổ thành công',
      data: {
        id: updatedService.id,
        assignedTo: updatedService.assignedTo,
        status: updatedService.status
      }
    });
  } catch (error) {
    console.error('[Services] Phân bổ người xử lý thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Phân bổ thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Thiết lập mức độ ưu tiên
 * PATCH /api/v1/services/:id/priority
 */
router.patch('/:id/priority', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const { id } = req.params;
    const { priority, remark } = req.body;

    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị mức độ ưu tiên không hợp lệ'
      });
    }

    const service = await serviceRepository.findOne({ where: { id } });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ sau bán hàng không tồn tại'
      });
    }

    service.priority = priority;
    if (remark) service.remark = remark;

    const updatedService = await serviceRepository.save(service);

    res.json({
      success: true,
      message: 'Thiết lập mức độ ưu tiên thành công',
      data: {
        id: updatedService.id,
        priority: updatedService.priority
      }
    });
  } catch (error) {
    console.error('[Services] Thiết lập mức độ ưu tiên thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Thiết lập mức độ ưu tiên thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Xóa dịch vụ sau bán hàng
 * DELETE /api/v1/services/:id
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const { id } = req.params;

    const service = await serviceRepository.findOne({ where: { id } });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ sau bán hàng không tồn tại'
      });
    }

    await serviceRepository.remove(service);

    console.log('[Services] Xóa dịch vụ sau bán hàng thành công:', service.serviceNumber);

    res.json({
      success: true,
      message: 'Xóa thành công'
    });
  } catch (error) {
    console.error('[Services] Xóa dịch vụ sau bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Xóa thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * Lấy thống kê dịch vụ sau bán hàng
 * GET /api/v1/services/statistics
 */
router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceRepository = getServiceRepository();
    const currentUser = (req as any).user;

    const queryBuilder = serviceRepository.createQueryBuilder('service');

    // Lọc quyền dữ liệu
    const role = currentUser?.role || '';
    const allowAllRoles = ['super_admin', 'superadmin', 'admin', 'service', 'customer_service'];

    if (!allowAllRoles.includes(role)) {
      if (role === 'manager' || role === 'department_manager') {
        if (currentUser?.departmentId) {
          queryBuilder.andWhere('service.departmentId = :departmentId', {
            departmentId: currentUser.departmentId
          });
        }
      } else {
        queryBuilder.andWhere('service.createdById = :userId', {
          userId: currentUser?.userId
        });
      }
    }

    const total = await queryBuilder.getCount();

    const pendingCount = await queryBuilder.clone()
      .andWhere('service.status = :status', { status: 'pending' })
      .getCount();

    const processingCount = await queryBuilder.clone()
      .andWhere('service.status = :status', { status: 'processing' })
      .getCount();

    const resolvedCount = await queryBuilder.clone()
      .andWhere('service.status = :status', { status: 'resolved' })
      .getCount();

    const closedCount = await queryBuilder.clone()
      .andWhere('service.status = :status', { status: 'closed' })
      .getCount();

    res.json({
      success: true,
      data: {
        total,
        pending: pendingCount,
        processing: processingCount,
        resolved: resolvedCount,
        closed: closedCount
      }
    });
  } catch (error) {
    console.error('[Services] Lấy thống kê thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy thống kê thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

export default router;
