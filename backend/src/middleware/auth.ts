import { Request, Response, NextFunction } from 'express';
import { JwtConfig, JwtPayload } from '../config/jwt';
import { getDataSource } from '../config/database';
import { User } from '../entities/User';
import { logger } from '../config/logger';

// Mở rộng interface Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      currentUser?: User;
    }
  }
}

/**
 * Middleware xác thực JWT
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  try {

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Thiếu mã truy cập',
        code: 'TOKEN_MISSING'
      });
    }

    // Xác minh mã thông báo
    const payload = JwtConfig.verifyAccessToken(token);
    req.user = payload;

    // Lấy thông tin chi tiết người dùng
    const dataSource = getDataSource();
    if (!dataSource) {
      return res.status(500).json({
        success: false,
        message: 'Kết nối cơ sở dữ liệu chưa được khởi tạo',
        code: 'DATABASE_NOT_INITIALIZED'
      });
    }
    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: payload.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản người dùng đã bị vô hiệu hóa',
        code: 'USER_DISABLED'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    logger.error('Xác thực JWT thất bại:', error);
    logger.error('Nội dung Token:', token?.substring(0, 50) + '...');

    if (error instanceof Error) {
      logger.error('Chi tiết lỗi:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      if (error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Mã truy cập đã hết hạn',
          code: 'TOKEN_EXPIRED',
          error: error.message
        });
      }

      if (error.message.includes('invalid')) {
        return res.status(401).json({
          success: false,
          message: 'Mã truy cập không hợp lệ',
          code: 'TOKEN_INVALID',
          error: error.message
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Xác thực thất bại',
      code: 'AUTH_FAILED',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

/**
 * Middleware kiểm tra quyền vai trò
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực',
        code: 'UNAUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Người dùng ${req.user.username} đã cố gắng truy cập tài nguyên yêu cầu quyền ${allowedRoles.join('/')}, nhưng vai trò người dùng là ${userRole}`);

      return res.status(403).json({
        success: false,
        message: 'Quyền không đủ',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra quyền quản trị viên
 * Các vai trò được hỗ trợ: admin, superadmin, super_admin
 */
export const requireAdmin = requireRole(['admin', 'superadmin', 'super_admin']);

/**
 * Middleware kiểm tra quyền quản trị viên hoặc quản lý
 * Các vai trò được hỗ trợ: admin, super_admin, manager, department_manager
 */
export const requireManagerOrAdmin = requireRole([
  'admin',
  'super_admin',
  'superadmin',
  'manager',
  'department_manager'
]);

/**
 * Middleware xác thực tùy chọn (không bắt buộc xác thực)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = JwtConfig.verifyAccessToken(token);
      req.user = payload;

      // Lấy thông tin chi tiết người dùng
      const dataSource = getDataSource();
      if (!dataSource) {
        // Xác thực tùy chọn, tiếp tục thực thi khi cơ sở dữ liệu chưa được khởi tạo
        return next();
      }
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: payload.userId }
      });

      if (user && user.status === 'active') {
        req.currentUser = user;
      }
    }
  } catch (error) {
    // Xác thực tùy chọn thất bại không chặn yêu cầu tiếp tục
    logger.debug('Xác thực tùy chọn thất bại:', error);
  }

  next();
};
