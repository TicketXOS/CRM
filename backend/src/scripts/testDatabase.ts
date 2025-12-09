#!/usr/bin/env node

/**
 * Script kiểm tra kết nối cơ sở dữ liệu hệ thống CRM
 * Dùng để xác minh cấu hình cơ sở dữ liệu và trạng thái kết nối
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Tải biến môi trường
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Màu sắc đầu ra
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  charset: string;
  timezone: string;
}

/**
 * Lấy cấu hình cơ sở dữ liệu
 */
function getDatabaseConfig(): DatabaseConfig {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'crm_system',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    timezone: process.env.DB_TIMEZONE || '+08:00'
  };

  return config;
}

/**
 * Tạo nguồn dữ liệu
 */
function createDataSource(config: DatabaseConfig): DataSource {
  return new DataSource({
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    charset: config.charset,
    timezone: config.timezone,
    synchronize: false,
    logging: false,
    connectTimeout: 10000,
    acquireTimeout: 10000
  });
}

/**
 * Kiểm tra kết nối cơ sở dữ liệu
 */
async function testConnection(dataSource: DataSource): Promise<boolean> {
  try {
    await dataSource.initialize();
    log.success('Kết nối cơ sở dữ liệu thành công');

    // Kiểm tra truy vấn
    const result = await dataSource.query('SELECT 1 as test');
    if (result && result[0] && result[0].test === 1) {
      log.success('Kiểm tra truy vấn cơ sở dữ liệu đã vượt qua');
      return true;
    } else {
      log.error('Kiểm tra truy vấn cơ sở dữ liệu thất bại');
      return false;
    }
  } catch (error) {
    log.error(`Kết nối cơ sở dữ liệu thất bại: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

/**
 * Kiểm tra phiên bản cơ sở dữ liệu
 */
async function checkDatabaseVersion(dataSource: DataSource): Promise<void> {
  try {
    const result = await dataSource.query('SELECT VERSION() as version');
    const version = result[0]?.version;
    if (version) {
      log.info(`Phiên bản MySQL: ${version}`);

      // Kiểm tra tương thích phiên bản
      const majorVersion = parseInt(version.split('.')[0]);
      if (majorVersion >= 8) {
        log.success('Phiên bản MySQL tương thích (8.0+)');
      } else if (majorVersion >= 5) {
        log.warning('Phiên bản MySQL cũ, nên nâng cấp lên 8.0+');
      } else {
        log.error('Phiên bản MySQL quá cũ, có thể có vấn đề tương thích');
      }
    }
  } catch (error) {
    log.error(`Lấy phiên bản cơ sở dữ liệu thất bại: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Kiểm tra bảng cơ sở dữ liệu
 */
async function checkTables(dataSource: DataSource): Promise<void> {
  try {
    const tables = await dataSource.query('SHOW TABLES');
    log.info(`Số lượng bảng cơ sở dữ liệu: ${tables.length}`);

    if (tables.length === 0) {
      log.warning('Không có bảng trong cơ sở dữ liệu, vui lòng chạy script khởi tạo cơ sở dữ liệu');
      return;
    }

    // Kiểm tra các bảng quan trọng
    const tableNames = tables.map((table: any) => Object.values(table)[0]);
    const requiredTables = ['users', 'departments', 'customers', 'products', 'orders'];

    log.info('Kiểm tra các bảng quan trọng:');
    for (const tableName of requiredTables) {
      if (tableNames.includes(tableName)) {
        log.success(`✓ ${tableName}`);
      } else {
        log.error(`✗ ${tableName} (thiếu)`);
      }
    }

    // Kiểm tra dữ liệu bảng người dùng
    try {
      const userCount = await dataSource.query('SELECT COUNT(*) as count FROM users');
      const count = userCount[0]?.count || 0;
      log.info(`Số bản ghi bảng người dùng: ${count}`);

      if (count === 0) {
        log.warning('Bảng người dùng trống, vui lòng đảm bảo đã nhập dữ liệu ban đầu');
      }
    } catch (error) {
      log.error('Không thể truy vấn bảng người dùng');
    }

  } catch (error) {
    log.error(`Kiểm tra bảng cơ sở dữ liệu thất bại: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Hàm chính
 */
async function main(): Promise<void> {
  log.title('==========================================');
  log.title('    Kiểm tra kết nối cơ sở dữ liệu hệ thống CRM');
  log.title('==========================================');
  console.log();

  // Kiểm tra biến môi trường
  log.info('Kiểm tra cấu hình môi trường...');
  const config = getDatabaseConfig();

  log.info('Cấu hình cơ sở dữ liệu:');
  console.log(`  Máy chủ: ${config.host}`);
  console.log(`  Cổng: ${config.port}`);
  console.log(`  Người dùng: ${config.username}`);
  console.log(`  Cơ sở dữ liệu: ${config.database}`);
  console.log(`  Bộ ký tự: ${config.charset}`);
  console.log(`  Múi giờ: ${config.timezone}`);
  console.log();

  // Tạo nguồn dữ liệu
  const dataSource = createDataSource(config);

  try {
    // Kiểm tra kết nối
    log.info('Kiểm tra kết nối cơ sở dữ liệu...');
    const connected = await testConnection(dataSource);

    if (!connected) {
      log.error('Kết nối cơ sở dữ liệu thất bại, vui lòng kiểm tra cấu hình');
      process.exit(1);
    }

    // Khởi tạo lại để kiểm tra tiếp theo
    await dataSource.initialize();

    // Kiểm tra phiên bản cơ sở dữ liệu
    log.info('Kiểm tra phiên bản cơ sở dữ liệu...');
    await checkDatabaseVersion(dataSource);
    console.log();

    // Kiểm tra bảng cơ sở dữ liệu
    log.info('Kiểm tra cấu trúc bảng cơ sở dữ liệu...');
    await checkTables(dataSource);
    console.log();

    log.title('==========================================');
    log.success('Kiểm tra cơ sở dữ liệu hoàn tất!');
    log.title('==========================================');

  } catch (error) {
    log.error(`Đã xảy ra lỗi trong quá trình kiểm tra: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Chạy kiểm tra
if (require.main === module) {
  main().catch((error) => {
    console.error('Thực thi script kiểm tra thất bại:', error);
    process.exit(1);
  });
}

export { main as testDatabase };
