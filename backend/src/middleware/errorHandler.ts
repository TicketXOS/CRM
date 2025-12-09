import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Lớp lỗi tùy chỉnh
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Lớp lỗi nghiệp vụ
export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR') {
    super(message, 400, code);
  }
}

// Lớp lỗi xác thực
export class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// Lớp lỗi không tìm thấy
export class NotFoundError extends AppError {
  constructor(resource: string = 'Tài nguyên') {
    super(`${resource} không tồn tại`, 404, 'NOT_FOUND');
  }
}

// Lớp lỗi quyền truy cập
export class ForbiddenError extends AppError {
  constructor(message: string = 'Quyền không đủ') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Lớp lỗi chưa xác thực
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Chưa xác thực') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Middleware xử lý lỗi toàn cục
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Lỗi máy chủ nội bộ';
  let details: any = undefined;

  // Xử lý lỗi tùy chỉnh
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;

    if (error instanceof ValidationError) {
      details = error.details;
    }
  }
  // Xử lý lỗi cơ sở dữ liệu
  else if (error.name === 'QueryFailedError') {
    statusCode = 400;
    code = 'DATABASE_ERROR';

    // Xử lý lỗi MySQL
    const dbError = error as any;
    if (dbError.code === 'ER_DUP_ENTRY') {
      message = 'Dữ liệu trùng lặp, vui lòng kiểm tra trường duy nhất';
      code = 'DUPLICATE_ENTRY';
    } else if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
      message = 'Dữ liệu liên quan không tồn tại';
      code = 'FOREIGN_KEY_ERROR';
    } else {
      message = 'Thao tác cơ sở dữ liệu thất bại';
    }
  }
  // Xử lý lỗi phân tích JSON
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Định dạng JSON không đúng';
  }
  // Xử lý các lỗi đã biết khác
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Xác thực dữ liệu thất bại';
  }

  // Ghi log lỗi
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: (req as any).user || null
  };

  if (statusCode >= 500) {
    logger.error('Lỗi máy chủ:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      request: logData.request,
      user: logData.user
    });
  } else {
    logger.warn('Lỗi phía khách hàng:', {
      error: {
        name: error.name,
        message: error.message,
        code: code
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      user: (req as any).user || null
    });
  }

  // Xây dựng phản hồi
  const response: any = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Môi trường phát triển trả về thông tin lỗi chi tiết
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  // Thêm chi tiết lỗi xác thực
  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

/**
 * Middleware xử lý lỗi 404
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError('Điểm cuối API');
  next(error);
};

/**
 * Decorator bắt lỗi bất đồng bộ
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
