import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Tất cả các route đơn hàng đều cần xác thực
router.use(authenticateToken);

/**
 * @route GET /api/v1/orders
 * @desc Lấy danh sách đơn hàng
 * @access Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📋 [Danh sách đơn hàng] Nhận yêu cầu');
    const {
      page = 1,
      pageSize = 20,
      status,
      orderNumber,
      customerName,
      startDate,
      endDate
    } = req.query;

    // Sử dụng truy vấn SQL thuần để tránh vấn đề ánh xạ trường TypeORM
    let sql = `SELECT o.*, c.name as customer_name_joined, c.phone as customer_phone_joined
               FROM orders o
               LEFT JOIN customers c ON o.customer_id = c.id
               WHERE 1=1`;
    const params: (string | number)[] = [];

    // Lọc theo trạng thái
    if (status) {
      sql += ` AND o.status = ?`;
      params.push(String(status));
    }

    // Lọc theo số đơn hàng
    if (orderNumber) {
      sql += ` AND o.order_number LIKE ?`;
      params.push(`%${orderNumber}%`);
    }

    // Lọc theo tên khách hàng
    if (customerName) {
      sql += ` AND (o.customer_name LIKE ? OR c.name LIKE ?)`;
      params.push(`%${customerName}%`, `%${customerName}%`);
    }

    // Lọc theo phạm vi ngày tháng
    if (startDate) {
      sql += ` AND o.created_at >= ?`;
      params.push(String(startDate));
    }
    if (endDate) {
      sql += ` AND o.created_at <= ?`;
      params.push(String(endDate));
    }

    // Lấy tổng số
    const countSql = sql.replace(/SELECT o\.\*, c\.name as customer_name_joined, c\.phone as customer_phone_joined/, 'SELECT COUNT(*) as total');
    const countResult = await AppDataSource.query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Sắp xếp và phân trang
    sql += ` ORDER BY o.created_at DESC`;
    const skip = (Number(page) - 1) * Number(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), skip);

    const orders = await AppDataSource.query(sql, params);
    console.log(`📋 [Danh sách đơn hàng] Truy vấn được ${orders.length} đơn hàng, tổng số: ${total}`);

    // Chuyển đổi sang định dạng frontend cần (SQL thuần trả về tên trường dạng gạch dưới)
    const formattedOrders = orders.map((order: Record<string, unknown>) => {
      // Phân tích trường JSON products
      let products: unknown[] = [];
      if (order.products) {
        try {
          products = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
        } catch {
          products = [];
        }
      }

      return {
        id: String(order.id || ''),
        orderNumber: order.order_number || '',
        customerId: String(order.customer_id || ''),
        customerName: order.customer_name || order.customer_name_joined || '',
        customerPhone: order.customer_phone || order.customer_phone_joined || '',
        products: products,
        totalAmount: Number(order.total_amount) || 0,
        depositAmount: Number(order.deposit_amount) || 0,
        collectAmount: Number(order.final_amount) || 0,
        receiverName: order.shipping_name || '',
        receiverPhone: order.shipping_phone || '',
        receiverAddress: order.shipping_address || '',
        remark: order.remark || '',
        status: order.status || 'pending',
        auditStatus: order.audit_status || 'pending',
        markType: order.mark_type || 'normal',
        auditTransferTime: order.audit_transfer_time ? new Date(order.audit_transfer_time as string).toISOString() : '',
        isAuditTransferred: Boolean(order.is_audit_transferred),
        paymentStatus: order.payment_status || 'unpaid',
        paymentMethod: order.payment_method || '',
        createTime: order.created_at ? new Date(order.created_at as string).toISOString() : '',
        createdBy: order.created_by || '',
        salesPersonId: order.created_by || ''
      };
    });

    console.log(`📋 [Danh sách đơn hàng] Trả về ${formattedOrders.length} đơn hàng đã định dạng`);
    res.json({
      success: true,
      data: {
        list: formattedOrders,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('❌ [Danh sách đơn hàng] Lấy thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách đơn hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/orders/:id
 * @desc Lấy chi tiết đơn hàng
 * @access Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({
      where: { id: req.params.id },
      relations: ['customer', 'orderItems', 'statusHistory']
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    // Phân tích trường JSON products
    let products: unknown[] = [];
    if (order.products) {
      try {
        products = typeof order.products === 'string' ? JSON.parse(order.products as string) : order.products;
      } catch {
        products = [];
      }
    }
    // Nếu products rỗng, thử lấy từ orderItems
    if (products.length === 0 && order.orderItems?.length > 0) {
      products = order.orderItems.map(item => ({
        id: item.id.toString(),
        name: item.productName,
        price: Number(item.unitPrice),
        quantity: item.quantity,
        total: Number(item.subtotal)
      }));
    }

    const formattedOrder = {
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      customerId: order.customerId?.toString() || '',
      customerName: order.customerName || order.customer?.name || '',
      customerPhone: order.customerPhone || order.customer?.phone || '',
      products: products,
      totalAmount: Number(order.totalAmount),
      depositAmount: Number(order.depositAmount) || 0,
      collectAmount: Number(order.finalAmount) || 0,
      receiverName: order.shippingName || '',
      receiverPhone: order.shippingPhone || '',
      receiverAddress: order.shippingAddress || '',
      remark: order.remark || '',
      status: order.status,
      auditStatus: order.auditStatus || 'pending',
      markType: order.markType || 'normal',
      auditTransferTime: order.auditTransferTime?.toISOString() || '',
      isAuditTransferred: Boolean(order.isAuditTransferred),
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || '',
      createTime: order.createdAt?.toISOString() || '',
      createdBy: order.createdBy || '',
      salesPersonId: order.createdBy || ''
    };

    res.json({
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy chi tiết đơn hàng thất bại'
    });
  }
});

/**
 * @route POST /api/v1/orders
 * @desc Tạo đơn hàng
 * @access Private
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 [Tạo đơn hàng] Nhận dữ liệu yêu cầu:', JSON.stringify(req.body, null, 2));

    const _orderRepository = AppDataSource.getRepository(Order);
    const _orderItemRepository = AppDataSource.getRepository(OrderItem);

    const {
      customerId,
      customerName,
      customerPhone,
      products,
      totalAmount,
      // subtotal, // Chưa sử dụng
      discount,
      collectAmount,
      depositAmount,
      depositScreenshots,
      depositScreenshot,
      receiverName,
      receiverPhone,
      receiverAddress,
      remark,
      paymentMethod,
      salesPersonId,
      salesPersonName,
      orderNumber,
      serviceWechat,
      orderSource
      // customFields // Chưa sử dụng
    } = req.body;

    // Xác thực dữ liệu
    if (!customerId) {
      console.error('❌ [Tạo đơn hàng] Thiếu ID khách hàng');
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID khách hàng'
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      console.error('❌ [Tạo đơn hàng] Thiếu thông tin sản phẩm');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin sản phẩm'
      });
    }

    // Phân tích ID khách hàng (hỗ trợ chuỗi và số)
    let parsedCustomerId: string = '';
    if (typeof customerId === 'string') {
      // Nếu là định dạng giống "customer_xxx", cần tìm hoặc tạo khách hàng
      if (customerId.startsWith('customer_') || customerId.startsWith('temp_')) {
        console.log('📝 [Tạo đơn hàng] Phát hiện ID khách hàng tạm thời, thử tìm hoặc tạo khách hàng');
        // Thử tìm khách hàng qua số điện thoại
        if (customerPhone) {
          const existingCustomer = await AppDataSource.query(
            'SELECT id FROM customers WHERE phone = ? LIMIT 1',
            [customerPhone]
          );
          if (existingCustomer.length > 0) {
            parsedCustomerId = existingCustomer[0].id;
            console.log('✅ [Tạo đơn hàng] Tìm thấy khách hàng qua số điện thoại:', parsedCustomerId);
          } else {
            // Tạo khách hàng mới - sử dụng UUID
            const { v4: uuidv4 } = await import('uuid');
            const newCustomerId = uuidv4();
            const customerCode = `C${Date.now()}`;
            await AppDataSource.query(
              `INSERT INTO customers (id, customer_code, name, phone, sales_person_id, created_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [newCustomerId, customerCode, customerName || 'Khách hàng chưa xác định', customerPhone, salesPersonId || null, salesPersonId || 'system']
            );
            parsedCustomerId = newCustomerId;
            console.log('✅ [Tạo đơn hàng] Tạo khách hàng mới:', parsedCustomerId);
          }
        } else {
          console.error('❌ [Tạo đơn hàng] ID khách hàng tạm thời nhưng thiếu số điện thoại');
          return res.status(400).json({
            success: false,
            message: 'Thiếu số điện thoại khách hàng'
          });
        }
      } else {
        parsedCustomerId = customerId;
      }
    } else {
      parsedCustomerId = String(customerId);
    }

    if (!parsedCustomerId) {
      console.error('❌ [Tạo đơn hàng] ID khách hàng không hợp lệ:', customerId);
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ'
      });
    }

    // Tạo số đơn hàng (sử dụng số từ frontend hoặc tự động tạo)
    const generatedOrderNumber = orderNumber || `ORD${Date.now()}`;

    // Tính toán số tiền
    const finalTotalAmount = Number(totalAmount) || 0;
    const finalDepositAmount = Number(depositAmount) || 0;
    const finalAmount = finalTotalAmount - (Number(discount) || 0);

    console.log('📝 [Tạo đơn hàng] Chuẩn bị tạo đơn hàng:', {
      orderNumber: generatedOrderNumber,
      customerId: parsedCustomerId,
      totalAmount: finalTotalAmount,
      depositAmount: finalDepositAmount
    });

    // Xử lý ảnh chụp đặt cọc - hỗ trợ một và nhiều ảnh
    let finalDepositScreenshots: string[] = [];
    if (depositScreenshots && Array.isArray(depositScreenshots)) {
      finalDepositScreenshots = depositScreenshots;
    } else if (depositScreenshot) {
      finalDepositScreenshots = [depositScreenshot];
    }

    // Tạo đơn hàng - sử dụng SQL thuần để tránh vấn đề ánh xạ trường TypeORM
    const orderId = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Tính thời gian chuyển tiếp (đơn hàng giao hàng bình thường chuyển tiếp sau 3 phút)
    const markType = req.body.markType || 'normal';
    const auditTransferTime = markType === 'normal'
      ? new Date(Date.now() + 3 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null;

    const insertSql = `INSERT INTO orders (
      id, order_number, customer_id, customer_name, customer_phone,
      service_wechat, order_source, products, status, total_amount,
      discount_amount, final_amount, deposit_amount, deposit_screenshots,
      payment_status, payment_method, shipping_name, shipping_phone,
      shipping_address, express_company, mark_type, audit_status,
      audit_transfer_time, is_audit_transferred, custom_fields,
      remark, created_by, created_by_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertParams = [
      orderId,
      generatedOrderNumber,
      parsedCustomerId,
      customerName || '',
      customerPhone || '',
      serviceWechat || '',
      orderSource || '',
      JSON.stringify(products || []),
      'pending_transfer', // Trạng thái ban đầu là chờ chuyển tiếp
      finalTotalAmount,
      Number(discount) || 0,
      finalAmount,
      finalDepositAmount,
      finalDepositScreenshots.length > 0 ? JSON.stringify(finalDepositScreenshots) : null,
      finalDepositAmount > 0 ? 'partial' : 'unpaid',
      paymentMethod || null,
      receiverName || customerName || '',
      receiverPhone || customerPhone || '',
      receiverAddress || '',
      req.body.expressCompany || '',
      markType,
      'pending', // audit_status
      auditTransferTime, // audit_transfer_time
      markType === 'normal' ? 0 : 1, // is_audit_transferred (đơn hàng dự trữ không cần chuyển tiếp)
      req.body.customFields ? JSON.stringify(req.body.customFields) : null,
      remark || '',
      salesPersonId || '',
      salesPersonName || '',
      now,
      now
    ];

    await AppDataSource.query(insertSql, insertParams);
    console.log('✅ [Tạo đơn hàng] Đơn hàng đã lưu thành công:', orderId);

    const savedOrder = { id: orderId, orderNumber: generatedOrderNumber, customerId: parsedCustomerId };

    // Thông tin sản phẩm đã được lưu trong trường JSON products của bảng orders
    // Không tạo bản ghi order_items riêng nữa, tránh vấn đề ánh xạ trường TypeORM
    console.log('✅ [Tạo đơn hàng] Thông tin sản phẩm đã được lưu trong trường products của đơn hàng');

    // Trả về dữ liệu đơn hàng đầy đủ
    const responseData = {
      id: savedOrder.id.toString(),
      orderNumber: savedOrder.orderNumber,
      customerId: savedOrder.customerId.toString(),
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      products: products,
      totalAmount: finalTotalAmount,
      depositAmount: finalDepositAmount,
      collectAmount: Number(collectAmount) || finalTotalAmount - finalDepositAmount,
      receiverName: receiverName || customerName || '',
      receiverPhone: receiverPhone || customerPhone || '',
      receiverAddress: receiverAddress || '',
      remark: remark || '',
      status: 'pending_transfer',
      auditStatus: 'pending',
      markType: markType,
      auditTransferTime: auditTransferTime,
      isAuditTransferred: markType !== 'normal',
      createTime: now,
      createdBy: salesPersonId || '',
      salesPersonId: salesPersonId || ''
    };

    console.log('✅ [Tạo đơn hàng] Trả về dữ liệu:', responseData);

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: responseData
    });
  } catch (error) {
    const err = error as any;
    console.error('❌ [Tạo đơn hàng] Thất bại:', {
      message: err?.message,
      stack: err?.stack,
      code: err?.code,
      sqlMessage: err?.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: err?.sqlMessage || err?.message || 'Tạo đơn hàng thất bại',
      error: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  }
});

/**
 * @route PUT /api/v1/orders/:id
 * @desc Cập nhật đơn hàng
 * @access Private
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    const updateData = req.body;

    // Cập nhật trường đơn hàng
    if (updateData.status) order.status = updateData.status;
    if (updateData.receiverName || updateData.shippingName) order.shippingName = updateData.receiverName || updateData.shippingName;
    if (updateData.receiverPhone || updateData.shippingPhone) order.shippingPhone = updateData.receiverPhone || updateData.shippingPhone;
    if (updateData.receiverAddress || updateData.shippingAddress) order.shippingAddress = updateData.receiverAddress || updateData.shippingAddress;
    if (updateData.notes !== undefined || updateData.remark !== undefined) order.remark = updateData.notes || updateData.remark;
    if (updateData.paymentStatus) order.paymentStatus = updateData.paymentStatus;
    if (updateData.paymentMethod) order.paymentMethod = updateData.paymentMethod;

    await orderRepository.save(order);

    res.json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Cập nhật đơn hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Cập nhật đơn hàng thất bại'
    });
  }
});

/**
 * @route DELETE /api/v1/orders/:id
 * @desc Xóa đơn hàng
 * @access Private
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    await orderRepository.remove(order);

    res.json({
      success: true,
      message: 'Xóa đơn hàng thành công'
    });
  } catch (error) {
    console.error('Xóa đơn hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Xóa đơn hàng thất bại'
    });
  }
});

/**
 * @route POST /api/v1/orders/:id/submit-audit
 * @desc Gửi đơn hàng để duyệt
 * @access Private
 */
