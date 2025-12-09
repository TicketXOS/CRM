import { getDataSource } from '../config/database'
import { Role } from '../entities/Role'
import { Permission } from '../entities/Permission'

// Đảm bảo sử dụng cấu hình môi trường phát triển
process.env.NODE_ENV = 'development'

async function updateMenuPermissions() {
  const AppDataSource = getDataSource()

  if (!AppDataSource) {
    throw new Error('Không thể lấy nguồn dữ liệu')
  }

  try {
    await AppDataSource.initialize()
    console.log('Kết nối cơ sở dữ liệu thành công')

    // Danh sách quyền hạn mới
    const newPermissions = [
      // Quyền hạn mới quản lý khách hàng
      { code: 'customer:groups', name: 'Quản lý nhóm khách hàng', description: 'Quản lý nhóm khách hàng' },
      { code: 'customer:tags', name: 'Quản lý nhãn khách hàng', description: 'Quản lý nhãn khách hàng' },

      // Quyền hạn mới quản lý dịch vụ
      { code: 'service:sms', name: 'Quản lý tin nhắn SMS', description: 'Quản lý gửi tin nhắn và mẫu' },

      // Quyền hạn mới quản lý logistics
      { code: 'logistics:shipping', name: 'Danh sách giao hàng', description: 'Xem và quản lý danh sách giao hàng' },
      { code: 'logistics:status', name: 'Cập nhật trạng thái logistics', description: 'Cập nhật trạng thái logistics' },
      { code: 'logistics:companies', name: 'Quản lý công ty logistics', description: 'Quản lý thông tin công ty logistics' },

      // Quyền hạn mới quản lý tài liệu
      { code: 'data:list', name: 'Danh sách tài liệu', description: 'Xem danh sách tài liệu' },
      { code: 'data:recycle', name: 'Thùng rác', description: 'Quản lý tài liệu trong thùng rác' },

      // Quyền hạn mới quản lý sản phẩm
      { code: 'product:analytics', name: 'Phân tích sản phẩm', description: 'Xem dữ liệu phân tích sản phẩm' },

      // Quyền hạn mới quản lý hệ thống
      { code: 'system:settings', name: 'Cài đặt hệ thống', description: 'Quản lý cài đặt hệ thống' }
    ]

    const permissionRepository = AppDataSource.getRepository(Permission)
    const roleRepository = AppDataSource.getRepository(Role)

    // 1. Tạo hoặc cập nhật quyền hạn
    console.log('Đang tạo/cập nhật quyền hạn...')
    for (const permData of newPermissions) {
      let permission = await permissionRepository.findOne({
        where: { code: permData.code }
      })

      if (!permission) {
        permission = permissionRepository.create({
          code: permData.code,
          name: permData.name,
          description: permData.description,
          module: permData.code.split(':')[0], // Trích xuất tên mô-đun từ code
          status: 'active'
        })
        await permissionRepository.save(permission)
        console.log(`✅ Tạo quyền hạn: ${permData.name} (${permData.code})`)
      } else {
        console.log(`ℹ️  Quyền hạn đã tồn tại: ${permData.name} (${permData.code})`)
      }
    }

    // 2. Lấy vai trò siêu quản trị viên
    const superAdminRole = await roleRepository.findOne({
      where: { code: 'super_admin' },
      relations: ['permissions']
    })

    if (!superAdminRole) {
      console.error('❌ Không tìm thấy vai trò siêu quản trị viên')
      return
    }

    console.log(`Tìm thấy vai trò siêu quản trị viên: ${superAdminRole.name}`)

    // 3. Lấy tất cả quyền hạn
    const allPermissions = await permissionRepository.find()
    console.log(`Cơ sở dữ liệu có tổng cộng ${allPermissions.length} quyền hạn`)

    // 4. Phân bổ tất cả quyền hạn cho siêu quản trị viên
    superAdminRole.permissions = allPermissions
    await roleRepository.save(superAdminRole)

    console.log('✅ Cập nhật quyền hạn vai trò siêu quản trị viên hoàn tất')
    console.log(`Siêu quản trị viên hiện có ${allPermissions.length} quyền hạn`)

    // 5. Xác minh quyền hạn siêu quản trị viên
    const updatedSuperAdmin = await roleRepository.findOne({
      where: { code: 'super_admin' },
      relations: ['permissions']
    })

    console.log('\n=== Xác minh quyền hạn siêu quản trị viên ===')
    console.log(`Tên vai trò: ${updatedSuperAdmin?.name}`)
    console.log(`Số lượng quyền hạn: ${updatedSuperAdmin?.permissions?.length}`)

    // Kiểm tra xem tất cả quyền hạn mới đã được phân bổ chưa
    const newPermissionCodes = newPermissions.map(p => p.code)
    const assignedPermissionCodes = updatedSuperAdmin?.permissions?.map(p => p.code) || []

    console.log('\n=== Kiểm tra quyền hạn mới ===')
    for (const code of newPermissionCodes) {
      const isAssigned = assignedPermissionCodes.includes(code)
      console.log(`${isAssigned ? '✅' : '❌'} ${code}: ${isAssigned ? 'Đã phân bổ' : 'Chưa phân bổ'}`)
    }

    console.log('\n✅ Cập nhật quyền hạn menu hoàn tất!')

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật quyền hạn menu:', error)
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  }
}

// Chạy script
updateMenuPermissions()
