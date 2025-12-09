import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';

// Đảm bảo biến môi trường được tải
dotenv.config();
import { Customer } from '../entities/Customer';
import { Order } from '../entities/Order';
import { Product } from '../entities/Product';
import { Department } from '../entities/Department';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { CustomerGroup } from '../entities/CustomerGroup';
import { CustomerTag } from '../entities/CustomerTag';
import { LogisticsStatus } from '../entities/LogisticsStatus';
import { RejectionReason } from '../entities/RejectionReason';
import { ImprovementGoal } from '../entities/ImprovementGoal';
import { Call } from '../entities/Call';
import { Message } from '../entities/Message';
import { PerformanceMetric } from '../entities/PerformanceMetric';
import { Notification } from '../entities/Notification';
import { ServiceRecord } from '../entities/ServiceRecord';
import { SmsTemplate } from '../entities/SmsTemplate';
import { SmsRecord } from '../entities/SmsRecord';
import { Log } from '../entities/Log';
import { OperationLog } from '../entities/OperationLog';
import { LogisticsTrace } from '../entities/LogisticsTrace';
import { LogisticsTracking } from '../entities/LogisticsTracking';
import { MessageSubscription } from '../entities/MessageSubscription';
import { OrderItem } from '../entities/OrderItem';
import { OrderStatusHistory } from '../entities/OrderStatusHistory';
import { ProductCategory } from '../entities/ProductCategory';
import { SystemConfig } from '../entities/SystemConfig';
import { UserPermission } from '../entities/UserPermission';
import { CustomerShare } from '../entities/CustomerShare';
import path from 'path';

// Chọn cấu hình cơ sở dữ liệu theo biến môi trường
const dbType = process.env.DB_TYPE || (process.env.NODE_ENV === 'production' ? 'mysql' : 'sqlite');

const AppDataSource = new DataSource(
  dbType === 'mysql'
    ? {
        // Cấu hình MySQL
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME || process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || process.env.DB_NAME || 'crm',
        synchronize: false, // Môi trường sản xuất không tự động đồng bộ
        logging: process.env.NODE_ENV === 'development',
        entities: [
          User,
          Customer,
          Order,
          Product,
          Department,
          Role,
          Permission,
          CustomerGroup,
          CustomerTag,
          LogisticsStatus,
          RejectionReason,
          ImprovementGoal,
          Call,
          Message,
          PerformanceMetric,
          Notification,
          ServiceRecord,
          SmsTemplate,
          SmsRecord,
          Log,
          OperationLog,
          LogisticsTrace,
          LogisticsTracking,
          MessageSubscription,
          OrderItem,
          OrderStatusHistory,
          ProductCategory,
          SystemConfig,
          UserPermission,
          CustomerShare
        ],
        migrations: [],
        subscribers: [],
      }
    : {
        // Môi trường phát triển sử dụng SQLite
        type: 'sqlite',
        database: path.join(process.cwd(), 'data', 'crm.db'),
        synchronize: true,
        logging: false,
        entities: [
          User,
          Customer,
          Order,
          Product,
          Department,
          Role,
          Permission,
          CustomerGroup,
          CustomerTag,
          LogisticsStatus,
          RejectionReason,
          ImprovementGoal,
          Call,
          Message,
          PerformanceMetric,
          Notification,
          ServiceRecord,
          SmsTemplate,
          SmsRecord,
          Log,
          OperationLog,
          LogisticsTrace,
          LogisticsTracking,
          MessageSubscription,
          OrderItem,
          OrderStatusHistory,
          ProductCategory,
          SystemConfig,
          UserPermission,
          CustomerShare
        ],
        migrations: [],
        subscribers: [],
      }
);

// Xuất AppDataSource
export { AppDataSource };

// Lấy phiên bản nguồn dữ liệu
export const getDataSource = (): DataSource | null => {
  return AppDataSource;
};

// Khởi tạo kết nối cơ sở dữ liệu
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Kết nối cơ sở dữ liệu thành công');

    // Trong môi trường phát triển, đồng bộ cấu trúc cơ sở dữ liệu
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Môi trường phát triển: Đang đồng bộ cấu trúc cơ sở dữ liệu...');
    }

    // Khởi tạo quyền vai trò đã bị vô hiệu hóa - Cơ sở dữ liệu đã có dữ liệu mặc định, không cần tự động khởi tạo
    // Nếu cần khởi tạo, vui lòng thực thi thủ công các câu lệnh INSERT trong database/schema.sql
    console.log('ℹ️ Khởi tạo quyền vai trò đã bị vô hiệu hóa (sử dụng dữ liệu mặc định trong cơ sở dữ liệu)');
  } catch (error) {
    console.error('❌ Kết nối cơ sở dữ liệu thất bại:', error);
    throw error;
  }
};

// Đóng kết nối cơ sở dữ liệu
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Kết nối cơ sở dữ liệu đã đóng');
    }
  } catch (error) {
    console.error('❌ Đóng kết nối cơ sở dữ liệu thất bại:', error);
    throw error;
  }
};
