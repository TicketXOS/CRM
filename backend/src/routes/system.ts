import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { DepartmentController } from '../controllers/DepartmentController';
import { AppDataSource } from '../config/database';
import { SystemConfig } from '../entities/SystemConfig';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const departmentController = new DepartmentController();

// ========== Cấu hình tải lên tệp ==========

// Lấy cấu hình tải lên (đọc maxFileSize từ cơ sở dữ liệu)
const getUploadConfig = async (): Promise<{ maxFileSize: number; allowedTypes: string }> => {
  try {
    const configRepository = AppDataSource.getRepository(SystemConfig);
    const maxFileSizeConfig = await configRepository.findOne({
      where: { configKey: 'maxFileSize', configGroup: 'storage_settings', isEnabled: true }
    });
    const allowedTypesConfig = await configRepository.findOne({
      where: { configKey: 'allowedTypes', configGroup: 'storage_settings', isEnabled: true }
    });

    return {
      maxFileSize: maxFileSizeConfig ? Number(maxFileSizeConfig.configValue) : 10, // Mặc định 10MB
      allowedTypes: allowedTypesConfig ? allowedTypesConfig.configValue : 'jpg,png,gif,webp,jpeg'
    };
  } catch {
    return { maxFileSize: 10, allowedTypes: 'jpg,png,gif,webp,jpeg' };
  }
};

// Tạo cấu hình lưu trữ tải lên hình ảnh chung
const createImageStorage = (subDir: string) => multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', subDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${subDir}-${uniqueSuffix}${ext}`);
  }
});

// Tạo instance multer (cấu hình mặc định, giới hạn thực tế được kiểm tra động trong route)
const createImageUpload = (subDir: string) => multer({
  storage: createImageStorage(subDir),
  limits: {
    fileSize: 50 * 1024 * 1024 // Đặt giá trị mặc định lớn hơn, giới hạn thực tế được kiểm tra trong route
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên tệp hình ảnh (jpg, png, gif, webp)'));
    }
  }
});

// Các instance tải lên của từng module
const systemImageUpload = createImageUpload('system');
const productImageUpload = createImageUpload('products');
const avatarImageUpload = createImageUpload('avatars');
const orderImageUpload = createImageUpload('orders');
const serviceImageUpload = createImageUpload('services');

// ========== Hàm trợ giúp cấu hình chung ==========

/**
 * Lấy cấu hình theo nhóm cấu hình
 */
const getConfigsByGroup = async (group: string): Promise<Record<string, unknown>> => {
  const configRepository = AppDataSource.getRepository(SystemConfig);
  const configs = await configRepository.find({
    where: { configGroup: group, isEnabled: true },
    order: { sortOrder: 'ASC' }
  });
  const settings: Record<string, unknown> = {};
  configs.forEach(config => {
    settings[config.configKey] = config.getParsedValue();
  });
  return settings;
};

/**
 * Lưu cấu hình vào nhóm chỉ định
 */
const saveConfigsByGroup = async (
  group: string,
  settings: Record<string, unknown>,
  configItems: Array<{key: string, type: 'string' | 'number' | 'boolean' | 'json' | 'text', desc: string}>
): Promise<void> => {
  const configRepository = AppDataSource.getRepository(SystemConfig);
  for (const item of configItems) {
    if (settings[item.key] !== undefined) {
      let config = await configRepository.findOne({
        where: { configKey: item.key, configGroup: group }
      });
      if (config) {
        config.configValue = String(settings[item.key]);
        config.valueType = item.type;
      } else {
        config = configRepository.create({
          configKey: item.key,
          configValue: String(settings[item.key]),
          valueType: item.type,
          configGroup: group,
          description: item.desc,
          isEnabled: true,
          isSystem: true
        });
      }
      await configRepository.save(config);
    }
  }
};

/**
 * Route quản lý hệ thống
 */

// ========== Route công khai (chỉ cần đăng nhập, không cần quyền quản trị viên) ==========

/**
 * @route GET /api/v1/system/global-config
 * @desc Lấy cấu hình toàn cục (tất cả người dùng đã đăng nhập có thể truy cập)
 * @access Private (All authenticated users)
 */
router.get('/global-config', authenticateToken, (_req, res) => {
  res.json({
    success: true,
    data: {
      storageConfig: {
        mode: 'local',
        autoSync: true,
        syncInterval: 30,
        apiEndpoint: '/api/v1',
        lastUpdatedBy: 'system',
        lastUpdatedAt: new Date().toISOString(),
        version: 1
      }
    }
  });
});

// ========== Route tải lên tệp ==========

/**
 * Lấy cấu hình lưu trữ (đọc localDomain từ cơ sở dữ liệu, v.v.)
 */
const getStorageConfig = async (): Promise<{ localDomain: string; storageType: string }> => {
  try {
    const configRepository = AppDataSource.getRepository(SystemConfig);
    const localDomainConfig = await configRepository.findOne({
      where: { configKey: 'localDomain', configGroup: 'storage_settings', isEnabled: true }
    });
    const storageTypeConfig = await configRepository.findOne({
      where: { configKey: 'storageType', configGroup: 'storage_settings', isEnabled: true }
    });

    return {
      localDomain: localDomainConfig?.configValue || '',
      storageType: storageTypeConfig?.configValue || 'local'
    };
  } catch {
    return { localDomain: '', storageType: 'local' };
  }
};

