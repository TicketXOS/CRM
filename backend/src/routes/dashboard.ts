import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { Customer } from '../entities/Customer';
import { User } from '../entities/User';
import { Between, In } from 'typeorm';

const router = Router();

// Tất cả các route bảng điều khiển đều cần xác thực
router.use(authenticateToken);

/**
 * @route GET /api/v1/dashboard/metrics
 * @desc Lấy dữ liệu chỉ số cốt lõi
 * @access Private
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const customerRepository = AppDataSource.getRepository(Customer);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Số đơn hàng hôm nay (loại trừ đã hủy)
    const todayOrders = await orderRepository.count({
      where: {
        createdAt: Between(todayStart, todayEnd)
      }
    });

    // Khách hàng mới hôm nay
    const newCustomers = await customerRepository.count({
      where: {
        createdAt: Between(todayStart, todayEnd)
      }
    });

    // Doanh thu hôm nay
    const todayOrdersData = await orderRepository.find({
      where: {
        createdAt: Between(todayStart, todayEnd)
      },
      select: ['totalAmount', 'status']
    });
    const todayRevenue = todayOrdersData
      .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

    // Số đơn hàng tháng này
    const monthlyOrders = await orderRepository.count({
      where: {
        createdAt: Between(monthStart, todayEnd)
      }
    });

    // Doanh thu tháng này
    const monthlyOrdersData = await orderRepository.find({
      where: {
        createdAt: Between(monthStart, todayEnd)
      },
      select: ['totalAmount', 'status']
    });
    const monthlyRevenue = monthlyOrdersData
      .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

    res.json({
      success: true,
      data: {
        todayOrders,
        newCustomers,
        todayRevenue,
        monthlyOrders,
        monthlyRevenue,
        pendingService: 0
      }
    });
  } catch (error) {
    console.error('Lấy chỉ số cốt lõi thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy chỉ số cốt lõi thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/dashboard/rankings
 * @desc Lấy dữ liệu bảng xếp hạng
 * @access Private
 */
