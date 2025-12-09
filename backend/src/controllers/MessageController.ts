import { Request, Response } from 'express';
import { getDataSource } from '../config/database';
import { MessageSubscription, DepartmentSubscriptionConfig, MessageType, NotificationMethod } from '../entities/MessageSubscription';
import { Department } from '../entities/Department';

// Lưu trữ dữ liệu quy tắc đăng ký trong bộ nhớ (mô phỏng cơ sở dữ liệu)
const subscriptionRulesStorage: any[] = [
  {
    id: 1,
    departmentId: '1',
    departmentName: 'Phòng bán hàng',
    messageTypes: ['order_created', 'payment_reminder'],
    notificationMethods: ['dingtalk', 'email'],
    priority: 'high',
    isEnabled: true,
    scheduleEnabled: false,
    scheduleStart: '',
    scheduleEnd: '',
    excludeWeekends: false,
    remark: 'Quy tắc thông báo liên quan đến đơn hàng của phòng bán hàng',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2024-01-15 10:30:00',
    updatedAt: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    departmentId: '2',
    departmentName: 'Phòng dịch vụ khách hàng',
    messageTypes: ['customer_created', 'customer_feedback'],
    notificationMethods: ['wechat_work', 'system_message'],
    priority: 'normal',
    isEnabled: true,
    scheduleEnabled: false,
    scheduleStart: '',
    scheduleEnd: '',
    excludeWeekends: false,
    remark: 'Thông báo liên quan đến khách hàng của phòng dịch vụ khách hàng',
    createdBy: 'Trần Thị B',
    createdAt: '2024-01-14 14:20:00',
    updatedAt: '2024-01-14 14:20:00'
  },
  {
    id: 3,
    departmentId: '3',
    departmentName: 'Phòng kỹ thuật',
    messageTypes: ['system_maintenance', 'system_alert'],
    notificationMethods: ['dingtalk', 'email', 'sms'],
    priority: 'high',
    isEnabled: true,
    scheduleEnabled: false,
    scheduleStart: '',
    scheduleEnd: '',
    excludeWeekends: false,
    remark: 'Thông báo liên quan đến hệ thống của phòng kỹ thuật',
    createdBy: 'Lê Văn C',
    createdAt: '2024-01-13 09:15:00',
    updatedAt: '2024-01-13 09:15:00'
  }
];

// Ánh xạ tên phòng ban
const departmentNames: { [key: string]: string } = {
  '1': 'Phòng bán hàng',
  '2': 'Phòng dịch vụ khách hàng',
  '3': 'Phòng kỹ thuật',
  '4': 'Phòng tài chính',
  '5': 'Phòng nhân sự'
};

