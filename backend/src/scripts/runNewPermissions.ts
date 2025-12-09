import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { initNewRolesAndPermissions } from './newRolesAndPermissions';
import { logger } from '../config/logger';

async function main() {
  try {
    logger.info('🚀 Bắt đầu thực thi cấu hình quyền hạn mới...');

    // Khởi tạo kết nối cơ sở dữ liệu
    if (!AppDataSource?.isInitialized) {
      await AppDataSource?.initialize();
      logger.info('✅ Kết nối cơ sở dữ liệu đã được thiết lập');
    }

    // Thực thi cấu hình quyền hạn mới
    await initNewRolesAndPermissions();

    logger.info('🎉 Thực thi cấu hình quyền hạn mới hoàn tất!');
  } catch (error) {
    logger.error('❌ Thực thi thất bại:', error);
    process.exit(1);
  } finally {
    if (AppDataSource?.isInitialized) {
      await AppDataSource?.destroy();
      logger.info('📦 Kết nối cơ sở dữ liệu đã đóng');
    }
  }
}

main();
