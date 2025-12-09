import dotenv from 'dotenv';
// Tải biến môi trường - ưu tiên tải cấu hình môi trường phát triển
dotenv.config({ path: '.env.development' });
dotenv.config(); // Tải cấu hình mặc định làm dự phòng

import { getDataSource, initializeDatabase } from '../config/database';
import { User } from '../entities/User';
import { Department } from '../entities/Department';
import bcrypt from 'bcryptjs';

async function initTestUser() {
  try {
    console.log('Đang khởi tạo kết nối cơ sở dữ liệu...');
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new Error('Không thể lấy nguồn dữ liệu');
    }
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const departmentRepository = dataSource.getRepository(Department);

    // Tạo phòng ban mặc định (nếu chưa tồn tại)
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

    // Kiểm tra xem đã tồn tại người dùng admin chưa
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      // Tạo người dùng quản trị viên
      const hashedPassword = '$2a$12$TVl3t.lovkbJzvstu5OF1uqKmj0sdcwVTDfNXHulgL/Q2PJxTp4pO'; // admin123

      const adminUser = userRepository.create({
        username: 'admin',
        password: hashedPassword,
        realName: 'Quản trị viên hệ thống',
        email: 'admin@company.com',
        role: 'admin' as const,
        status: 'active' as const,
        departmentId: adminDepartment.id
      });

      await userRepository.save(adminUser);
      console.log('Đã tạo người dùng quản trị viên: admin / admin123');
    } else {
      console.log('Người dùng quản trị viên đã tồn tại');
    }

    // Tạo các phòng ban khác
    let salesDepartment = await departmentRepository.findOne({
      where: { name: 'Phòng bán hàng' }
    });

    if (!salesDepartment) {
      salesDepartment = departmentRepository.create({
        name: 'Phòng bán hàng',
        code: 'SALES',
        description: 'Phòng ban bán hàng'
      });
      await departmentRepository.save(salesDepartment);
      console.log('Đã tạo phòng ban bán hàng');
    }

    let serviceDepartment = await departmentRepository.findOne({
      where: { name: 'Phòng dịch vụ khách hàng' }
    });

    if (!serviceDepartment) {
      serviceDepartment = departmentRepository.create({
        name: 'Phòng dịch vụ khách hàng',
        code: 'SERVICE',
        description: 'Phòng ban dịch vụ khách hàng'
      });
      await departmentRepository.save(serviceDepartment);
      console.log('Đã tạo phòng ban dịch vụ khách hàng');
    }

    const hashedPassword = '$2a$12$TVl3t.lovkbJzvstu5OF1uqKmj0sdcwVTDfNXHulgL/Q2PJxTp4pO'; // admin123

    // Danh sách người dùng kiểm thử
    const testUsers = [
      {
        username: 'manager',
        password: hashedPassword,
        realName: 'Quản lý phòng ban',
        email: 'manager@company.com',
        role: 'manager' as const,
        status: 'active' as const,
        departmentId: salesDepartment.id
      },
      {
        username: 'sales001',
        password: hashedPassword,
        realName: 'Nhân viên bán hàng 001',
        email: 'sales001@company.com',
        role: 'sales' as const,
        status: 'active' as const,
        departmentId: salesDepartment.id
      },
      {
        username: 'service001',
        password: hashedPassword,
        realName: 'Nhân viên dịch vụ khách hàng 001',
        email: 'service001@company.com',
        role: 'service' as const,
        status: 'active' as const,
        departmentId: serviceDepartment.id
      }
    ];

    // Tạo người dùng kiểm thử
    for (const userData of testUsers) {
      const existingUser = await userRepository.findOne({
        where: { username: userData.username }
      });

      if (!existingUser) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        console.log(`Đã tạo người dùng kiểm thử: ${userData.username} / admin123`);
      } else {
        console.log(`Người dùng ${userData.username} đã tồn tại`);
      }
    }

    console.log('Khởi tạo người dùng kiểm thử hoàn tất!');

  } catch (error) {
    console.error('Khởi tạo người dùng kiểm thử thất bại:', error);
  } finally {
    process.exit(0);
  }
}

initTestUser();