router.post('/:id/submit-audit', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { remark } = req.body;
    const idParam = req.params.id;

    // Hỗ trợ tìm bằng id hoặc số đơn hàng
    let order = await orderRepository.findOne({
      where: { id: idParam }
    });

    // Nếu không tìm thấy bằng id, thử tìm bằng số đơn hàng
    if (!order) {
      order = await orderRepository.findOne({
        where: { orderNumber: idParam }
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    // Cập nhật trạng thái đơn hàng thành chờ duyệt
    order.status = 'confirmed'; // Sử dụng confirmed để biểu thị đã gửi duyệt
    if (remark) {
      order.remark = `${order.remark || ''} | Ghi chú gửi duyệt: ${remark}`;
    }

    await orderRepository.save(order);

    res.json({
      success: true,
      message: 'Đơn hàng đã được gửi để duyệt',
      data: {
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Gửi đơn hàng để duyệt thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Gửi đơn hàng để duyệt thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route POST /api/v1/orders/:id/audit
 * @desc Duyệt đơn hàng
 * @access Private
 */
router.post('/:id/audit', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { action, remark } = req.body;
    const idParam = req.params.id;

    // Hỗ trợ tìm bằng id hoặc số đơn hàng
    let order = await orderRepository.findOne({
      where: { id: idParam }
    });

    // Nếu không tìm thấy bằng id, thử tìm bằng số đơn hàng
    if (!order) {
      order = await orderRepository.findOne({
        where: { orderNumber: idParam }
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    if (action === 'approve') {
      order.status = 'paid'; // Duyệt qua, chuyển sang trạng thái đã thanh toán
      order.remark = `${order.remark || ''} | Duyệt qua: ${remark || ''}`;
    } else {
      order.status = 'pending'; // Từ chối duyệt, trả về chờ xử lý
      order.remark = `${order.remark || ''} | Từ chối duyệt: ${remark || ''}`;
    }

    await orderRepository.save(order);

    res.json({
      success: true,
      message: action === 'approve' ? 'Đơn hàng đã được duyệt' : 'Đơn hàng bị từ chối duyệt',
      data: {
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Duyệt đơn hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Duyệt đơn hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route POST /api/v1/orders/cancel-request
 * @desc Gửi yêu cầu hủy đơn hàng
 * @access Private
 */
router.post('/cancel-request', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { orderId, reason, description } = req.body;

    const order = await orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    // Cập nhật trạng thái đơn hàng thành chờ hủy
    order.status = 'pending'; // Tạm thời sử dụng pending để biểu thị chờ hủy
    order.remark = `Lý do hủy: ${reason}${description ? ` - ${description}` : ''}`;

    await orderRepository.save(order);

    res.json({
      success: true,
      message: 'Yêu cầu hủy đã được gửi'
    });
  } catch (error) {
    console.error('Gửi yêu cầu hủy thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Gửi yêu cầu hủy thất bại'
    });
  }
});

/**
 * @route GET /api/v1/orders/pending-cancel
 * @desc Lấy danh sách đơn hàng hủy chờ duyệt
 * @access Private
 */
router.get('/pending-cancel', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    // Truy vấn đơn hàng có trạng thái pending và remark chứa "Lý do hủy"
    const orders = await orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.status = :status', { status: 'pending' })
      .andWhere('order.remark LIKE :cancelNote', { cancelNote: '%Lý do hủy%' })
      .orderBy('order.updatedAt', 'DESC')
      .getMany();

    const formattedOrders = orders.map(order => ({
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || '',
      totalAmount: Number(order.totalAmount),
      cancelReason: order.remark || '',
      cancelRequestTime: order.updatedAt?.toISOString() || '',
      status: 'pending_cancel',
      createdBy: order.createdBy || ''
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Lấy danh sách đơn hàng hủy chờ duyệt thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách đơn hàng hủy chờ duyệt thất bại'
    });
  }
});

/**
 * @route POST /api/v1/orders/:id/cancel-audit
 * @desc Duyệt yêu cầu hủy đơn hàng
 * @access Private
 */
router.post('/:id/cancel-audit', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { action, remark } = req.body;

    const order = await orderRepository.findOne({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    if (action === 'approve') {
      order.status = 'cancelled';
      order.remark = `${order.remark || ''} | Duyệt qua: ${remark || ''}`;
    } else {
      order.status = 'confirmed'; // Khôi phục về trạng thái đã xác nhận
      order.remark = `${order.remark || ''} | Từ chối duyệt: ${remark || ''}`;
    }

    await orderRepository.save(order);

    res.json({
      success: true,
      message: action === 'approve' ? 'Yêu cầu hủy đã được duyệt' : 'Yêu cầu hủy đã bị từ chối'
    });
  } catch (error) {
    console.error('Duyệt yêu cầu hủy thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Duyệt yêu cầu hủy thất bại'
    });
  }
});

/**
 * @route GET /api/v1/orders/audited-cancel
 * @desc Lấy danh sách đơn hàng hủy đã được duyệt
 * @access Private
 */
router.get('/audited-cancel', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    const orders = await orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.status = :status', { status: 'cancelled' })
      .orderBy('order.updatedAt', 'DESC')
      .getMany();

    const formattedOrders = orders.map(order => ({
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || '',
      totalAmount: Number(order.totalAmount),
      cancelReason: order.remark || '',
      cancelRequestTime: order.updatedAt?.toISOString() || '',
      status: 'cancelled',
      createdBy: order.createdBy || ''
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Lấy danh sách đơn hàng hủy đã được duyệt thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy danh sách đơn hàng hủy đã được duyệt thất bại'
    });
  }
});

/**
 * @route GET /api/v1/orders/statistics
 * @desc Lấy dữ liệu thống kê đơn hàng
 * @access Private
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Số đơn hàng chờ xử lý
    const pendingCount = await orderRepository.count({
      where: { status: 'pending' }
    });

    // Số đơn hàng hôm nay
    const todayCount = await orderRepository.createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .getCount();

    // Số tiền đơn hàng chờ xử lý
    const pendingAmountResult = await orderRepository.createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status = :status', { status: 'pending' })
      .getRawOne();

    res.json({
      success: true,
      data: {
        pendingCount,
        todayCount,
        pendingAmount: Number(pendingAmountResult?.total || 0),
        urgentCount: 0
      }
    });
  } catch (error) {
    console.error('Lấy thống kê đơn hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy thống kê đơn hàng thất bại'
    });
  }
});

/**
 * @route POST /api/v1/orders/check-transfer
 * @desc Kiểm tra và thực hiện chuyển tiếp đơn hàng (chuyển đơn hàng chờ chuyển tiếp đã đến hạn thành chờ duyệt)
 * @access Private
 */
router.post('/check-transfer', async (req: Request, res: Response) => {
  try {
    console.log('🔄 [Chuyển tiếp đơn hàng] Bắt đầu kiểm tra đơn hàng chờ chuyển tiếp...');

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Tìm đơn hàng cần chuyển tiếp:
    // 1. Trạng thái là pending_transfer
    // 2. Loại đánh dấu là normal (đơn hàng giao hàng bình thường)
    // 3. Chưa chuyển tiếp (is_audit_transferred = 0)
    // 4. Thời gian chuyển tiếp đã đến (audit_transfer_time <= now)
    const selectSql = `
      SELECT id, order_number, audit_transfer_time
      FROM orders
      WHERE status = 'pending_transfer'
        AND mark_type = 'normal'
        AND (is_audit_transferred = 0 OR is_audit_transferred IS NULL)
        AND audit_transfer_time IS NOT NULL
        AND audit_transfer_time <= ?
    `;

    const ordersToTransfer = await AppDataSource.query(selectSql, [now]);
    console.log(`🔄 [Chuyển tiếp đơn hàng] Tìm thấy ${ordersToTransfer.length} đơn hàng chờ chuyển tiếp`);

    if (ordersToTransfer.length === 0) {
      return res.json({
        success: true,
        message: 'Không có đơn hàng nào cần chuyển tiếp',
        data: { transferredCount: 0 }
      });
    }

    // Cập nhật trạng thái đơn hàng hàng loạt
    const orderIds = ordersToTransfer.map((o: { id: string }) => o.id);
    const updateSql = `
      UPDATE orders
      SET status = 'pending_audit',
          is_audit_transferred = 1,
          updated_at = ?
      WHERE id IN (${orderIds.map(() => '?').join(',')})
    `;

    await AppDataSource.query(updateSql, [now, ...orderIds]);

    console.log(`✅ [Chuyển tiếp đơn hàng] Đã chuyển tiếp thành công ${ordersToTransfer.length} đơn hàng`);

    res.json({
      success: true,
      message: `Đã chuyển tiếp thành công ${ordersToTransfer.length} đơn hàng`,
      data: {
        transferredCount: ordersToTransfer.length,
        orders: ordersToTransfer.map((o: { id: string; order_number: string }) => ({
          id: o.id,
          orderNumber: o.order_number
        }))
      }
    });
  } catch (error) {
    console.error('❌ [Chuyển tiếp đơn hàng] Kiểm tra chuyển tiếp thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Kiểm tra chuyển tiếp đơn hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route PUT /api/v1/orders/:id/mark-type
 * @desc Cập nhật loại đánh dấu đơn hàng
 * @access Private
 */
router.put('/:id/mark-type', async (req: Request, res: Response) => {
  try {
    const { markType, isAuditTransferred, auditTransferTime, status } = req.body;
    const orderId = req.params.id;

    console.log(`📝 [Đánh dấu đơn hàng] Cập nhật loại đánh dấu đơn hàng ${orderId} thành ${markType}`);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Xây dựng SQL cập nhật
    const updateFields = ['mark_type = ?', 'updated_at = ?'];
    const updateParams: (string | number | null)[] = [markType, now];

    if (isAuditTransferred !== undefined) {
      updateFields.push('is_audit_transferred = ?');
      updateParams.push(isAuditTransferred ? 1 : 0);
    }

    if (auditTransferTime !== undefined) {
      updateFields.push('audit_transfer_time = ?');
      updateParams.push(auditTransferTime || null);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }

    updateParams.push(orderId);

    const updateSql = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
    await AppDataSource.query(updateSql, updateParams);

    console.log(`✅ [Đánh dấu đơn hàng] Đơn hàng ${orderId} đã cập nhật đánh dấu thành công`);

    res.json({
      success: true,
      message: 'Cập nhật đánh dấu đơn hàng thành công',
      data: { id: orderId, markType }
    });
  } catch (error) {
    console.error('❌ [Đánh dấu đơn hàng] Cập nhật thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Cập nhật đánh dấu đơn hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

export default router;
