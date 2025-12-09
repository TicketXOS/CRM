import winston from 'winston';
import path from 'path';

// Cấp độ nhật ký
const logLevel = process.env.LOG_LEVEL || 'info';

// Định dạng nhật ký
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Thêm thông tin ngăn xếp (nếu có lỗi)
    if (stack) {
      log += `\n${stack}`;
    }

    // Thêm siêu dữ liệu
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Tạo thư mục nhật ký
const logsDir = path.join(process.cwd(), 'logs');

// Tạo phiên bản logger
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'crm-api' },
  transports: [
    // Tệp nhật ký lỗi
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 14, // Giữ lại 14 ngày
      tailable: true
    }),

    // Tệp nhật ký kết hợp
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 14, // Giữ lại 14 ngày
      tailable: true
    }),

    // Tệp nhật ký truy cập
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 7, // Giữ lại 7 ngày
      tailable: true
    })
  ],

  // Xử lý ngoại lệ
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],

  // Xử lý từ chối
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Môi trường phát triển thêm đầu ra console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;

        // Thêm thông tin ngăn xếp (nếu có lỗi)
        if (stack) {
          log += `\n${stack}`;
        }

        // Thêm siêu dữ liệu
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return log;
      })
    )
  }));
}

// Bộ ghi nhật ký thao tác
export const operationLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'operations.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 30, // Giữ lại 30 ngày
      tailable: true
    })
  ]
});

// Bộ ghi nhật ký hiệu suất
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 7, // Giữ lại 7 ngày
      tailable: true
    })
  ]
});

// Xuất logger mặc định
export default logger;
