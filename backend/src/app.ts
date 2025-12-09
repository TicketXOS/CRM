import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// Trigger restart
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { initializeDatabase, closeDatabase } from './config/database';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Nhập các route
import authRoutes from './routes/auth';
// import mockAuthRoutes from './routes/mockAuth'; // File đã bị xóa
import userRoutes from './routes/users';
import profileRoutes from './routes/profile';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import systemRoutes from './routes/system';
import sdkRoutes from './routes/sdk';
import mobileSdkRoutes from './routes/mobile-sdk';
import qrConnectionRoutes from './routes/qr-connection';
import alternativeConnectionRoutes from './routes/alternative-connection';
import dashboardRoutes from './routes/dashboard';
import callRoutes from './routes/calls';
import logsRoutes from './routes/logs';
import messageRoutes from './routes/message';
import performanceRoutes from './routes/performance';
import logisticsRoutes from './routes/logistics';
import roleRoutes from './routes/roles';
import permissionRoutes from './routes/permissions';
import sfExpressRoutes from './routes/sfExpress';
import ytoExpressRoutes from './routes/ytoExpress';
import serviceRoutes from './routes/services';
import dataRoutes from './routes/data';
import assignmentRoutes from './routes/assignment';
import smsRoutes from './routes/sms';
import customerShareRoutes from './routes/customerShare';

// Tải biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Tin cậy proxy (để lấy IP thực)
app.set('trust proxy', 1);

// Middleware bảo mật
if (process.env.HELMET_ENABLED !== 'false') {
  const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173']).map(o => o.trim())
  const apiOrigin = `http://localhost:${process.env.PORT || 3000}`
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        // Cho phép frontend kết nối với backend (XHR/Fetch/WebSocket), tránh lỗi net::ERR_FAILED do CSP
        connectSrc: ["'self'", apiOrigin, ...allowedOrigins, "ws:", "wss:"],
      },
    },
  }))
}

// Cấu hình CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
}));

// Middleware nén
if (process.env.COMPRESSION_ENABLED !== 'false') {
  app.use(compression());
}

// Middleware giới hạn tốc độ chung - Môi trường phát triển sử dụng giới hạn lỏng hơn
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 phút
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000'), // Giới hạn mỗi IP tối đa 5000 yêu cầu trong 15 phút
  message: {
    success: false,
    message: 'Yêu cầu quá thường xuyên, vui lòng thử lại sau',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Bỏ qua endpoint kiểm tra sức khỏe
    return req.path === '/health' || req.path.includes('/health')
  }
});

// Middleware giới hạn tốc độ đăng nhập chuyên dụng - Giới hạn nghiêm ngặt nhưng hợp lý
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 phút
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '50'), // Giới hạn mỗi IP tối đa 50 lần thử đăng nhập trong 15 phút
  message: {
    success: false,
    message: 'Thử đăng nhập quá thường xuyên, vui lòng thử lại sau 15 phút',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Môi trường phát triển bỏ qua giới hạn tốc độ đăng nhập
    return process.env.NODE_ENV === 'development';
  }
});

app.use(generalLimiter);

// Middleware ghi log yêu cầu
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.http(message.trim());
    }
  }
}));

// Middleware phân tích
app.use(express.json({
  limit: process.env.UPLOAD_MAX_SIZE || '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({
  extended: true,
  limit: process.env.UPLOAD_MAX_SIZE || '10mb'
}));

// Dịch vụ file tĩnh
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Endpoint kiểm tra sức khỏe
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dịch vụ API CRM đang chạy bình thường',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint kiểm tra sức khỏe API
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    success: true,
    message: 'Dịch vụ API CRM đang chạy bình thường',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Xử lý đường dẫn gốc - Trả về thông tin API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Dịch vụ API CRM',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: API_PREFIX,
    endpoints: {
      health: '/health',
      apiHealth: `${API_PREFIX}/health`,
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      customers: `${API_PREFIX}/customers`,
      products: `${API_PREFIX}/products`,
      orders: `${API_PREFIX}/orders`,
      dashboard: `${API_PREFIX}/dashboard`
    },
    timestamp: new Date().toISOString()
  });
});

