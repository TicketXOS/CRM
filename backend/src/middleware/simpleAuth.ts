import { Request, Response, NextFunction } from 'express';
import { JwtConfig, JwtPayload } from '../config/jwt';
import { logger } from '../config/logger';

// Mở rộng interface Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware xác thực JWT đơn giản - không phụ thuộc cơ sở dữ liệu
 * Dùng cho các chức năng kết nối thay thế không cần thông tin người dùng đầy đủ
 */
export const authenticateTokenSimple = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

    // Xác minh đơn giản: chỉ kiểm tra token có hợp lệ không, không truy vấn cơ sở dữ liệu
    if (!payload.userId || !payload.username) {
      return res.status(401).json({
        success: false,
        message: 'Mã truy cập không hợp lệ',
        code: 'INVALID_TOKEN'
      });
    }

    next();
  } catch (error) {
    logger.error('Xác thực JWT thất bại:', error);

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Mã truy cập đã hết hạn',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (error.message.includes('invalid')) {
        return res.status(401).json({
          success: false,
          message: 'Mã truy cập không hợp lệ',
          code: 'INVALID_TOKEN'
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Xác thực thất bại',
      code: 'AUTHENTICATION_FAILED'
    });
  }
};

/**
 * Middleware xác thực tùy chọn - nếu có token thì xác minh, không có thì bỏ qua
 * Dùng cho các trường hợp có thể truy cập ẩn danh nhưng khi có token cần xác minh
 */
export const authenticateTokenOptional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Không có token, bỏ qua xác thực
      next();
      return;
    }

    // Có token, tiến hành xác minh
    const payload = JwtConfig.verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    logger.warn('Xác thực tùy chọn thất bại, tiếp tục xử lý yêu cầu:', error);
    // Xác thực thất bại nhưng không chặn yêu cầu tiếp tục
    next();
  }
};
