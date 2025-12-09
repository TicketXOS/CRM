import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { JwtConfig } from '../config/jwt';

const router = Router();

// Cấu hình multer để tải lên ảnh đại diện
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên tệp duy nhất
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép tệp hình ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên tệp hình ảnh'));
    }
  }
});

/**
 * Middleware xác thực đơn giản, không phụ thuộc cơ sở dữ liệu
 */
const simpleAuth = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Thiếu mã thông báo truy cập',
        code: 'TOKEN_MISSING'
      });
    }

    // Xác minh mã thông báo
    const payload = JwtConfig.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Xác thực JWT thất bại',
      code: 'TOKEN_INVALID'
    });
  }
};

/**
 * @route GET /api/v1/profile
 * @desc Lấy thông tin người dùng hiện tại
 * @access Private
 */
router.get('/', simpleAuth, (req, res) => {
  // Lấy thông tin người dùng từ JWT token
  const user = (req as any).user;

  res.json({
    success: true,
    data: {
      id: user.id || '1',
      username: user.username || 'admin',
      name: user.name || 'Quản trị viên',
      email: user.email || 'admin@example.com',
      phone: user.phone || '13800138000',
      department: user.department || 'Phòng kỹ thuật',
      role: user.role || 'admin',
      avatar: user.avatar || '',
      preferences: {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        emailNotifications: true,
        browserNotifications: true,
        smsNotifications: false,
        pageSize: 20
      },
      lastLoginTime: new Date().toISOString(),
      createTime: user.createTime || new Date().toISOString()
    }
  });
});

/**
 * @route PUT /api/v1/profile
 * @desc Cập nhật thông tin người dùng hiện tại
 * @access Private
 */
router.put('/', simpleAuth, (req, res) => {
  const user = (req as any).user;
  const updateData = req.body;

  // Ở đây nên cập nhật cơ sở dữ liệu, hiện tại trả về dữ liệu mô phỏng
  res.json({
    success: true,
    message: 'Thông tin cá nhân đã được cập nhật',
    data: {
      id: user.id || '1',
      username: user.username || 'admin',
      name: updateData.name || user.name || 'Quản trị viên',
      email: updateData.email || user.email || 'admin@example.com',
      phone: updateData.phone || user.phone || '13800138000',
      department: user.department || 'Phòng kỹ thuật',
      role: user.role || 'admin',
      avatar: updateData.avatar || user.avatar || '',
      preferences: updateData.preferences || {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        emailNotifications: true,
        browserNotifications: true,
        smsNotifications: false,
        pageSize: 20
      },
      lastLoginTime: new Date().toISOString(),
      createTime: user.createTime || new Date().toISOString()
    }
  });
});

/**
 * @route GET /api/v1/profile/preferences
 * @desc Lấy cài đặt tùy chọn người dùng
 * @access Private
 */
router.get('/preferences', simpleAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      language: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
      emailNotifications: true,
      browserNotifications: true,
      smsNotifications: false,
      pageSize: 20
    }
  });
});

/**
 * @route PUT /api/v1/profile/preferences
 * @desc Cập nhật cài đặt tùy chọn người dùng
 * @access Private
 */
router.put('/preferences', simpleAuth, (req, res) => {
  const preferences = req.body;

  // Ở đây nên lưu vào cơ sở dữ liệu, hiện tại trả về dữ liệu mô phỏng
  res.json({
    success: true,
    message: 'Cài đặt tùy chọn đã được cập nhật',
    data: preferences
  });
});

/**
 * @route POST /api/v1/profile/avatar
 * @desc Tải lên ảnh đại diện người dùng
 * @access Private
 */
router.post('/avatar', simpleAuth, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tệp ảnh đại diện để tải lên',
        code: 'NO_FILE_UPLOADED'
      });
    }

    // Tạo URL ảnh đại diện
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Ở đây nên cập nhật trường ảnh đại diện trong cơ sở dữ liệu
    // Hiện tại trả về phản hồi mô phỏng
    return res.json({
      success: true,
      message: 'Tải lên ảnh đại diện thành công',
      data: {
        url: avatarUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Tải lên ảnh đại diện thất bại:', error);
    return res.status(500).json({
      success: false,
      message: 'Tải lên ảnh đại diện thất bại',
      code: 'UPLOAD_ERROR'
    });
  }
});

/**
 * @route PUT /api/v1/profile/password
 * @desc Đổi mật khẩu người dùng
 * @access Private
 */
router.put('/password', simpleAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Xác thực trường bắt buộc
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền tất cả các trường bắt buộc',
        code: 'MISSING_FIELDS'
      });
    }

    // Xác thực mật khẩu mới và mật khẩu xác nhận có khớp không
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và mật khẩu xác nhận không khớp',
        code: 'PASSWORD_MISMATCH'
      });
    }

    // Xác thực độ mạnh mật khẩu
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Ở đây nên xác minh mật khẩu hiện tại có đúng không
    // Hiện tại mô phỏng xác minh thành công
    const user = (req as any).user;

    // Mô phỏng xác minh mật khẩu (trong ứng dụng thực tế nên lấy thông tin người dùng từ cơ sở dữ liệu và xác minh)
    if (currentPassword !== 'admin123') { // Mô phỏng mật khẩu hiện tại
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Mã hóa mật khẩu mới
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Ở đây nên cập nhật mật khẩu người dùng trong cơ sở dữ liệu
    // Hiện tại trả về phản hồi mô phỏng
    return res.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
      data: {
        message: 'Mật khẩu đã được cập nhật thành công, vui lòng sử dụng mật khẩu mới để đăng nhập'
      }
    });
  } catch (error) {
    console.error('Đổi mật khẩu thất bại:', error);
    return res.status(500).json({
      success: false,
      message: 'Đổi mật khẩu thất bại',
      code: 'PASSWORD_UPDATE_ERROR'
    });
  }
});

export default router;