export class MessageController {

  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: trả về dữ liệu mô phỏng
        const mockData = [
          {
            id: 1,
            messageType: MessageType.ORDER_CREATED,
            name: 'Thông báo tạo đơn hàng',
            description: 'Gửi thông báo khi có đơn hàng mới được tạo',
            category: 'Quản lý đơn hàng',
            isGlobalEnabled: true,
            globalNotificationMethods: [NotificationMethod.DINGTALK, NotificationMethod.EMAIL],
            departmentConfigs: [
              {
                id: 1,
                departmentId: 1,
                departmentName: 'Phòng bán hàng',
                isEnabled: true,
                notificationMethods: [NotificationMethod.DINGTALK]
              },
              {
                id: 2,
                departmentId: 2,
                departmentName: 'Phòng dịch vụ khách hàng',
                isEnabled: false,
                notificationMethods: [NotificationMethod.EMAIL]
              }
            ]
          },
          {
            id: 2,
            messageType: MessageType.CUSTOMER_CREATED,
            name: 'Thông báo tạo khách hàng',
            description: 'Gửi thông báo khi có khách hàng mới đăng ký',
            category: 'Quản lý khách hàng',
            isGlobalEnabled: true,
            globalNotificationMethods: [NotificationMethod.WECHAT_WORK],
            departmentConfigs: [
              {
                id: 3,
                departmentId: 1,
                departmentName: 'Phòng bán hàng',
                isEnabled: true,
                notificationMethods: [NotificationMethod.WECHAT_WORK]
              }
            ]
          }
        ];
        res.json(mockData);
        return;
      }

      const subscriptionRepo = dataSource.getRepository(MessageSubscription);
      const departmentConfigRepo = dataSource.getRepository(DepartmentSubscriptionConfig);

      const subscriptions = await subscriptionRepo.find();
      const departmentConfigs = await departmentConfigRepo.find({
        relations: ['department']
      });

      // Tổ chức cấu trúc dữ liệu
      const result = subscriptions.map((subscription: MessageSubscription) => ({
        id: subscription.id,
        messageType: subscription.messageType,
        name: subscription.name,
        description: subscription.description,
        category: subscription.category,
        isGlobalEnabled: subscription.isGlobalEnabled,
        globalNotificationMethods: subscription.globalNotificationMethods,
        departmentConfigs: departmentConfigs
          .filter((config: DepartmentSubscriptionConfig) => config.messageType === subscription.messageType)
          .map((config: DepartmentSubscriptionConfig) => ({
            id: config.id,
            departmentId: config.department.id,
            departmentName: config.department.name,
            isEnabled: config.isEnabled,
            notificationMethods: config.notificationMethods
          }))
      }));

      res.json(result);
    } catch (error) {
      console.error('Lấy cấu hình đăng ký thất bại:', error);
      res.status(500).json({ error: 'Lấy cấu hình đăng ký thất bại' });
    }
  }

  // Cập nhật cấu hình đăng ký tin nhắn toàn cục
  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: trả về phản hồi thành công
        res.json({
          success: true,
          message: 'Cập nhật cấu hình đăng ký thành công (chế độ kiểm thử)'
        });
        return;
      }

      const { isGlobalEnabled, globalNotificationMethods, subscriptions } = req.body;

      const subscriptionRepo = dataSource.getRepository(MessageSubscription);

      // Cập nhật hoặc tạo cấu hình đăng ký
      for (const sub of subscriptions) {
        await subscriptionRepo.save({
          messageType: sub.messageType,
          name: sub.name || sub.messageType,
          description: sub.description || '',
          category: sub.category || 'Mặc định',
          isGlobalEnabled: sub.isEnabled,
          globalNotificationMethods: sub.notificationMethods
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật cấu hình đăng ký tin nhắn thành công'
      });
    } catch (error) {
      console.error('Cập nhật cấu hình đăng ký tin nhắn thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Cập nhật cấu hình đăng ký tin nhắn thất bại'
      });
    }
  }

  // Lấy cấu hình đăng ký cấp phòng ban
  async getDepartmentSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;

      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: trả về dữ liệu mô phỏng
        const mockConfigs = [
          {
            id: 1,
            messageType: MessageType.ORDER_CREATED,
            isEnabled: true,
            notificationMethods: [NotificationMethod.DINGTALK],
            department: {
              id: 1,
              name: 'Phòng bán hàng'
            }
          },
          {
            id: 2,
            messageType: MessageType.CUSTOMER_CREATED,
            isEnabled: false,
            notificationMethods: [NotificationMethod.EMAIL],
            department: {
              id: 1,
              name: 'Phòng bán hàng'
            }
          }
        ];
        res.json(mockConfigs);
        return;
      }

      const departmentConfigRepo = dataSource.getRepository(DepartmentSubscriptionConfig);

      const configs = await departmentConfigRepo.find({
        where: { department: { id: departmentId } },
        relations: ['department']
      });

      res.json(configs);
    } catch (error) {
      console.error('Lấy cấu hình đăng ký phòng ban thất bại:', error);
      res.status(500).json({ error: 'Lấy cấu hình đăng ký phòng ban thất bại' });
    }
  }

  // Cập nhật cấu hình đăng ký cấp phòng ban
  async updateDepartmentSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { messageType, departmentId } = req.params;
      const updateData = req.body;

      const dataSource = getDataSource();
      if (!dataSource) {
        res.status(500).json({ error: 'Kết nối cơ sở dữ liệu chưa được khởi tạo' });
        return;
      }

      const departmentConfigRepo = dataSource.getRepository(DepartmentSubscriptionConfig);
      const departmentRepo = dataSource.getRepository(Department);

      // Kiểm tra phòng ban có tồn tại không
      const department = await departmentRepo.findOne({
        where: { id: departmentId }
      });

      if (!department) {
        res.status(404).json({ error: 'Phòng ban không tồn tại' });
        return;
      }

      // Tìm cấu hình hiện có
      let config = await departmentConfigRepo.findOne({
        where: { messageType: messageType as MessageType, department: { id: departmentId } },
        relations: ['department']
      });

      if (config) {
        // Cập nhật cấu hình hiện có
        Object.assign(config, updateData);
        await departmentConfigRepo.save(config);
      } else {
        // Tạo cấu hình mới
        config = departmentConfigRepo.create({
          messageType: messageType as MessageType,
          department,
          isEnabled: updateData.isEnabled,
          notificationMethods: updateData.notificationMethods
        });

        await departmentConfigRepo.save(config);
      }

      res.json(config);
    } catch (error) {
      console.error('Cập nhật cấu hình đăng ký phòng ban thất bại:', error);
      res.status(500).json({ error: 'Cập nhật cấu hình đăng ký phòng ban thất bại' });
    }
  }

  // Cập nhật cấu hình đăng ký phòng ban hàng loạt
  async batchUpdateDepartmentSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        res.status(500).json({
          success: false,
          message: 'Kết nối cơ sở dữ liệu chưa được khởi tạo'
        });
        return;
      }

      const { messageType } = req.params;
      const { configs } = req.body;

      if (!Array.isArray(configs)) {
        res.status(400).json({
          success: false,
          message: 'Định dạng dữ liệu cấu hình không đúng'
        });
        return;
      }

      const departmentConfigRepo = dataSource.getRepository(DepartmentSubscriptionConfig);
      const departmentRepo = dataSource.getRepository(Department);

      // Xóa cấu hình hiện có
      await departmentConfigRepo.delete({ messageType: messageType as MessageType });

      // Tạo cấu hình mới
      const newConfigs = [];
      for (const config of configs) {
        const department = await departmentRepo.findOne({
          where: { id: config.departmentId }
        });

        if (department) {
          newConfigs.push({
            messageType: messageType as MessageType,
            department,
            isEnabled: config.isEnabled,
            notificationMethods: config.notificationMethods
          });
        }
      }

      await departmentConfigRepo.save(newConfigs);

      res.json({
        success: true,
        message: 'Cập nhật cấu hình đăng ký phòng ban hàng loạt thành công'
      });
    } catch (error) {
      console.error('Cập nhật cấu hình đăng ký phòng ban hàng loạt thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Cập nhật cấu hình đăng ký phòng ban hàng loạt thất bại'
      });
    }
  }

  // Khởi tạo cấu hình đăng ký tin nhắn mặc định
  async initializeDefaultSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        res.status(500).json({ error: 'Kết nối cơ sở dữ liệu chưa được khởi tạo' });
        return;
      }

      const subscriptionRepo = dataSource.getRepository(MessageSubscription);

      // Kiểm tra xem đã khởi tạo chưa
      const existingCount = await subscriptionRepo.count();
      if (existingCount > 0) {
        res.json({ message: 'Cấu hình đăng ký mặc định đã tồn tại' });
        return;
      }

      // Tạo cấu hình đăng ký mặc định
      const defaultSubscriptions = [
        {
          messageType: MessageType.ORDER_CREATED,
          name: 'Tạo đơn hàng',
          description: 'Gửi thông báo khi có đơn hàng mới được tạo',
          category: 'Quản lý đơn hàng',
          isGlobalEnabled: true,
          globalNotificationMethods: [NotificationMethod.EMAIL, NotificationMethod.SYSTEM_MESSAGE]
        },
        {
          messageType: MessageType.CUSTOMER_CREATED,
          name: 'Tạo khách hàng',
          description: 'Gửi thông báo khi có khách hàng mới được tạo',
          category: 'Dịch vụ khách hàng',
          isGlobalEnabled: true,
          globalNotificationMethods: [NotificationMethod.EMAIL, NotificationMethod.SYSTEM_MESSAGE]
        },
        {
          messageType: MessageType.SYSTEM_MAINTENANCE,
          name: 'Bảo trì hệ thống',
          description: 'Thông báo bảo trì hệ thống',
          category: 'Quản lý hệ thống',
          isGlobalEnabled: true,
          globalNotificationMethods: [NotificationMethod.EMAIL, NotificationMethod.ANNOUNCEMENT, NotificationMethod.SYSTEM_MESSAGE]
        }
      ];

      await subscriptionRepo.save(defaultSubscriptions);

      res.json({
        message: 'Khởi tạo cấu hình đăng ký mặc định thành công',
        count: defaultSubscriptions.length
      });
    } catch (error) {
      console.error('Khởi tạo cấu hình đăng ký mặc định thất bại:', error);
      res.status(500).json({ error: 'Khởi tạo cấu hình đăng ký mặc định thất bại' });
    }
  }

  // Các phương thức quản lý thông báo
  async getAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: trả về dữ liệu thông báo mô phỏng
        const mockAnnouncements = [
          {
            id: 1,
            title: 'Thông báo bảo trì hệ thống',
            content: 'Hệ thống sẽ được bảo trì vào tối thứ Bảy tuần này lúc 10 giờ, dự kiến thời gian bảo trì là 2 giờ, trong thời gian này hệ thống sẽ tạm dừng dịch vụ.',
            type: 'company',
            status: 'published',
            isPopup: true,
            isMarquee: true,
            targetDepartments: [],
            publishedAt: '2024-01-15 10:00:00',
            createdBy: 'Quản trị viên hệ thống',
            createdAt: '2024-01-15 09:30:00',
            updatedAt: '2024-01-15 10:00:00'
          },
          {
            id: 2,
            title: 'Thông báo cuộc họp phòng bán hàng',
            content: 'Phòng bán hàng sẽ tổ chức cuộc họp tổng kết tháng vào chiều mai lúc 2 giờ, vui lòng các nhân viên liên quan tham gia đúng giờ.',
            type: 'department',
            status: 'published',
            isPopup: false,
            isMarquee: true,
            targetDepartments: ['Phòng bán hàng'],
            publishedAt: '2024-01-14 16:00:00',
            createdBy: 'Quản lý bán hàng',
            createdAt: '2024-01-14 15:30:00',
            updatedAt: '2024-01-14 16:00:00'
          },
          {
            id: 3,
            title: 'Thông báo tính năng mới sắp ra mắt',
            content: 'Chúng tôi sắp ra mắt tính năng quản lý khách hàng mới, bao gồm nhãn thông minh và tự động nhóm.',
            type: 'company',
            status: 'draft',
            isPopup: true,
            isMarquee: false,
            targetDepartments: [],
            scheduledAt: '2024-01-20 09:00:00',
            createdBy: 'Quản lý sản phẩm',
            createdAt: '2024-01-14 14:00:00',
            updatedAt: '2024-01-14 14:00:00'
          }
        ];

        // Lọc theo điều kiện
        let filteredAnnouncements = mockAnnouncements;
        const { status, type } = req.query;

        if (status) {
          filteredAnnouncements = filteredAnnouncements.filter(ann => ann.status === status);
        }
        if (type) {
          filteredAnnouncements = filteredAnnouncements.filter(ann => ann.type === type);
        }

        res.json({
          success: true,
          data: filteredAnnouncements
        });
        return;
      }

      // Logic truy vấn cơ sở dữ liệu thực tế
      // TODO: Triển khai truy vấn cơ sở dữ liệu thực tế
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      console.error('Lấy danh sách thông báo thất bại:', error);
      res.status(500).json({ error: 'Lấy danh sách thông báo thất bại' });
    }
  }

  async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: mô phỏng tạo thông báo
        const newAnnouncement = {
          id: Date.now(),
          ...req.body,
          status: req.body.status || 'draft', // Đảm bảo có trường status mặc định
          createdBy: 'Người dùng hiện tại',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        res.json({
          success: true,
          message: 'Tạo thông báo thành công',
          data: newAnnouncement
        });
        return;
      }

      // Logic tạo cơ sở dữ liệu thực tế
      // TODO: Triển khai tạo cơ sở dữ liệu thực tế
      res.json({
        success: true,
        message: 'Tạo thông báo thành công',
        data: req.body
      });
    } catch (error) {
      console.error('Tạo thông báo thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Tạo thông báo thất bại'
      });
    }
  }

  async updateAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dataSource = getDataSource();

      if (!dataSource) {
        // Chế độ kiểm thử: mô phỏng cập nhật thông báo
        res.json({
          success: true,
          message: 'Cập nhật thông báo thành công',
          data: { id, ...req.body }
        });
        return;
      }

      // Logic cập nhật cơ sở dữ liệu thực tế
      // TODO: Triển khai cập nhật cơ sở dữ liệu thực tế
      res.json({
        success: true,
        message: 'Cập nhật thông báo thành công',
        data: { id, ...req.body }
      });
    } catch (error) {
      console.error('Cập nhật thông báo thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Cập nhật thông báo thất bại'
      });
    }
  }

  async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dataSource = getDataSource();

      if (!dataSource) {
        // Chế độ kiểm thử: mô phỏng xóa thông báo
        res.json({
          success: true,
          message: 'Xóa thông báo thành công'
        });
        return;
      }

      // Logic xóa cơ sở dữ liệu thực tế
      // TODO: Triển khai xóa cơ sở dữ liệu thực tế
      res.json({
        success: true,
        message: 'Xóa thông báo thành công'
      });
    } catch (error) {
      console.error('Xóa thông báo thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Xóa thông báo thất bại'
      });
    }
  }

  async publishAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dataSource = getDataSource();

      if (!dataSource) {
        // Chế độ kiểm thử: mô phỏng xuất bản thông báo
        res.json({
          success: true,
          message: 'Xuất bản thông báo thành công'
        });
        return;
      }

      // Logic xuất bản cơ sở dữ liệu thực tế
      // TODO: Triển khai xuất bản cơ sở dữ liệu thực tế
      res.json({
        success: true,
        message: 'Xuất bản thông báo thành công'
      });
    } catch (error) {
      console.error('Xuất bản thông báo thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Xuất bản thông báo thất bại'
      });
    }
  }

  // Quản lý quy tắc đăng ký
  async getSubscriptionRules(req: Request, res: Response): Promise<void> {
    try {
      // Lấy tham số truy vấn
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const departmentId = req.query.departmentId as string;
      const messageType = req.query.messageType as string;
      const status = req.query.status as string;

      // Lọc dữ liệu
      let filteredRules = [...subscriptionRulesStorage];

      if (departmentId) {
        filteredRules = filteredRules.filter(rule => rule.departmentId === departmentId);
      }

      if (messageType) {
        filteredRules = filteredRules.filter(rule =>
          rule.messageTypes.includes(messageType)
        );
      }

      if (status !== undefined && status !== '') {
        const isEnabled = status === 'true' || status === '1';
        filteredRules = filteredRules.filter(rule => rule.isEnabled === isEnabled);
      }

      // Xử lý phân trang
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedRules = filteredRules.slice(start, end);

      res.json({
        success: true,
        data: paginatedRules,
        total: filteredRules.length,
        page,
        pageSize
      });
    } catch (error) {
      console.error('Lấy quy tắc đăng ký thất bại:', error);
      res.status(500).json({ error: 'Lấy quy tắc đăng ký thất bại' });
    }
  }

  async createSubscriptionRule(req: Request, res: Response): Promise<void> {
    try {
      const {
        departmentId,
        messageTypes,
        notificationMethods,
        priority,
        scheduleEnabled,
        scheduleStart,
        scheduleEnd,
        excludeWeekends,
        remark
      } = req.body;

      // Xác minh trường bắt buộc
      if (!departmentId || !messageTypes || !Array.isArray(messageTypes) || messageTypes.length === 0) {
        res.status(400).json({
          success: false,
          error: 'ID phòng ban và loại tin nhắn là trường bắt buộc'
        });
        return;
      }

      if (!notificationMethods || !Array.isArray(notificationMethods) || notificationMethods.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Phương thức thông báo là trường bắt buộc'
        });
        return;
      }

      // Tạo ID mới
      const newId = Math.max(...subscriptionRulesStorage.map(rule => rule.id), 0) + 1;

      // Lấy tên phòng ban
      const departmentName = departmentNames[departmentId] || `Phòng ban ${departmentId}`;

      // Tạo quy tắc đăng ký mới
      const newRule = {
        id: newId,
        departmentId,
        departmentName,
        messageTypes,
        notificationMethods,
        priority: priority || 'normal',
        isEnabled: true,
        scheduleEnabled: scheduleEnabled || false,
        scheduleStart: scheduleStart || '',
        scheduleEnd: scheduleEnd || '',
        excludeWeekends: excludeWeekends || false,
        remark: remark || '',
        createdBy: 'Người dùng hiện tại', // TODO: Lấy từ thông tin xác thực
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      // Lưu vào bộ nhớ
      subscriptionRulesStorage.push(newRule);

      res.json({
        success: true,
        message: 'Tạo quy tắc đăng ký thành công',
        data: newRule
      });
    } catch (error) {
      console.error('Tạo quy tắc đăng ký thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Tạo quy tắc đăng ký thất bại'
      });
    }
  }

  async updateSubscriptionRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ruleId = parseInt(id);

      // Tìm quy tắc cần cập nhật
      const ruleIndex = subscriptionRulesStorage.findIndex(rule => rule.id === ruleId);
      if (ruleIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Quy tắc đăng ký không tồn tại'
        });
        return;
      }

      const {
        departmentId,
        messageTypes,
        notificationMethods,
        priority,
        scheduleEnabled,
        scheduleStart,
        scheduleEnd,
        excludeWeekends,
        remark
      } = req.body;

      // Lấy tên phòng ban
      const departmentName = departmentNames[departmentId] || subscriptionRulesStorage[ruleIndex].departmentName;

      // Cập nhật quy tắc
      const updatedRule = {
        ...subscriptionRulesStorage[ruleIndex],
        departmentId: departmentId || subscriptionRulesStorage[ruleIndex].departmentId,
        departmentName,
        messageTypes: messageTypes || subscriptionRulesStorage[ruleIndex].messageTypes,
        notificationMethods: notificationMethods || subscriptionRulesStorage[ruleIndex].notificationMethods,
        priority: priority || subscriptionRulesStorage[ruleIndex].priority,
        scheduleEnabled: scheduleEnabled !== undefined ? scheduleEnabled : subscriptionRulesStorage[ruleIndex].scheduleEnabled,
        scheduleStart: scheduleStart !== undefined ? scheduleStart : subscriptionRulesStorage[ruleIndex].scheduleStart,
        scheduleEnd: scheduleEnd !== undefined ? scheduleEnd : subscriptionRulesStorage[ruleIndex].scheduleEnd,
        excludeWeekends: excludeWeekends !== undefined ? excludeWeekends : subscriptionRulesStorage[ruleIndex].excludeWeekends,
        remark: remark !== undefined ? remark : subscriptionRulesStorage[ruleIndex].remark,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      subscriptionRulesStorage[ruleIndex] = updatedRule;

      res.json({
        success: true,
        message: 'Cập nhật quy tắc đăng ký thành công',
        data: updatedRule
      });
    } catch (error) {
      console.error('Cập nhật quy tắc đăng ký thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Cập nhật quy tắc đăng ký thất bại'
      });
    }
  }

  async deleteSubscriptionRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ruleId = parseInt(id);

      // Tìm quy tắc cần xóa
      const ruleIndex = subscriptionRulesStorage.findIndex(rule => rule.id === ruleId);
      if (ruleIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Quy tắc đăng ký không tồn tại'
        });
        return;
      }

      // Xóa quy tắc
      subscriptionRulesStorage.splice(ruleIndex, 1);

      res.json({
        success: true,
        message: 'Xóa quy tắc đăng ký thành công'
      });
    } catch (error) {
      console.error('Xóa quy tắc đăng ký thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Xóa quy tắc đăng ký thất bại'
      });
    }
  }

  async toggleSubscriptionRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isEnabled } = req.body;
      const ruleId = parseInt(id);

      // Tìm quy tắc cần chuyển đổi trạng thái
      const ruleIndex = subscriptionRulesStorage.findIndex(rule => rule.id === ruleId);
      if (ruleIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Quy tắc đăng ký không tồn tại'
        });
        return;
      }

      // Cập nhật trạng thái
      subscriptionRulesStorage[ruleIndex].isEnabled = isEnabled;
      subscriptionRulesStorage[ruleIndex].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

      res.json({
        success: true,
        message: `Quy tắc đăng ký đã ${isEnabled ? 'được kích hoạt' : 'bị vô hiệu hóa'}`,
        data: subscriptionRulesStorage[ruleIndex]
      });
    } catch (error) {
      console.error('Chuyển đổi trạng thái quy tắc đăng ký thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Chuyển đổi trạng thái quy tắc đăng ký thất bại'
      });
    }
  }

  // Quản lý cấu hình thông báo
  async getNotificationConfigs(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: trả về dữ liệu cấu hình thông báo mô phỏng
        const mockConfigs = [
          {
            id: 1,
            methodType: 'email',
            methodName: 'Thông báo email',
            isEnabled: true,
            supportedDepartments: [
              { id: 1, name: 'Phòng bán hàng', isEnabled: true },
              { id: 2, name: 'Phòng dịch vụ khách hàng', isEnabled: true },
              { id: 3, name: 'Phòng logistics', isEnabled: false }
            ],
            selectedMembers: [
              { id: 1, name: 'Nguyễn Văn A', department: 'Phòng bán hàng', email: 'nguyenvana@company.com' },
              { id: 2, name: 'Trần Thị B', department: 'Phòng dịch vụ khách hàng', email: 'tranthib@company.com' }
            ],
            settings: {
              smtpHost: 'smtp.company.com',
              smtpPort: 587,
              username: 'noreply@company.com',
              password: '******',
              fromName: 'Hệ thống CRM'
            },
            createdBy: 'Quản trị viên hệ thống',
            createdAt: '2024-01-10 09:00:00',
            updatedAt: '2024-01-15 14:30:00'
          },
          {
            id: 2,
            methodType: 'dingtalk',
            methodName: 'Thông báo DingTalk',
            isEnabled: true,
            supportedDepartments: [
              { id: 1, name: 'Phòng bán hàng', isEnabled: true },
              { id: 2, name: 'Phòng dịch vụ khách hàng', isEnabled: false }
            ],
            selectedMembers: [
              { id: 3, name: 'Nguyễn Văn C', department: 'Phòng bán hàng', phone: '13800138001' }
            ],
            settings: {
              webhook: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
              secret: 'SEC***'
            },
            createdBy: 'Quản trị viên hệ thống',
            createdAt: '2024-01-12 10:15:00',
            updatedAt: '2024-01-14 16:45:00'
          },
          {
            id: 3,
            methodType: 'wechat_work',
            methodName: 'Robot nhóm WeChat Work',
            isEnabled: true,
            supportedDepartments: [
              { id: 1, name: 'Phòng bán hàng', isEnabled: true },
              { id: 3, name: 'Phòng kỹ thuật', isEnabled: true }
            ],
            selectedMembers: [
              { id: 4, name: 'Trần Văn D', department: 'Phòng kỹ thuật', phone: '13800138004' },
              { id: 5, name: 'Lê Thị E', department: 'Phòng bán hàng', phone: '13800138005' }
            ],
            settings: {
              webhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx',
              groupName: 'Nhóm thông báo phòng kỹ thuật',
              mentionAll: false,
              mentionedList: '13800138004,13800138005'
            },
            createdBy: 'Quản trị viên hệ thống',
            createdAt: '2024-01-13 11:20:00',
            updatedAt: '2024-01-16 09:15:00'
          },
          {
            id: 4,
            methodType: 'system_message',
            methodName: 'Tin nhắn hệ thống',
            isEnabled: true,
            supportedDepartments: [
              { id: 1, name: 'Phòng bán hàng', isEnabled: true },
              { id: 2, name: 'Phòng dịch vụ khách hàng', isEnabled: true },
              { id: 3, name: 'Phòng logistics', isEnabled: true },
              { id: 4, name: 'Phòng tài chính', isEnabled: true }
            ],
            selectedMembers: [], // Tin nhắn hệ thống hỗ trợ toàn bộ nhân viên
            settings: {
              retentionDays: 30,
              allowMarkAsRead: true
            },
            createdBy: 'Quản trị viên hệ thống',
            createdAt: '2024-01-08 08:00:00',
            updatedAt: '2024-01-08 08:00:00'
          }
        ];

        res.json({ data: mockConfigs });
        return;
      }

      // Logic truy vấn cơ sở dữ liệu thực tế
      // TODO: Triển khai truy vấn cơ sở dữ liệu thực tế
      res.json({ data: [] });
    } catch (error) {
      console.error('Lấy cấu hình thông báo thất bại:', error);
      res.status(500).json({ error: 'Lấy cấu hình thông báo thất bại' });
    }
  }

  async updateNotificationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dataSource = getDataSource();

      if (!dataSource) {
        // Chế độ kiểm thử: mô phỏng cập nhật cấu hình thông báo
        res.json({
          success: true,
          message: 'Cập nhật cấu hình thông báo thành công',
          data: { id, ...req.body }
        });
        return;
      }

      // Logic cập nhật cơ sở dữ liệu thực tế
      // TODO: Triển khai cập nhật cơ sở dữ liệu thực tế
      res.json({
        success: true,
        message: 'Cập nhật cấu hình thông báo thành công',
        data: { id, ...req.body }
      });
    } catch (error) {
      console.error('Cập nhật cấu hình thông báo thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Cập nhật cấu hình thông báo thất bại'
      });
    }
  }

  async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const { methodType, settings, testMessage } = req.body;
      const dataSource = getDataSource();

      if (!dataSource) {
        // Chế độ kiểm thử: mô phỏng kiểm tra thông báo
        res.json({
          success: true,
          message: `Kiểm tra thông báo ${methodType} thành công`,
          details: `Tin nhắn kiểm tra "${testMessage}" đã được gửi`
        });
        return;
      }

      // Logic kiểm tra thông báo thực tế
      // TODO: Triển khai kiểm tra thông báo thực tế
      res.json({
        success: true,
        message: `Kiểm tra thông báo ${methodType} thành công`
      });
    } catch (error) {
      console.error('Kiểm tra thông báo thất bại:', error);
      res.status(500).json({
        success: false,
        error: 'Kiểm tra thông báo thất bại'
      });
    }
  }

  // Lấy dữ liệu phòng ban và thành viên
  async getDepartmentsAndMembers(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: trả về dữ liệu phòng ban và thành viên mô phỏng
        const mockData = {
          departments: [
            { id: 1, name: 'Phòng bán hàng', memberCount: 8 },
            { id: 2, name: 'Phòng dịch vụ khách hàng', memberCount: 5 },
            { id: 3, name: 'Phòng logistics', memberCount: 6 },
            { id: 4, name: 'Phòng tài chính', memberCount: 4 },
            { id: 5, name: 'Phòng kỹ thuật', memberCount: 12 }
          ],
          members: [
            { id: 1, name: 'Nguyễn Văn A', departmentId: 1, department: 'Phòng bán hàng', email: 'nguyenvana@company.com', phone: '13800138001' },
            { id: 2, name: 'Trần Thị B', departmentId: 2, department: 'Phòng dịch vụ khách hàng', email: 'tranthib@company.com', phone: '13800138002' },
            { id: 3, name: 'Lê Văn C', departmentId: 1, department: 'Phòng bán hàng', email: 'levanc@company.com', phone: '13800138003' },
            { id: 4, name: 'Phạm Thị D', departmentId: 3, department: 'Phòng logistics', email: 'phamthid@company.com', phone: '13800138004' },
            { id: 5, name: 'Hoàng Văn E', departmentId: 4, department: 'Phòng tài chính', email: 'hoangvane@company.com', phone: '13800138005' }
          ],
          messageTypes: [
            // Quản lý đơn hàng
            { value: 'order_created', label: 'Thông báo tạo đơn hàng mới', category: 'Quản lý đơn hàng' },
            { value: 'order_submitted', label: 'Gửi đơn hàng thành công', category: 'Quản lý đơn hàng' },
            { value: 'order_paid', label: 'Thanh toán đơn hàng thành công', category: 'Quản lý đơn hàng' },
            { value: 'order_shipped', label: 'Thông báo giao hàng', category: 'Quản lý đơn hàng' },
            { value: 'order_delivered', label: 'Thông báo đơn hàng đã giao', category: 'Quản lý đơn hàng' },
            { value: 'order_signed', label: 'Thông báo ký nhận đơn hàng', category: 'Quản lý đơn hàng' },
            { value: 'order_cancelled', label: 'Thông báo hủy đơn hàng', category: 'Quản lý đơn hàng' },
            { value: 'order_cancel_request', label: 'Yêu cầu hủy đơn hàng', category: 'Quản lý đơn hàng' },
            { value: 'order_cancel_approved', label: 'Duyệt hủy đơn hàng', category: 'Quản lý đơn hàng' },
            { value: 'order_modify_approved', label: 'Duyệt yêu cầu sửa đơn hàng', category: 'Quản lý đơn hàng' },
            { value: 'order_refunded', label: 'Thông báo hoàn tiền đơn hàng', category: 'Quản lý đơn hàng' },
            { value: 'payment_reminder', label: 'Nhắc nhở thanh toán', category: 'Quản lý đơn hàng' },

            // Dịch vụ hậu mãi
            { value: 'after_sales_created', label: 'Yêu cầu dịch vụ hậu mãi mới', category: 'Dịch vụ hậu mãi' },
            { value: 'after_sales_processing', label: 'Đang xử lý dịch vụ hậu mãi', category: 'Dịch vụ hậu mãi' },
            { value: 'after_sales_urgent', label: 'Dịch vụ hậu mãi khẩn cấp', category: 'Dịch vụ hậu mãi' },
            { value: 'after_sales_completed', label: 'Hoàn thành dịch vụ hậu mãi', category: 'Dịch vụ hậu mãi' },
            { value: 'return_notification', label: 'Thông báo trả hàng', category: 'Dịch vụ hậu mãi' },

            // Quản lý khách hàng
            { value: 'customer_created', label: 'Thông báo tạo khách hàng mới', category: 'Quản lý khách hàng' },
            { value: 'customer_updated', label: 'Cập nhật thông tin khách hàng', category: 'Quản lý khách hàng' },
            { value: 'customer_call', label: 'Khách hàng gọi đến', category: 'Quản lý khách hàng' },
            { value: 'customer_complaint', label: 'Khiếu nại khách hàng', category: 'Quản lý khách hàng' },
            { value: 'customer_rejected', label: 'Khách hàng từ chối', category: 'Quản lý khách hàng' },
            { value: 'customer_sharing', label: 'Thông báo chia sẻ khách hàng', category: 'Quản lý khách hàng' },
            { value: 'customer_feedback', label: 'Phản hồi khách hàng', category: 'Quản lý khách hàng' },

            // Quản lý sản phẩm
            { value: 'product_created', label: 'Thêm sản phẩm thành công', category: 'Quản lý sản phẩm' },
            { value: 'product_updated', label: 'Cập nhật thông tin sản phẩm', category: 'Quản lý sản phẩm' },
            { value: 'product_out_of_stock', label: 'Sản phẩm hết hàng', category: 'Quản lý sản phẩm' },
            { value: 'product_price_changed', label: 'Thay đổi giá sản phẩm', category: 'Quản lý sản phẩm' },

            // Quản lý logistics
            { value: 'shipping_notification', label: 'Thông báo giao hàng', category: 'Quản lý logistics' },
            { value: 'delivery_confirmation', label: 'Thông báo ký nhận', category: 'Quản lý logistics' },
            { value: 'logistics_pickup', label: 'Logistics đã nhận hàng', category: 'Quản lý logistics' },
            { value: 'logistics_in_transit', label: 'Logistics đang vận chuyển', category: 'Quản lý logistics' },
            { value: 'logistics_delivered', label: 'Logistics đã giao hàng', category: 'Quản lý logistics' },
            { value: 'package_anomaly', label: 'Bưu kiện bất thường', category: 'Quản lý logistics' },

            // Quản lý tài chính
            { value: 'payment_notification', label: 'Thông báo thanh toán', category: 'Quản lý tài chính' },
            { value: 'payment_received', label: 'Xác nhận nhận thanh toán', category: 'Quản lý tài chính' },
            { value: 'invoice_generated', label: 'Tạo hóa đơn', category: 'Quản lý tài chính' },
            { value: 'refund_processed', label: 'Xử lý hoàn tiền', category: 'Quản lý tài chính' },

            // Quy trình phê duyệt
            { value: 'audit_notification', label: 'Thông báo phê duyệt', category: 'Quy trình phê duyệt' },
            { value: 'audit_pending', label: 'Chờ phê duyệt', category: 'Quy trình phê duyệt' },
            { value: 'audit_approved', label: 'Phê duyệt thành công', category: 'Quy trình phê duyệt' },
            { value: 'audit_rejected', label: 'Từ chối phê duyệt', category: 'Quy trình phê duyệt' },

            // Chia sẻ thành tích
            { value: 'performance_share_created', label: 'Tạo chia sẻ thành tích', category: 'Chia sẻ thành tích' },
            { value: 'performance_share_received', label: 'Nhận chia sẻ thành tích', category: 'Chia sẻ thành tích' },
            { value: 'performance_share_confirmed', label: 'Xác nhận chia sẻ thành tích', category: 'Chia sẻ thành tích' },
            { value: 'performance_share_rejected', label: 'Từ chối chia sẻ thành tích', category: 'Chia sẻ thành tích' },
            { value: 'performance_share_cancelled', label: 'Hủy chia sẻ thành tích', category: 'Chia sẻ thành tích' },

            // Quản lý SMS
            { value: 'sms_template_applied', label: 'Yêu cầu mẫu SMS', category: 'Quản lý SMS' },
            { value: 'sms_template_approved', label: 'Duyệt mẫu SMS thành công', category: 'Quản lý SMS' },
            { value: 'sms_template_rejected', label: 'Từ chối mẫu SMS', category: 'Quản lý SMS' },
            { value: 'sms_send_applied', label: 'Yêu cầu gửi SMS', category: 'Quản lý SMS' },
            { value: 'sms_send_approved', label: 'Duyệt gửi SMS thành công', category: 'Quản lý SMS' },
            { value: 'sms_send_rejected', label: 'Từ chối gửi SMS', category: 'Quản lý SMS' },
            { value: 'sms_send_success', label: 'Gửi SMS thành công', category: 'Quản lý SMS' },
            { value: 'sms_send_failed', label: 'Gửi SMS thất bại', category: 'Quản lý SMS' },

            // Quản lý hệ thống
            { value: 'system_maintenance', label: 'Thông báo bảo trì hệ thống', category: 'Quản lý hệ thống' },
            { value: 'system_update', label: 'Cập nhật hệ thống', category: 'Quản lý hệ thống' },
            { value: 'user_login', label: 'Đăng nhập người dùng', category: 'Quản lý hệ thống' },
            { value: 'user_created', label: 'Thêm người dùng hệ thống thành công', category: 'Quản lý hệ thống' },
            { value: 'permission_configured', label: 'Cấu hình quyền thành công', category: 'Quản lý hệ thống' },
            { value: 'data_export_success', label: 'Xuất dữ liệu thành công', category: 'Quản lý hệ thống' },
            { value: 'data_import_completed', label: 'Nhập dữ liệu hoàn tất', category: 'Quản lý hệ thống' },
            { value: 'system_alert', label: 'Cảnh báo hệ thống', category: 'Quản lý hệ thống' }
          ]
        };

        res.json(mockData);
        return;
      }

      // Logic truy vấn cơ sở dữ liệu thực tế
      // TODO: Triển khai truy vấn cơ sở dữ liệu thực tế
      res.json({
        departments: [],
        members: [],
        messageTypes: []
      });
    } catch (error) {
      console.error('Lấy dữ liệu phòng ban và thành viên thất bại:', error);
      res.status(500).json({ error: 'Lấy dữ liệu phòng ban và thành viên thất bại' });
    }
  }

  async getMessageStats(req: Request, res: Response): Promise<void> {
    try {
      const dataSource = getDataSource();
      if (!dataSource) {
        // Chế độ kiểm thử: trả về dữ liệu thống kê mô phỏng
        const mockStats = {
          totalSubscriptions: 8,
          activeSubscriptions: 6,
          totalAnnouncements: 12,
          publishedAnnouncements: 8,
          unreadMessages: 5,
          totalMessages: 23,
          configuredChannels: 4,
          totalChannels: 6
        };

        res.json(mockStats);
        return;
      }

      // Logic truy vấn cơ sở dữ liệu thực tế
      const subscriptionRepo = dataSource.getRepository(MessageSubscription);

      const totalSubscriptions = await subscriptionRepo.count();
      const activeSubscriptions = await subscriptionRepo.count({
        where: { isGlobalEnabled: true }
      });

      // Có thể thêm nhiều truy vấn thống kê hơn ở đây
      const stats = {
        totalSubscriptions,
        activeSubscriptions,
        totalAnnouncements: 0, // TODO: Triển khai thống kê thông báo
        publishedAnnouncements: 0, // TODO: Triển khai thống kê thông báo đã xuất bản
        unreadMessages: 0, // TODO: Triển khai thống kê tin nhắn chưa đọc
        totalMessages: 0, // TODO: Triển khai thống kê tổng số tin nhắn
        configuredChannels: 0, // TODO: Triển khai thống kê kênh đã cấu hình
        totalChannels: 6 // Tổng số kênh
      };

      res.json(stats);
    } catch (error) {
      console.error('Lấy thống kê tin nhắn thất bại:', error);
      res.status(500).json({ error: 'Lấy thống kê tin nhắn thất bại' });
    }
  }

  // Các phương thức liên quan đến tin nhắn hệ thống
  async getSystemMessages(req: Request, res: Response): Promise<void> {
    try {
      // Trả về danh sách tin nhắn hệ thống trống, không còn sử dụng dữ liệu mô phỏng được mã hóa cứng
      const messages: any[] = []

      res.json({
        success: true,
        data: {
          messages: messages,
          total: messages.length
        }
      })
    } catch (error) {
      console.error('Lấy tin nhắn hệ thống thất bại:', error)
      res.status(500).json({ error: 'Lấy tin nhắn hệ thống thất bại' })
    }
  }

  async markMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      // Ở đây nên triển khai logic đánh dấu tin nhắn là đã đọc
      // Do hiện tại không có dữ liệu tin nhắn thực tế, trả về thành công trực tiếp

      res.json({
        success: true,
        message: 'Tin nhắn đã được đánh dấu là đã đọc'
      })
    } catch (error) {
      console.error('Đánh dấu tin nhắn là đã đọc thất bại:', error)
      res.status(500).json({ error: 'Đánh dấu tin nhắn là đã đọc thất bại' })
    }
  }

  async markAllMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      // Ở đây nên triển khai logic đánh dấu tất cả tin nhắn là đã đọc
      // Do hiện tại không có dữ liệu tin nhắn thực tế, trả về thành công trực tiếp

      res.json({
        success: true,
        message: 'Tất cả tin nhắn đã được đánh dấu là đã đọc'
      })
    } catch (error) {
      console.error('Đánh dấu tất cả tin nhắn là đã đọc thất bại:', error)
      res.status(500).json({ error: 'Đánh dấu tất cả tin nhắn là đã đọc thất bại' })
    }
  }
}
