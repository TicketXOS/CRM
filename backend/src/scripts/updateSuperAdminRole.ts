import dotenv from 'dotenv';
// Tải biến môi trường
dotenv.config();

import { getDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role } from '../entities/Role';

async function updateSuperAdminRole() {
  try {
    console.log('Đang khởi tạo kết nối cơ sở dữ liệu...');
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new Error('Không thể lấy nguồn dữ liệu');
    }
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    // Tìm người dùng siêu quản trị viên
    const superAdminUser = await userRepository.findOne({
      where: { username: 'superadmin' },
      relations: ['roles']
    });

    if (!superAdminUser) {
      console.log('❌ Không tìm thấy tài khoản siêu quản trị viên: superadmin');
      process.exit(1);
    }

    // Tìm vai trò siêu quản trị viên
    const superAdminRole = await roleRepository.findOne({
      where: { code: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('❌ Không tìm thấy vai trò siêu quản trị viên: super_admin');
      console.log('Vui lòng chạy script khởi tạo vai trò và quyền hạn trước: npm run init:roles');
      process.exit(1);
    }

    // Kiểm tra xem đã liên kết vai trò siêu quản trị viên chưa
    const hasRole = superAdminUser.roles?.some(role => role.code === 'super_admin');

    if (hasRole) {
      console.log('✅ Tài khoản siêu quản trị viên đã được liên kết đúng với vai trò siêu quản trị viên');
    } else {
      // Liên kết vai trò siêu quản trị viên
      if (!superAdminUser.roles) {
        superAdminUser.roles = [];
      }
      superAdminUser.roles.push(superAdminRole);
      await userRepository.save(superAdminUser);
      console.log('✅ Đã liên kết vai trò siêu quản trị viên cho tài khoản siêu quản trị viên');
    }

    console.log('');
    console.log('Thông tin tài khoản siêu quản trị viên:');
    console.log('  Tên người dùng: superadmin');
    console.log('  Mật khẩu: super123456');
    console.log('  Vai trò: Siêu quản trị viên');
    console.log('  Số lượng vai trò đã liên kết:', superAdminUser.roles.length);

  } catch (error) {
    console.error('❌ Cập nhật vai trò siêu quản trị viên thất bại:', error);
  } finally {
    process.exit(0);
  }
}

updateSuperAdminRole();