/**
 * Hàm xử lý tải lên hình ảnh chung
 */
const handleImageUpload = async (req: Request, res: Response, subDir: string) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tệp hình ảnh cần tải lên'
      });
    }

    // Lấy cấu hình tải lên, kiểm tra kích thước tệp
    const uploadConfig = await getUploadConfig();
    const maxSizeBytes = uploadConfig.maxFileSize * 1024 * 1024;

    if (req.file.size > maxSizeBytes) {
      // Xóa tệp đã tải lên
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: `Kích thước tệp vượt quá giới hạn, tối đa cho phép ${uploadConfig.maxFileSize}MB`
      });
    }

    // Lấy tên miền truy cập trong cấu hình lưu trữ
    const storageConfig = await getStorageConfig();

    // Ưu tiên sử dụng tên miền được cấu hình trong cơ sở dữ liệu, sau đó sử dụng biến môi trường, cuối cùng sử dụng host của yêu cầu
    let baseUrl = storageConfig.localDomain;
    if (!baseUrl) {
      const protocol = req.protocol;
      const host = req.get('host');
      baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
    }

    // Loại bỏ dấu gạch chéo ở cuối
    baseUrl = baseUrl.replace(/\/$/, '');

    // Tạo URL hình ảnh - sử dụng đường dẫn tương đối, để frontend truy cập qua proxy Nginx
    // Lưu ý: Ở đây sử dụng /uploads thay vì /api/v1/uploads, vì dịch vụ tệp tĩnh của backend được cấu hình là /uploads
    const imageUrl = `/uploads/${subDir}/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Tải lên hình ảnh thành công',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Tải lên hình ảnh thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Tải lên hình ảnh thất bại'
    });
  }
};

/**
 * @route GET /api/v1/system/upload-config
 * @desc Lấy cấu hình tải lên (giới hạn kích thước tệp, v.v.)
 * @access Private
 */
router.get('/upload-config', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const config = await getUploadConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Lấy cấu hình tải lên thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy cấu hình tải lên thất bại'
    });
  }
});

/**
 * @route POST /api/v1/system/upload-image
 * @desc Tải lên hình ảnh hệ thống (Logo, mã QR, v.v.)
 * @access Private (Admin)
 */
router.post('/upload-image', authenticateToken, requireAdmin, systemImageUpload.single('image'), (req: Request, res: Response) => {
  handleImageUpload(req, res, 'system');
});

/**
 * @route POST /api/v1/system/upload-product-image
 * @desc Tải lên hình ảnh sản phẩm
 * @access Private (Admin)
 */
router.post('/upload-product-image', authenticateToken, requireAdmin, productImageUpload.single('image'), (req: Request, res: Response) => {
  handleImageUpload(req, res, 'products');
});

/**
 * @route POST /api/v1/system/upload-avatar
 * @desc Tải lên avatar người dùng
 * @access Private
 */
router.post('/upload-avatar', authenticateToken, avatarImageUpload.single('image'), (req: Request, res: Response) => {
  handleImageUpload(req, res, 'avatars');
});

/**
 * @route POST /api/v1/system/upload-order-image
 * @desc Tải lên hình ảnh liên quan đến đơn hàng (chứng từ đặt cọc, v.v.)
 * @access Private
 */
router.post('/upload-order-image', authenticateToken, orderImageUpload.single('image'), (req: Request, res: Response) => {
  handleImageUpload(req, res, 'orders');
});

/**
 * @route POST /api/v1/system/upload-service-image
 * @desc Tải lên hình ảnh dịch vụ sau bán hàng
 * @access Private
 */
router.post('/upload-service-image', authenticateToken, serviceImageUpload.single('image'), (req: Request, res: Response) => {
  handleImageUpload(req, res, 'services');
});

/**
 * @route DELETE /api/v1/system/delete-image
 * @desc Xóa hình ảnh hệ thống
 * @access Private (Admin)
 */
router.delete('/delete-image', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên tệp cần xóa'
      });
    }

    // Kiểm tra bảo mật: chỉ cho phép xóa tệp trong thư mục system
    const filePath = path.join(process.cwd(), 'uploads', 'system', path.basename(filename));

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Xóa hình ảnh thành công'
    });
  } catch (error) {
    console.error('Xóa hình ảnh thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Xóa hình ảnh thất bại'
    });
  }
});

// ========== Route cấu hình cơ bản ==========

/**
 * @route GET /api/v1/system/basic-settings
 * @desc Lấy cấu hình cơ bản hệ thống
 * @access Private (All authenticated users)
 */
router.get('/basic-settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const configRepository = AppDataSource.getRepository(SystemConfig);

    // Lấy tất cả cấu hình cài đặt cơ bản
    const configs = await configRepository.find({
      where: { configGroup: 'basic_settings', isEnabled: true },
      order: { sortOrder: 'ASC' }
    });

    // Chuyển đổi sang định dạng cặp khóa-giá trị
    const settings: Record<string, unknown> = {};
    configs.forEach(config => {
      settings[config.configKey] = config.getParsedValue();
    });

    // Đặt giá trị mặc định
    const defaultSettings = {
      systemName: settings.systemName || 'Hệ thống quản lý khách hàng CRM',
      systemVersion: settings.systemVersion || '1.0.0',
      companyName: settings.companyName || '',
      contactPhone: settings.contactPhone || '',
      contactEmail: settings.contactEmail || '',
      websiteUrl: settings.websiteUrl || '',
      companyAddress: settings.companyAddress || '',
      systemDescription: settings.systemDescription || '',
      systemLogo: settings.systemLogo || '',
      contactQRCode: settings.contactQRCode || '',
      contactQRCodeLabel: settings.contactQRCodeLabel || 'Quét mã liên hệ'
    };

    res.json({
      success: true,
      data: { ...defaultSettings, ...settings }
    });
  } catch (error) {
    console.error('Lấy cấu hình cơ bản thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy cấu hình cơ bản thất bại'
    });
  }
});

/**
 * @route PUT /api/v1/system/basic-settings
 * @desc Cập nhật cấu hình cơ bản hệ thống
 * @access Private (Admin)
 */
router.put('/basic-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const configRepository = AppDataSource.getRepository(SystemConfig);
    const settings = req.body;

    // Định nghĩa các mục cấu hình cần lưu
    const configItems = [
      { key: 'systemName', type: 'string' as const, desc: 'Tên hệ thống' },
      { key: 'systemVersion', type: 'string' as const, desc: 'Phiên bản hệ thống' },
      { key: 'companyName', type: 'string' as const, desc: 'Tên công ty' },
      { key: 'contactPhone', type: 'string' as const, desc: 'Số điện thoại liên hệ' },
      { key: 'contactEmail', type: 'string' as const, desc: 'Email liên hệ' },
      { key: 'websiteUrl', type: 'string' as const, desc: 'Địa chỉ website' },
      { key: 'companyAddress', type: 'string' as const, desc: 'Địa chỉ công ty' },
      { key: 'systemDescription', type: 'text' as const, desc: 'Mô tả hệ thống' },
      { key: 'systemLogo', type: 'text' as const, desc: 'Logo hệ thống' },
      { key: 'contactQRCode', type: 'text' as const, desc: 'Mã QR liên hệ' },
      { key: 'contactQRCodeLabel', type: 'string' as const, desc: 'Nhãn mã QR' }
    ];

    // Lưu hoặc cập nhật từng mục cấu hình
    for (const item of configItems) {
      if (settings[item.key] !== undefined) {
        let config = await configRepository.findOne({
          where: { configKey: item.key, configGroup: 'basic_settings' }
        });

        if (config) {
          // Cập nhật cấu hình hiện có
          config.configValue = String(settings[item.key]);
          config.valueType = item.type;
        } else {
          // Tạo cấu hình mới
          config = configRepository.create({
            configKey: item.key,
            configValue: String(settings[item.key]),
            valueType: item.type,
            configGroup: 'basic_settings',
            description: item.desc,
            isEnabled: true,
            isSystem: true
          });
        }

        await configRepository.save(config);
      }
    }

    res.json({
      success: true,
      message: 'Lưu cấu hình cơ bản thành công',
      data: settings
    });
  } catch (error) {
    console.error('Lưu cấu hình cơ bản thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lưu cấu hình cơ bản thất bại'
    });
  }
});

// ========== Route cấu hình bảo mật ==========

/**
 * @route GET /api/v1/system/security-settings
 * @desc Lấy cấu hình bảo mật
 * @access Private (Admin)
 */
router.get('/security-settings', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('security_settings');
    const defaultSettings = {
      passwordMinLength: 6,
      passwordComplexity: [],
      passwordExpireDays: 0,
      loginFailLock: false,
      maxLoginFails: 5,
      lockDuration: 30,
      sessionTimeout: 120,
      forceHttps: false,
      ipWhitelist: ''
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình bảo mật thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình bảo mật thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/security-settings
 * @desc Cập nhật cấu hình bảo mật
 * @access Private (Admin)
 */
router.put('/security-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'passwordMinLength', type: 'number' as const, desc: 'Độ dài mật khẩu tối thiểu' },
      { key: 'passwordComplexity', type: 'json' as const, desc: 'Yêu cầu độ phức tạp mật khẩu' },
      { key: 'passwordExpireDays', type: 'number' as const, desc: 'Thời hạn mật khẩu (ngày)' },
      { key: 'loginFailLock', type: 'boolean' as const, desc: 'Khóa khi đăng nhập thất bại' },
      { key: 'maxLoginFails', type: 'number' as const, desc: 'Số lần thất bại tối đa' },
      { key: 'lockDuration', type: 'number' as const, desc: 'Thời gian khóa (phút)' },
      { key: 'sessionTimeout', type: 'number' as const, desc: 'Thời gian chờ phiên hết hạn (phút)' },
      { key: 'forceHttps', type: 'boolean' as const, desc: 'Bắt buộc HTTPS' },
      { key: 'ipWhitelist', type: 'text' as const, desc: 'Danh sách trắng IP' }
    ];
    await saveConfigsByGroup('security_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình bảo mật thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình bảo mật thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình bảo mật thất bại' });
  }
});

// ========== Route cấu hình cuộc gọi ==========

/**
 * @route GET /api/v1/system/call-settings
 * @desc Lấy cấu hình cuộc gọi
 * @access Private (Admin)
 */
router.get('/call-settings', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('call_settings');
    const defaultSettings = {
      sipServer: '',
      sipPort: 5060,
      sipUsername: '',
      sipPassword: '',
      sipTransport: 'UDP',
      autoAnswer: false,
      autoRecord: false,
      qualityMonitoring: false,
      incomingCallPopup: true,
      maxCallDuration: 3600,
      recordFormat: 'mp3',
      recordQuality: 'standard',
      recordPath: './recordings',
      recordRetentionDays: 90,
      outboundPermission: ['admin', 'manager', 'sales'],
      recordAccessPermission: ['admin', 'manager'],
      statisticsPermission: ['admin', 'manager'],
      numberRestriction: false,
      allowedPrefixes: ''
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình cuộc gọi thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình cuộc gọi thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/call-settings
 * @desc Cập nhật cấu hình cuộc gọi
 * @access Private (Admin)
 */
router.put('/call-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'sipServer', type: 'string' as const, desc: 'Địa chỉ máy chủ SIP' },
      { key: 'sipPort', type: 'number' as const, desc: 'Cổng SIP' },
      { key: 'sipUsername', type: 'string' as const, desc: 'Tên người dùng SIP' },
      { key: 'sipPassword', type: 'string' as const, desc: 'Mật khẩu SIP' },
      { key: 'sipTransport', type: 'string' as const, desc: 'Giao thức truyền tải' },
      { key: 'autoAnswer', type: 'boolean' as const, desc: 'Tự động trả lời' },
      { key: 'autoRecord', type: 'boolean' as const, desc: 'Tự động ghi âm' },
      { key: 'qualityMonitoring', type: 'boolean' as const, desc: 'Giám sát chất lượng cuộc gọi' },
      { key: 'incomingCallPopup', type: 'boolean' as const, desc: 'Cửa sổ bật lên cuộc gọi đến' },
      { key: 'maxCallDuration', type: 'number' as const, desc: 'Thời lượng cuộc gọi tối đa (giây)' },
      { key: 'recordFormat', type: 'string' as const, desc: 'Định dạng ghi âm' },
      { key: 'recordQuality', type: 'string' as const, desc: 'Chất lượng ghi âm' },
      { key: 'recordPath', type: 'string' as const, desc: 'Đường dẫn lưu ghi âm' },
      { key: 'recordRetentionDays', type: 'number' as const, desc: 'Thời gian lưu ghi âm (ngày)' },
      { key: 'outboundPermission', type: 'json' as const, desc: 'Quyền gọi ra' },
      { key: 'recordAccessPermission', type: 'json' as const, desc: 'Quyền truy cập ghi âm' },
      { key: 'statisticsPermission', type: 'json' as const, desc: 'Quyền thống kê cuộc gọi' },
      { key: 'numberRestriction', type: 'boolean' as const, desc: 'Hạn chế số' },
      { key: 'allowedPrefixes', type: 'text' as const, desc: 'Tiền tố số được phép' }
    ];
    await saveConfigsByGroup('call_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình cuộc gọi thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình cuộc gọi thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình cuộc gọi thất bại' });
  }
});

// ========== Route cấu hình email ==========

/**
 * @route GET /api/v1/system/email-settings
 * @desc Lấy cấu hình email
 * @access Private (Admin)
 */
router.get('/email-settings', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('email_settings');
    const defaultSettings = {
      smtpHost: '',
      smtpPort: 587,
      senderEmail: '',
      senderName: '',
      emailPassword: '',
      enableSsl: true,
      enableTls: false,
      testEmail: ''
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình email thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình email thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/email-settings
 * @desc Cập nhật cấu hình email
 * @access Private (Admin)
 */
router.put('/email-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'smtpHost', type: 'string' as const, desc: 'Địa chỉ máy chủ SMTP' },
      { key: 'smtpPort', type: 'number' as const, desc: 'Cổng SMTP' },
      { key: 'senderEmail', type: 'string' as const, desc: 'Email người gửi' },
      { key: 'senderName', type: 'string' as const, desc: 'Tên người gửi' },
      { key: 'emailPassword', type: 'string' as const, desc: 'Mật khẩu email' },
      { key: 'enableSsl', type: 'boolean' as const, desc: 'Bật SSL' },
      { key: 'enableTls', type: 'boolean' as const, desc: 'Bật TLS' },
      { key: 'testEmail', type: 'string' as const, desc: 'Email kiểm tra' }
    ];
    await saveConfigsByGroup('email_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình email thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình email thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình email thất bại' });
  }
});

// ========== Route cấu hình SMS ==========

/**
 * @route GET /api/v1/system/sms-settings
 * @desc Lấy cấu hình SMS
 * @access Private (Admin)
 */
router.get('/sms-settings', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('sms_settings');
    const defaultSettings = {
      provider: 'aliyun',
      accessKey: '',
      secretKey: '',
      signName: '',
      dailyLimit: 100,
      monthlyLimit: 3000,
      enabled: false,
      requireApproval: false,
      testPhone: ''
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình SMS thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình SMS thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/sms-settings
 * @desc Cập nhật cấu hình SMS
 * @access Private (Admin)
 */
router.put('/sms-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'provider', type: 'string' as const, desc: 'Nhà cung cấp dịch vụ SMS' },
      { key: 'accessKey', type: 'string' as const, desc: 'AccessKey' },
      { key: 'secretKey', type: 'string' as const, desc: 'SecretKey' },
      { key: 'signName', type: 'string' as const, desc: 'Chữ ký SMS' },
      { key: 'dailyLimit', type: 'number' as const, desc: 'Giới hạn gửi hàng ngày' },
      { key: 'monthlyLimit', type: 'number' as const, desc: 'Giới hạn gửi hàng tháng' },
      { key: 'enabled', type: 'boolean' as const, desc: 'Bật chức năng SMS' },
      { key: 'requireApproval', type: 'boolean' as const, desc: 'Cần phê duyệt' },
      { key: 'testPhone', type: 'string' as const, desc: 'Số điện thoại kiểm tra' }
    ];
    await saveConfigsByGroup('sms_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình SMS thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình SMS thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình SMS thất bại' });
  }
});

// ========== Route cấu hình lưu trữ ==========

/**
 * @route GET /api/v1/system/storage-settings
 * @desc Lấy cấu hình lưu trữ
 * @access Private (All authenticated users - Tải lên hình ảnh cần lấy cấu hình)
 */
router.get('/storage-settings', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('storage_settings');
    const defaultSettings = {
      storageType: 'local',
      localPath: './uploads',
      localDomain: '',
      accessKey: '',
      secretKey: '',
      bucketName: '',
      region: 'oss-cn-hangzhou',
      customDomain: '',
      maxFileSize: 10,
      allowedTypes: 'jpg,png,gif,pdf,doc,docx,xls,xlsx'
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình lưu trữ thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình lưu trữ thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/storage-settings
 * @desc Cập nhật cấu hình lưu trữ
 * @access Private (Admin)
 */
router.put('/storage-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'storageType', type: 'string' as const, desc: 'Loại lưu trữ' },
      { key: 'localPath', type: 'string' as const, desc: 'Đường dẫn lưu trữ cục bộ' },
      { key: 'localDomain', type: 'string' as const, desc: 'Tên miền truy cập' },
      { key: 'accessKey', type: 'string' as const, desc: 'Access Key' },
      { key: 'secretKey', type: 'string' as const, desc: 'Secret Key' },
      { key: 'bucketName', type: 'string' as const, desc: 'Tên bucket lưu trữ' },
      { key: 'region', type: 'string' as const, desc: 'Khu vực lưu trữ' },
      { key: 'customDomain', type: 'string' as const, desc: 'Tên miền tùy chỉnh' },
      { key: 'maxFileSize', type: 'number' as const, desc: 'Kích thước tệp tối đa (MB)' },
      { key: 'allowedTypes', type: 'string' as const, desc: 'Loại tệp được phép' }
    ];
    await saveConfigsByGroup('storage_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình lưu trữ thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình lưu trữ thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình lưu trữ thất bại' });
  }
});

// ========== Route cấu hình sản phẩm ==========

/**
 * @route GET /api/v1/system/product-settings
 * @desc Lấy cấu hình sản phẩm
 * @access Private (Admin)
 */
router.get('/product-settings', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('product_settings');
    const defaultSettings = {
      maxDiscountPercent: 50,
      adminMaxDiscount: 50,
      managerMaxDiscount: 30,
      salesMaxDiscount: 15,
      discountApprovalThreshold: 20,
      allowPriceModification: true,
      priceModificationRoles: ['admin', 'manager'],
      enablePriceHistory: true,
      pricePrecision: '2',
      enableInventory: false,
      lowStockThreshold: 10,
      allowNegativeStock: false,
      defaultCategory: '',
      maxCategoryLevel: 3,
      enableCategoryCode: false,
      costPriceViewRoles: ['super_admin', 'admin'],
      salesDataViewRoles: ['super_admin', 'admin', 'manager'],
      stockInfoViewRoles: ['super_admin', 'admin', 'manager'],
      operationLogsViewRoles: ['super_admin', 'admin'],
      sensitiveInfoHideMethod: 'asterisk',
      enablePermissionControl: true
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình sản phẩm thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình sản phẩm thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/product-settings
 * @desc Cập nhật cấu hình sản phẩm
 * @access Private (Admin)
 */
router.put('/product-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'maxDiscountPercent', type: 'number' as const, desc: 'Tỷ lệ giảm giá tối đa toàn cục' },
      { key: 'adminMaxDiscount', type: 'number' as const, desc: 'Giảm giá tối đa quản trị viên' },
      { key: 'managerMaxDiscount', type: 'number' as const, desc: 'Giảm giá tối đa quản lý' },
      { key: 'salesMaxDiscount', type: 'number' as const, desc: 'Giảm giá tối đa nhân viên bán hàng' },
      { key: 'discountApprovalThreshold', type: 'number' as const, desc: 'Ngưỡng phê duyệt giảm giá' },
      { key: 'allowPriceModification', type: 'boolean' as const, desc: 'Cho phép sửa đổi giá' },
      { key: 'priceModificationRoles', type: 'json' as const, desc: 'Quyền sửa đổi giá' },
      { key: 'enablePriceHistory', type: 'boolean' as const, desc: 'Ghi lại thay đổi giá' },
      { key: 'pricePrecision', type: 'string' as const, desc: 'Độ chính xác hiển thị giá' },
      { key: 'enableInventory', type: 'boolean' as const, desc: 'Bật quản lý kho' },
      { key: 'lowStockThreshold', type: 'number' as const, desc: 'Ngưỡng cảnh báo kho thấp' },
      { key: 'allowNegativeStock', type: 'boolean' as const, desc: 'Cho phép bán kho âm' },
      { key: 'defaultCategory', type: 'string' as const, desc: 'Danh mục mặc định' },
      { key: 'maxCategoryLevel', type: 'number' as const, desc: 'Giới hạn cấp danh mục' },
      { key: 'enableCategoryCode', type: 'boolean' as const, desc: 'Bật mã danh mục' },
      { key: 'costPriceViewRoles', type: 'json' as const, desc: 'Quyền xem giá thành' },
      { key: 'salesDataViewRoles', type: 'json' as const, desc: 'Quyền xem dữ liệu bán hàng' },
      { key: 'stockInfoViewRoles', type: 'json' as const, desc: 'Quyền xem thông tin kho' },
      { key: 'operationLogsViewRoles', type: 'json' as const, desc: 'Quyền xem nhật ký thao tác' },
      { key: 'sensitiveInfoHideMethod', type: 'string' as const, desc: 'Phương thức ẩn thông tin nhạy cảm' },
      { key: 'enablePermissionControl', type: 'boolean' as const, desc: 'Bật kiểm soát quyền' }
    ];
    await saveConfigsByGroup('product_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình sản phẩm thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình sản phẩm thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình sản phẩm thất bại' });
  }
});

// ========== Route cấu hình sao lưu dữ liệu ==========

/**
 * @route GET /api/v1/system/backup-settings
 * @desc Lấy cấu hình sao lưu dữ liệu
 * @access Private (Admin)
 */
router.get('/backup-settings', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('backup_settings');
    const defaultSettings = {
      autoBackupEnabled: false,
      backupFrequency: 'daily',
      retentionDays: 30,
      compression: true
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình sao lưu dữ liệu thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình sao lưu dữ liệu thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/backup-settings
 * @desc Cập nhật cấu hình sao lưu dữ liệu
 * @access Private (Admin)
 */
router.put('/backup-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'autoBackupEnabled', type: 'boolean' as const, desc: 'Sao lưu tự động' },
      { key: 'backupFrequency', type: 'string' as const, desc: 'Tần suất sao lưu' },
      { key: 'retentionDays', type: 'number' as const, desc: 'Số ngày lưu giữ' },
      { key: 'compression', type: 'boolean' as const, desc: 'Nén sao lưu' }
    ];
    await saveConfigsByGroup('backup_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình sao lưu dữ liệu thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình sao lưu dữ liệu thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình sao lưu dữ liệu thất bại' });
  }
});

// ========== Route cấu hình thỏa thuận người dùng ==========

/**
 * @route GET /api/v1/system/agreement-settings
 * @desc Lấy cấu hình thỏa thuận người dùng
 * @access Private (Admin)
 */
router.get('/agreement-settings', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getConfigsByGroup('agreement_settings');
    const defaultSettings = {
      userAgreementEnabled: true,
      userAgreementTitle: 'Thỏa thuận dịch vụ người dùng',
      userAgreementContent: '',
      privacyAgreementEnabled: true,
      privacyAgreementTitle: 'Chính sách bảo mật',
      privacyAgreementContent: ''
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Lấy cấu hình thỏa thuận người dùng thất bại:', error);
    res.status(500).json({ success: false, message: 'Lấy cấu hình thỏa thuận người dùng thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/agreement-settings
 * @desc Cập nhật cấu hình thỏa thuận người dùng
 * @access Private (Admin)
 */
router.put('/agreement-settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const configItems = [
      { key: 'userAgreementEnabled', type: 'boolean' as const, desc: 'Bật thỏa thuận người dùng' },
      { key: 'userAgreementTitle', type: 'string' as const, desc: 'Tiêu đề thỏa thuận người dùng' },
      { key: 'userAgreementContent', type: 'text' as const, desc: 'Nội dung thỏa thuận người dùng' },
      { key: 'privacyAgreementEnabled', type: 'boolean' as const, desc: 'Bật thỏa thuận bảo mật' },
      { key: 'privacyAgreementTitle', type: 'string' as const, desc: 'Tiêu đề thỏa thuận bảo mật' },
      { key: 'privacyAgreementContent', type: 'text' as const, desc: 'Nội dung thỏa thuận bảo mật' }
    ];
    await saveConfigsByGroup('agreement_settings', settings, configItems);
    res.json({ success: true, message: 'Lưu cấu hình thỏa thuận người dùng thành công', data: settings });
  } catch (error) {
    console.error('Lưu cấu hình thỏa thuận người dùng thất bại:', error);
    res.status(500).json({ success: false, message: 'Lưu cấu hình thỏa thuận người dùng thất bại' });
  }
});

// ========== Route quản trị viên (cần quyền quản trị viên) ==========

/**
 * @route PUT /api/v1/system/global-config
 * @desc Cập nhật cấu hình toàn cục (chỉ quản trị viên mới có thể thao tác)
 * @access Private (Admin)
 */
router.put('/global-config', authenticateToken, requireAdmin, (req, res) => {
  const { storageConfig } = req.body;

  // Ở đây nên lưu vào cơ sở dữ liệu, hiện tại trả về dữ liệu mô phỏng
  res.json({
    success: true,
    message: 'Cấu hình toàn cục đã được cập nhật',
    data: {
      storageConfig: {
        ...storageConfig,
        lastUpdatedAt: new Date().toISOString(),
        version: (storageConfig.version || 1) + 1
      }
    }
  });
});

/**
 * @route GET /api/v1/system/info
 * @desc Lấy thông tin hệ thống
 * @access Private (Admin)
 */
router.get('/info', authenticateToken, requireAdmin, (_req, res) => {
  res.json({
    success: true,
    message: 'Chức năng quản lý hệ thống đang được phát triển',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  });
});

// ========== Route quản lý phòng ban (cần quyền quản trị viên) ==========
// Thêm middleware xác thực và quyền quản trị viên cho route phòng ban

/**
 * @route GET /api/v1/system/departments
 * @desc Lấy danh sách phòng ban
 * @access Private (Admin)
 */
router.get('/departments', authenticateToken, requireAdmin, departmentController.getDepartments.bind(departmentController));

/**
 * @route GET /api/v1/system/departments/tree
 * @desc Lấy cấu trúc cây phòng ban
 * @access Private (Admin)
 */
router.get('/departments/tree', authenticateToken, requireAdmin, departmentController.getDepartmentTree.bind(departmentController));

/**
 * @route GET /api/v1/system/departments/stats
 * @desc Lấy thông tin thống kê phòng ban
 * @access Private (Admin)
 */
router.get('/departments/stats', authenticateToken, requireAdmin, departmentController.getDepartmentStats.bind(departmentController));

/**
 * @route GET /api/v1/system/departments/:id
 * @desc Lấy chi tiết phòng ban
 * @access Private (Admin)
 */
router.get('/departments/:id', authenticateToken, requireAdmin, departmentController.getDepartmentById.bind(departmentController));

/**
 * @route POST /api/v1/system/departments
 * @desc Tạo phòng ban
 * @access Private (Admin)
 */
router.post('/departments', authenticateToken, requireAdmin, departmentController.createDepartment.bind(departmentController));

/**
 * @route PUT /api/v1/system/departments/:id
 * @desc Cập nhật phòng ban
 * @access Private (Admin)
 */
router.put('/departments/:id', authenticateToken, requireAdmin, departmentController.updateDepartment.bind(departmentController));

/**
 * @route PATCH /api/v1/system/departments/:id/status
 * @desc Cập nhật trạng thái phòng ban
 * @access Private (Admin)
 */
router.patch('/departments/:id/status', authenticateToken, requireAdmin, departmentController.updateDepartmentStatus.bind(departmentController));

/**
 * @route DELETE /api/v1/system/departments/:id
 * @desc Xóa phòng ban
 * @access Private (Admin)
 */
router.delete('/departments/:id', authenticateToken, requireAdmin, departmentController.deleteDepartment.bind(departmentController));

/**
 * @route GET /api/v1/system/departments/:id/members
 * @desc Lấy thành viên phòng ban
 * @access Private (Admin)
 */
router.get('/departments/:id/members', authenticateToken, requireAdmin, departmentController.getDepartmentMembers.bind(departmentController));

/**
 * @route GET /api/v1/system/departments/:id/roles
 * @desc Lấy danh sách vai trò phòng ban
 * @access Private (Admin)
 */
router.get('/departments/:id/roles', authenticateToken, requireAdmin, departmentController.getDepartmentRoles.bind(departmentController));

/**
 * @route PATCH /api/v1/system/departments/:id/permissions
 * @desc Cập nhật quyền phòng ban
 * @access Private (Admin)
 */
router.patch('/departments/:id/permissions', authenticateToken, requireAdmin, departmentController.updateDepartmentPermissions.bind(departmentController));

/**
 * @route PATCH /api/v1/system/departments/:id/move
 * @desc Di chuyển phòng ban
 * @access Private (Admin)
 */
router.patch('/departments/:id/move', authenticateToken, requireAdmin, departmentController.moveDepartment.bind(departmentController));

/**
 * @route POST /api/v1/system/departments/:departmentId/members
 * @desc Thêm thành viên phòng ban
 * @access Private (Admin)
 */
router.post('/departments/:departmentId/members', authenticateToken, requireAdmin, departmentController.addDepartmentMember.bind(departmentController));

/**
 * @route DELETE /api/v1/system/departments/:departmentId/members/:userId
 * @desc Xóa thành viên phòng ban
 * @access Private (Admin)
 */
router.delete('/departments/:departmentId/members/:userId', authenticateToken, requireAdmin, departmentController.removeDepartmentMember.bind(departmentController));

// ========== Route cấu hình trường đơn hàng ==========

/**
 * @route GET /api/v1/system/order-field-config
 * @desc Lấy cấu hình trường đơn hàng
 * @access Private
 */
router.get('/order-field-config', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const configRepository = AppDataSource.getRepository(SystemConfig);
    const config = await configRepository.findOne({
      where: { configKey: 'orderFieldConfig', configGroup: 'order_settings' }
    });

    if (config) {
      res.json({ success: true, code: 200, data: JSON.parse(config.configValue) });
    } else {
      // Trả về cấu hình mặc định
      res.json({
        success: true,
        code: 200,
        data: {
          orderSource: {
            fieldName: 'Nguồn đơn hàng',
            options: [
              { label: 'Cửa hàng trực tuyến', value: 'online_store' },
              { label: 'Ứng dụng WeChat Mini', value: 'wechat_mini' },
              { label: 'Tư vấn qua điện thoại', value: 'phone_call' },
              { label: 'Kênh khác', value: 'other' }
            ]
          },
          customFields: []
        }
      });
    }
  } catch (error) {
    console.error('Lấy cấu hình trường đơn hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy cấu hình trường đơn hàng thất bại' });
  }
});

/**
 * @route PUT /api/v1/system/order-field-config
 * @desc Cập nhật cấu hình trường đơn hàng
 * @access Private (Admin)
 */
router.put('/order-field-config', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const configRepository = AppDataSource.getRepository(SystemConfig);
    let config = await configRepository.findOne({
      where: { configKey: 'orderFieldConfig', configGroup: 'order_settings' }
    });

    if (config) {
      config.configValue = JSON.stringify(req.body);
    } else {
      config = configRepository.create({
        configKey: 'orderFieldConfig',
        configValue: JSON.stringify(req.body),
        valueType: 'json',
        configGroup: 'order_settings',
        description: 'Cấu hình trường đơn hàng',
        isEnabled: true,
        isSystem: true
      });
    }

    await configRepository.save(config);
    res.json({ success: true, code: 200, message: 'Lưu cấu hình trường đơn hàng thành công' });
  } catch (error) {
    console.error('Lưu cấu hình trường đơn hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lưu cấu hình trường đơn hàng thất bại' });
  }
});

// ========== Route cài đặt chung ==========

/**
 * @route GET /api/v1/system/settings
 * @desc Lấy cài đặt hệ thống (chung)
 * @access Private
 */
router.get('/settings', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const configRepository = AppDataSource.getRepository(SystemConfig);
    const configs = await configRepository.find({
      where: { isEnabled: true },
      order: { configGroup: 'ASC', sortOrder: 'ASC' }
    });

    const settings: Record<string, Record<string, unknown>> = {};
    configs.forEach(config => {
      if (!settings[config.configGroup]) {
        settings[config.configGroup] = {};
      }
      settings[config.configGroup][config.configKey] = config.getParsedValue();
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Lấy cài đặt hệ thống thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy cài đặt hệ thống thất bại'
    });
  }
});

/**
 * @route POST /api/v1/system/settings
 * @desc Lưu cài đặt hệ thống (chung)
 * @access Private (Admin)
 */
router.post('/settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type, config } = req.body;
    const configRepository = AppDataSource.getRepository(SystemConfig);

    if (type && config) {
      // Lưu cấu hình loại cụ thể
      for (const [key, value] of Object.entries(config)) {
        let existingConfig = await configRepository.findOne({
          where: { configKey: key, configGroup: type }
        });

        if (existingConfig) {
          existingConfig.configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        } else {
          existingConfig = configRepository.create({
            configKey: key,
            configValue: typeof value === 'object' ? JSON.stringify(value) : String(value),
            valueType: typeof value === 'object' ? 'json' : typeof value as 'string' | 'number' | 'boolean',
            configGroup: type,
            isEnabled: true,
            isSystem: false
          });
        }
        await configRepository.save(existingConfig);
      }
    }

    res.json({
      success: true,
      message: 'Lưu cài đặt thành công'
    });
  } catch (error) {
    console.error('Lưu cài đặt hệ thống thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lưu cài đặt hệ thống thất bại'
    });
  }
});

export default router;