// Đăng ký route
// Môi trường phát triển không áp dụng bộ giới hạn tốc độ đăng nhập
if (process.env.NODE_ENV === 'development') {
  app.use(`${API_PREFIX}/auth`, authRoutes);
  // app.use(`${API_PREFIX}/mock-auth`, mockAuthRoutes); // Route Mock đã bị xóa
} else {
  app.use(`${API_PREFIX}/auth`, loginLimiter, authRoutes);
  // app.use(`${API_PREFIX}/mock-auth`, loginLimiter, mockAuthRoutes); // Route Mock đã bị xóa
}
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/profile`, profileRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/system`, systemRoutes);
app.use(`${API_PREFIX}/sdk`, sdkRoutes);
app.use(`${API_PREFIX}/mobile-sdk`, mobileSdkRoutes);
app.use(`${API_PREFIX}/qr-connection`, qrConnectionRoutes);
app.use(`${API_PREFIX}/alternative-connection`, alternativeConnectionRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/calls`, callRoutes);
app.use(`${API_PREFIX}/logs`, logsRoutes);
app.use(`${API_PREFIX}/message`, messageRoutes);
app.use(`${API_PREFIX}/performance`, performanceRoutes);
app.use(`${API_PREFIX}/logistics`, logisticsRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/permissions`, permissionRoutes);
app.use(`${API_PREFIX}/sf-express`, sfExpressRoutes);
app.use(`${API_PREFIX}/yto-express`, ytoExpressRoutes);
app.use(`${API_PREFIX}/services`, serviceRoutes);
app.use(`${API_PREFIX}/data`, dataRoutes);
app.use(`${API_PREFIX}/assignment`, assignmentRoutes);
app.use(`${API_PREFIX}/sms`, smsRoutes);
app.use(`${API_PREFIX}/customer-share`, customerShareRoutes);

// Xử lý 404
app.use(notFoundHandler);

// Xử lý lỗi toàn cục
app.use(errorHandler);

// Khởi động máy chủ
const startServer = async () => {
  try {
    // Khởi tạo kết nối cơ sở dữ liệu
    await initializeDatabase();
    logger.info('✅ Khởi tạo cơ sở dữ liệu hoàn tất');

    // Khởi động máy chủ HTTP
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Dịch vụ API CRM đã khởi động`);
      logger.info(`📍 Địa chỉ dịch vụ: http://localhost:${PORT}`);
      logger.info(`🔗 Tiền tố API: ${API_PREFIX}`);
      logger.info(`🌍 Môi trường chạy: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Kiểm tra sức khỏe: http://localhost:${PORT}/health`);
    });

    // Xử lý tắt máy chủ một cách nhẹ nhàng
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Đã nhận tín hiệu ${signal}, bắt đầu tắt máy chủ một cách nhẹ nhàng...`);

      server.close(async () => {
        logger.info('Máy chủ HTTP đã đóng');

        try {
          await closeDatabase();
          logger.info('Kết nối cơ sở dữ liệu đã đóng');
          process.exit(0);
        } catch (error) {
          logger.error('Lỗi khi đóng kết nối cơ sở dữ liệu:', error);
          process.exit(1);
        }
      });

      // Hết thời gian tắt máy chủ bắt buộc
      setTimeout(() => {
        logger.error('Buộc tắt máy chủ');
        process.exit(1);
      }, 10000);
    };

    // Lắng nghe tín hiệu tắt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Xử lý ngoại lệ chưa được bắt
    process.on('uncaughtException', (error) => {
      logger.error('Ngoại lệ chưa được bắt:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Promise bị từ chối chưa được xử lý:', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Khởi động máy chủ thất bại:', error);
    process.exit(1);
  }
};

// Khởi động ứng dụng
if (require.main === module) {
  startServer();
}

export default app;
