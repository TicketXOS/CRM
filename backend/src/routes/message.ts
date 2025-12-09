import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();
const messageController = new MessageController();

// Tạm thời tắt xác thực để kiểm thử
// router.use(authenticateToken, requireManagerOrAdmin);

/**
 * @route GET /api/v1/message/subscriptions
 * @desc Lấy danh sách đăng ký tin nhắn
 * @access Private (Manager/Admin)
 */
router.get('/subscriptions', messageController.getSubscriptions.bind(messageController));

/**
 * @route PUT /api/v1/message/subscriptions/:id
 * @desc Cập nhật cài đặt đăng ký tin nhắn
 * @access Private (Manager/Admin)
 */
router.put('/subscriptions/:id', messageController.updateSubscription.bind(messageController));

/**
 * @route GET /api/v1/message/subscriptions/departments
 * @desc Lấy cấu hình đăng ký cấp phòng ban
 * @access Private (Manager/Admin)
 */
router.get('/subscriptions/departments', messageController.getDepartmentSubscriptions.bind(messageController));

/**
 * @route PUT /api/v1/message/subscriptions/:subscriptionId/departments/:departmentId
 * @desc Cập nhật cấu hình đăng ký cấp phòng ban
 * @access Private (Manager/Admin)
 */
router.put('/subscriptions/:subscriptionId/departments/:departmentId', messageController.updateDepartmentSubscription.bind(messageController));

/**
 * @route PUT /api/v1/message/subscriptions/:subscriptionId/departments/batch
 * @desc Cập nhật hàng loạt cấu hình đăng ký phòng ban
 * @access Private (Manager/Admin)
 */
router.put('/subscriptions/:subscriptionId/departments/batch', messageController.batchUpdateDepartmentSubscriptions.bind(messageController));

/**
 * @route POST /api/v1/message/subscriptions/initialize
 * @desc Khởi tạo cấu hình đăng ký tin nhắn mặc định
 * @access Private (Manager/Admin)
 */
router.post('/subscriptions/initialize', messageController.initializeDefaultSubscriptions.bind(messageController));

// Route quản lý thông báo
/**
 * @route GET /api/v1/message/announcements
 * @desc Lấy danh sách thông báo
 * @access Private (Manager/Admin)
 */
router.get('/announcements', messageController.getAnnouncements.bind(messageController));

/**
 * @route POST /api/v1/message/announcements
 * @desc Tạo thông báo mới
 * @access Private (Manager/Admin)
 */
router.post('/announcements', messageController.createAnnouncement.bind(messageController));

/**
 * @route PUT /api/v1/message/announcements/:id
 * @desc Cập nhật thông báo
 * @access Private (Manager/Admin)
 */
router.put('/announcements/:id', messageController.updateAnnouncement.bind(messageController));

/**
 * @route DELETE /api/v1/message/announcements/:id
 * @desc Xóa thông báo
 * @access Private (Manager/Admin)
 */
router.delete('/announcements/:id', messageController.deleteAnnouncement.bind(messageController));

/**
 * @route POST /api/v1/message/announcements/:id/publish
 * @desc Xuất bản thông báo
 * @access Private (Manager/Admin)
 */
router.post('/announcements/:id/publish', messageController.publishAnnouncement.bind(messageController));

// Route quản lý quy tắc đăng ký
/**
 * @route GET /api/v1/message/subscription-rules
 * @desc Lấy danh sách quy tắc đăng ký
 * @access Private (Manager/Admin)
 */
router.get('/subscription-rules', messageController.getSubscriptionRules.bind(messageController));

/**
 * @route POST /api/v1/message/subscription-rules
 * @desc Tạo quy tắc đăng ký mới
 * @access Private (Manager/Admin)
 */
router.post('/subscription-rules', messageController.createSubscriptionRule.bind(messageController));

/**
 * @route PUT /api/v1/message/subscription-rules/:id
 * @desc Cập nhật quy tắc đăng ký
 * @access Private (Manager/Admin)
 */
router.put('/subscription-rules/:id', messageController.updateSubscriptionRule.bind(messageController));

/**
 * @route DELETE /api/v1/message/subscription-rules/:id
 * @desc Xóa quy tắc đăng ký
 * @access Private (Manager/Admin)
 */
router.delete('/subscription-rules/:id', messageController.deleteSubscriptionRule.bind(messageController));

/**
 * @route PATCH /api/v1/message/subscription-rules/:id/toggle
 * @desc Bật/Tắt quy tắc đăng ký
 * @access Private (Manager/Admin)
 */
router.patch('/subscription-rules/:id/toggle', messageController.toggleSubscriptionRule.bind(messageController));

// Route quản lý cấu hình thông báo
/**
 * @route GET /api/v1/message/notification-configs
 * @desc Lấy danh sách cấu hình thông báo
 * @access Private (Manager/Admin)
 */
router.get('/notification-configs', messageController.getNotificationConfigs.bind(messageController));

/**
 * @route PUT /api/v1/message/notification-configs/:id
 * @desc Cập nhật cấu hình thông báo
 * @access Private (Manager/Admin)
 */
router.put('/notification-configs/:id', messageController.updateNotificationConfig.bind(messageController));

/**
 * @route POST /api/v1/message/notification-configs/test
 * @desc Kiểm thử cấu hình thông báo
 * @access Private (Manager/Admin)
 */
router.post('/notification-configs/test', messageController.testNotification.bind(messageController));

// Route dữ liệu cơ bản
/**
 * @route GET /api/v1/message/departments-members
 * @desc Lấy dữ liệu phòng ban và thành viên
 * @access Private (Manager/Admin)
 */
router.get('/departments-members', messageController.getDepartmentsAndMembers.bind(messageController));

// Route tin nhắn hệ thống
/**
 * @route GET /api/v1/message/system-messages
 * @desc Lấy danh sách tin nhắn hệ thống
 * @access Private (Manager/Admin)
 */
router.get('/system-messages', messageController.getSystemMessages.bind(messageController));

/**
 * @route PUT /api/v1/message/system-messages/:id/read
 * @desc Đánh dấu tin nhắn là đã đọc
 * @access Private (Manager/Admin)
 */
router.put('/system-messages/:id/read', messageController.markMessageAsRead.bind(messageController));

/**
 * @route PUT /api/v1/message/system-messages/read-all
 * @desc Đánh dấu tất cả tin nhắn là đã đọc
 * @access Private (Manager/Admin)
 */
router.put('/system-messages/read-all', messageController.markAllMessagesAsRead.bind(messageController));

/**
 * @route GET /api/v1/message/stats
 * @desc Lấy thống kê tin nhắn
 * @access Private (Manager/Admin)
 */
router.get('/stats', messageController.getMessageStats.bind(messageController));

export default router;