router.get('/rankings', async (_req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const userRepository = AppDataSource.getRepository(User);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Lấy đơn hàng tháng này (loại trừ đã hủy và đã hoàn tiền)
    const monthOrders = await orderRepository.find({
      where: {
        createdAt: Between(monthStart, now)
      },
      select: ['createdBy', 'totalAmount', 'status'],
      relations: ['orderItems']
    });

    // Lọc đơn hàng hợp lệ
    const validOrders = monthOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');

    // Thống kê hiệu suất nhân viên bán hàng
    const salesStats: Record<string, { sales: number; orders: number }> = {};
    validOrders.forEach(order => {
      const createdBy = order.createdBy;
      if (!createdBy) return;

      const createdByStr = String(createdBy);
      if (!salesStats[createdByStr]) {
        salesStats[createdByStr] = { sales: 0, orders: 0 };
      }
      salesStats[createdByStr].sales += Number(order.totalAmount) || 0;
      salesStats[createdByStr].orders += 1;
    });

    // Lấy thông tin người dùng
    const userIds = Object.keys(salesStats);
    const users = userIds.length > 0 ? await userRepository.find({
      where: { id: In(userIds) },
      select: ['id', 'realName', 'username', 'avatar']
    }) : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    // Xây dựng bảng xếp hạng bán hàng
    const salesRankings = Object.entries(salesStats)
      .map(([userIdStr, stats]) => {
        const user = userMap.get(userIdStr);
        return {
          id: userIdStr,
          name: user?.realName || user?.username || '未知用户',
          avatar: user?.avatar || '',
          sales: stats.sales,
          orders: stats.orders,
          growth: 0
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // Thống kê bán hàng sản phẩm (từ các mục đơn hàng)
    const productStats: Record<number, { name: string; sales: number; orders: number; revenue: number }> = {};
    for (const order of validOrders) {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          const productId = item.productId;
          if (!productId) continue;

          if (!productStats[productId]) {
            productStats[productId] = {
              name: item.productName || '未知产品',
              sales: 0,
              orders: 0,
              revenue: 0
            };
          }
          productStats[productId].sales += item.quantity || 0;
          productStats[productId].orders += 1;
          productStats[productId].revenue += Number(item.subtotal) || 0;
        }
      }
    }

    const productRankings = Object.entries(productStats)
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        sales: stats.sales,
        orders: stats.orders,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        sales: salesRankings,
        products: productRankings
      }
    });
  } catch (error) {
    console.error('Lấy dữ liệu bảng xếp hạng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy dữ liệu bảng xếp hạng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/dashboard/charts
 * @desc Lấy dữ liệu biểu đồ
 * @access Private
 */
router.get('/charts', async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { period = 'month' } = req.query;

    const now = new Date();
    const categories: string[] = [];
    const revenueData: number[] = [];
    const ordersData: number[] = [];

    if (period === 'month') {
      // 6 tháng gần đây
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        categories.push(`Tháng ${date.getMonth() + 1}`);

        const monthOrders = await orderRepository.find({
          where: {
            createdAt: Between(date, monthEnd)
          },
          select: ['totalAmount', 'status']
        });

        const validOrders = monthOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
        ordersData.push(validOrders.length);
        revenueData.push(validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0));
      }
    } else if (period === 'week') {
      // 8 tuần gần đây
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

        categories.push(`Tuần ${8 - i}`);

        const weekOrders = await orderRepository.find({
          where: {
            createdAt: Between(weekStart, weekEnd)
          },
          select: ['totalAmount', 'status']
        });

        const validOrders = weekOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
        ordersData.push(validOrders.length);
        revenueData.push(validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0));
      }
    } else {
      // 7 ngày gần đây
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        categories.push(`${date.getMonth() + 1}/${date.getDate()}`);

        const dayOrders = await orderRepository.find({
          where: {
            createdAt: Between(dayStart, dayEnd)
          },
          select: ['totalAmount', 'status']
        });

        const validOrders = dayOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
        ordersData.push(validOrders.length);
        revenueData.push(validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0));
      }
    }

    // Lấy phân bố trạng thái đơn hàng
    const allOrders = await orderRepository.find({
      select: ['status']
    });

    const statusMap: Record<string, { name: string; count: number; color: string }> = {
      pending: { name: 'Chờ xử lý', count: 0, color: '#909399' },
      confirmed: { name: 'Đã xác nhận', count: 0, color: '#409EFF' },
      paid: { name: 'Đã thanh toán', count: 0, color: '#67C23A' },
      shipped: { name: 'Đã giao hàng', count: 0, color: '#E6A23C' },
      delivered: { name: 'Đã giao đến', count: 0, color: '#67C23A' },
      completed: { name: 'Đã hoàn thành', count: 0, color: '#67C23A' },
      cancelled: { name: 'Đã hủy', count: 0, color: '#F56C6C' },
      refunded: { name: 'Đã hoàn tiền', count: 0, color: '#F56C6C' }
    };

    allOrders.forEach(order => {
      if (statusMap[order.status]) {
        statusMap[order.status].count += 1;
      }
    });

    const orderStatus = Object.entries(statusMap)
      .filter(([_, data]) => data.count > 0)
      .map(([_, data]) => ({
        name: data.name,
        value: data.count,
        color: data.color
      }));

    res.json({
      success: true,
      data: {
        performance: {
          categories,
          series: [
            { name: 'Số lượng đơn hàng', data: ordersData },
            { name: 'Doanh thu', data: revenueData }
          ]
        },
        orderStatus
      }
    });
  } catch (error) {
    console.error('Lấy dữ liệu biểu đồ thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy dữ liệu biểu đồ thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/dashboard/todos
 * @desc Lấy dữ liệu công việc cần làm
 * @access Private
 */
router.get('/todos', async (_req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    // Lấy đơn hàng chờ xử lý làm công việc cần làm
    const pendingOrders = await orderRepository.find({
      where: { status: 'pending' },
      take: 10,
      order: { createdAt: 'DESC' }
    });

    const todos = pendingOrders.map(order => ({
      id: String(order.id),
      title: 'Đơn hàng chờ xử lý',
      type: 'order',
      priority: 'high',
      status: 'pending',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Số đơn hàng: ${order.orderNumber}`
    }));

    res.json({
      success: true,
      data: todos
    });
  } catch (error) {
    console.error('Lấy công việc cần làm thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy công việc cần làm thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/dashboard/quick-actions
 * @desc Lấy dữ liệu thao tác nhanh
 * @access Private
 */
router.get('/quick-actions', (_req: Request, res: Response) => {
  const quickActions = [
    {
      key: 'add_customer',
      label: 'Tạo khách hàng mới',
      icon: 'UserPlus',
      color: '#409EFF',
      gradient: 'linear-gradient(135deg, #409EFF 0%, #1890ff 100%)',
      route: '/customer/add',
      description: 'Thêm khách hàng mới nhanh chóng'
    },
    {
      key: 'create_order',
      label: 'Tạo đơn hàng mới',
      icon: 'ShoppingCart',
      color: '#67C23A',
      gradient: 'linear-gradient(135deg, #67C23A 0%, #52c41a 100%)',
      route: '/order/add',
      description: 'Tạo đơn hàng mới cho khách hàng'
    },
    {
      key: 'create_service',
      label: 'Tạo dịch vụ sau bán hàng mới',
      icon: 'CustomerService',
      color: '#F56C6C',
      gradient: 'linear-gradient(135deg, #F56C6C 0%, #ff4d4f 100%)',
      route: '/service/add',
      description: 'Tạo đơn dịch vụ sau bán hàng'
    },
    {
      key: 'order_list',
      label: 'Danh sách đơn hàng',
      icon: 'List',
      color: '#E6A23C',
      gradient: 'linear-gradient(135deg, #E6A23C 0%, #fa8c16 100%)',
      route: '/order/list',
      description: 'Xem danh sách đơn hàng'
    }
  ];

  res.json({
    success: true,
    data: quickActions
  });
});

export default router;
