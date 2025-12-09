import dotenv from 'dotenv';
// Tải biến môi trường - ưu tiên tải cấu hình môi trường phát triển
dotenv.config({ path: '.env.development' });
dotenv.config(); // Tải cấu hình mặc định làm dự phòng

import { getDataSource } from '../config/database';
import { User } from '../entities/User';
import { Department } from '../entities/Department';
import { Role } from '../entities/Role';
import bcrypt from 'bcryptjs';

async function createSuperAdmin() {
  try {
    console.log('Đang khởi tạo kết nối cơ sở dữ liệu...');
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new Error('Không thể lấy nguồn dữ liệu');
    }
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const departmentRepository = dataSource.getRepository(Department);
    const roleRepository = dataSource.getRepository(Role);

    // Đảm bảo phòng ban quản lý tồn tại
    let adminDepartment = await departmentRepository.findOne({
      where: { name: 'Phòng quản lý' }
    });

    if (!adminDepartment) {
      adminDepartment = departmentRepository.create({
        name: 'Phòng quản lý',
        code: 'ADMIN',
        description: 'Phòng ban quản lý hệ thống'
      });
      await departmentRepository.save(adminDepartment);
      console.log('Đã tạo phòng ban quản lý');
    }

    // Đảm bảo vai trò siêu quản trị viên tồn tại
    const superAdminRole = await roleRepository.findOne({
      where: { code: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('Cảnh báo: Vai trò siêu quản trị viên không tồn tại, vui lòng chạy script khởi tạo vai trò và quyền hạn trước');
      console.log('Lệnh chạy: npm run init:roles');
      process.exit(1);
    }

    // Kiểm tra xem đã tồn tại người dùng siêu quản trị viên chưa
    const existingSuperAdmin = await userRepository.findOne({
      where: { username: 'superadmin' }
    });

    if (existingSuperAdmin) {
      console.log('Tài khoản siêu quản trị viên đã tồn tại: superadmin');
      console.log('Nếu cần đặt lại mật khẩu, vui lòng xóa người dùng này thủ công rồi chạy lại script này');
      process.exit(0);
    }

    // Tạo người dùng siêu quản trị viên
    const hashedPassword = await bcrypt.hash('super123456', 12);

    const superAdminUser = userRepository.create({
      username: 'superadmin',
      password: hashedPassword,
      realName: 'Siêu quản trị viên',
      email: 'superadmin@company.com',
      role: 'admin', // Lưu ý: Ở đây sử dụng admin, nhưng sẽ được đặt thành siêu quản trị viên thông qua liên kết vai trò
      status: 'active' as const,
      departmentId: adminDepartment.id
    });

    // Lưu người dùng trước
    const savedUser = await userRepository.save(superAdminUser);

    // Sau đó liên kết vai trò
    savedUser.roles = [superAdminRole];
    await userRepository.save(savedUser);
    console.log('✅ Tài khoản siêu quản trị viên đã được tạo thành công!');
    console.log('Thông tin tài khoản:');
    console.log('  Tên người dùng: superadmin');
    console.log('  Mật khẩu: super123456');
    console.log('  Vai trò: Siêu quản trị viên');
    console.log('  Email: superadmin@company.com');
    console.log('');
    console.log('⚠️  Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên!');

  } catch (error) {
    console.error('❌ Tạo siêu quản trị viên thất bại:', error);
  } finally {
    process.exit(0);
  }
}

// Thêm lời nhắc xác nhận
console.log('Sắp tạo tài khoản siêu quản trị viên...');
console.log('Thông tin tài khoản:');
console.log('  Tên người dùng: superadmin');
console.log('  Mật khẩu: super123456');
console.log('  Vai trò: Siêu quản trị viên');
console.log('');

createSuperAdmin();
