import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { logger } from '../config/logger';

// Định nghĩa dữ liệu quyền hạn đầy đủ
const defaultPermissions = [
  // Bảng điều khiển dữ liệu
  {
    name: 'Bảng điều khiển dữ liệu',
    code: 'dashboard',
    description: 'Mô-đun bảng điều khiển dữ liệu',
    module: 'dashboard',
    type: 'menu',
    path: '/dashboard',
    icon: 'DataAnalysis',
    sort: 1,
    children: [
      { name: 'Xem dữ liệu cá nhân', code: 'dashboard:personal', type: 'button', sort: 1 },
      { name: 'Xem dữ liệu phòng ban', code: 'dashboard:department', type: 'button', sort: 2 },
      { name: 'Xem tất cả dữ liệu', code: 'dashboard:all', type: 'button', sort: 3 }
    ]
  },

  // Quản lý khách hàng
  {
    name: 'Quản lý khách hàng',
    code: 'customer',
    description: 'Mô-đun quản lý khách hàng',
    module: 'customer',
    type: 'menu',
    path: '/customer',
    icon: 'Avatar',
    sort: 2,
    children: [
      {
        name: 'Danh sách khách hàng',
        code: 'customer:list',
        description: 'Trang danh sách khách hàng',
        module: 'customer',
        type: 'menu',
        path: '/customer/list',
        icon: 'List',
        sort: 1,
        children: [
          { name: 'Xem khách hàng cá nhân', code: 'customer:view:personal', type: 'button', sort: 1 },
          { name: 'Xem khách hàng phòng ban', code: 'customer:view:department', type: 'button', sort: 2 },
          { name: 'Xem tất cả khách hàng', code: 'customer:view:all', type: 'button', sort: 3 },
          { name: 'Thêm khách hàng', code: 'customer:add', type: 'button', sort: 4 },
          { name: 'Chỉnh sửa khách hàng', code: 'customer:edit', type: 'button', sort: 5 },
          { name: 'Xóa khách hàng', code: 'customer:delete', type: 'button', sort: 6 },
          { name: 'Nhập khách hàng', code: 'customer:import', type: 'button', sort: 7 },
          { name: 'Xuất khách hàng', code: 'customer:export', type: 'button', sort: 8 }
        ]
      }
    ]
  },

  // Quản lý đơn hàng
  {
    name: 'Quản lý đơn hàng',
    code: 'order',
    description: 'Mô-đun quản lý đơn hàng',
    module: 'order',
    type: 'menu',
    path: '/order',
    icon: 'Document',
    sort: 3,
    children: [
      {
        name: 'Danh sách đơn hàng',
        code: 'order:list',
        description: 'Trang danh sách đơn hàng',
        module: 'order',
        type: 'menu',
        path: '/order/list',
        icon: 'List',
        sort: 1,
        children: [
          { name: 'Xem đơn hàng cá nhân', code: 'order:view:personal', type: 'button', sort: 1 },
          { name: 'Xem đơn hàng phòng ban', code: 'order:view:department', type: 'button', sort: 2 },
          { name: 'Xem tất cả đơn hàng', code: 'order:view:all', type: 'button', sort: 3 },
          { name: 'Thêm đơn hàng', code: 'order:add', type: 'button', sort: 4 },
          { name: 'Chỉnh sửa đơn hàng', code: 'order:edit', type: 'button', sort: 5 },
          { name: 'Xóa đơn hàng', code: 'order:delete', type: 'button', sort: 6 },
          { name: 'Duyệt đơn hàng', code: 'order:audit', type: 'button', sort: 7 }
        ]
      }
    ]
  },

  // Quản lý dịch vụ
  {
    name: 'Quản lý dịch vụ',
    code: 'service',
    description: 'Mô-đun quản lý dịch vụ',
    module: 'service',
    type: 'menu',
    path: '/service',
    icon: 'Service',
    sort: 4,
    children: [
      {
        name: 'Quản lý cuộc gọi',
        code: 'service:call',
        description: 'Trang quản lý cuộc gọi',
        module: 'service',
        type: 'menu',
        path: '/service/call',
        icon: 'Phone',
        sort: 1,
        children: [
          { name: 'Xem lịch sử cuộc gọi', code: 'service:call:view', type: 'button', sort: 1 },
          { name: 'Thêm lịch sử cuộc gọi', code: 'service:call:add', type: 'button', sort: 2 },
          { name: 'Chỉnh sửa lịch sử cuộc gọi', code: 'service:call:edit', type: 'button', sort: 3 }
        ]
      }
    ]
  },

  // Thống kê hiệu suất
  {
    name: 'Thống kê hiệu suất',
    code: 'performance',
    description: 'Mô-đun thống kê hiệu suất',
    module: 'performance',
    type: 'menu',
    path: '/performance',
    icon: 'TrendCharts',
    sort: 5,
    children: [
      {
        name: 'Hiệu suất cá nhân',
        code: 'performance:personal',
        description: 'Trang hiệu suất cá nhân',
        module: 'performance',
        type: 'menu',
        path: '/performance/personal',
        icon: 'User',
        sort: 1,
        children: [
          { name: 'Xem hiệu suất cá nhân', code: 'performance:personal:view', type: 'button', sort: 1 }
        ]
      },
      {
        name: 'Hiệu suất nhóm',
        code: 'performance:team',
        description: 'Trang hiệu suất nhóm',
        module: 'performance',
        type: 'menu',
        path: '/performance/team',
        icon: 'UserGroup',
        sort: 2,
        children: [
          { name: 'Xem hiệu suất nhóm', code: 'performance:team:view', type: 'button', sort: 1 }
        ]
      },
      {
        name: 'Phân tích hiệu suất',
        code: 'performance:analysis',
        description: 'Trang phân tích hiệu suất',
        module: 'performance',
        type: 'menu',
        path: '/performance/analysis',
        icon: 'DataAnalysis',
        sort: 3,
        children: [
          { name: 'Xem phân tích hiệu suất phòng ban', code: 'performance:analysis:department', type: 'button', sort: 1 },
          { name: 'Xem phân tích hiệu suất toàn bộ', code: 'performance:analysis:all', type: 'button', sort: 2 }
        ]
      },
      {
        name: 'Chia sẻ hiệu suất',
        code: 'performance:share',
        description: 'Trang chia sẻ hiệu suất',
        module: 'performance',
        type: 'menu',
        path: '/performance/share',
        icon: 'Share',
        sort: 4,
        children: [
          { name: 'Xem chia sẻ hiệu suất', code: 'performance:share:view', type: 'button', sort: 1 },
          { name: 'Tạo chia sẻ hiệu suất', code: 'performance:share:create', type: 'button', sort: 2 }
        ]
      }
    ]
  },

  // Quản lý logistics
  {
    name: 'Quản lý logistics',
    code: 'logistics',
    description: 'Mô-đun quản lý logistics',
    module: 'logistics',
    type: 'menu',
    path: '/logistics',
    icon: 'Van',
    sort: 6,
    children: [
      {
        name: 'Danh sách logistics',
        code: 'logistics:list',
        description: 'Trang danh sách logistics',
        module: 'logistics',
        type: 'menu',
        path: '/logistics/list',
        icon: 'List',
        sort: 1,
        children: [
          { name: 'Xem thông tin logistics', code: 'logistics:view', type: 'button', sort: 1 },
          { name: 'Thêm logistics', code: 'logistics:add', type: 'button', sort: 2 },
          { name: 'Chỉnh sửa logistics', code: 'logistics:edit', type: 'button', sort: 3 }
        ]
      },
      {
        name: 'Theo dõi logistics',
        code: 'logistics:tracking',
        description: 'Trang theo dõi logistics',
        module: 'logistics',
        type: 'menu',
        path: '/logistics/tracking',
        icon: 'Location',
        sort: 2,
        children: [
          { name: 'Xem theo dõi logistics', code: 'logistics:tracking:view', type: 'button', sort: 1 }
        ]
      }
    ]
  },

  // Quản lý hậu mãi
  {
    name: 'Quản lý hậu mãi',
    code: 'aftersale',
    description: 'Mô-đun quản lý hậu mãi',
    module: 'aftersale',
    type: 'menu',
    path: '/aftersale',
    icon: 'Tools',
    sort: 7,
    children: [
      {
        name: 'Đơn hàng hậu mãi',
        code: 'aftersale:order',
        description: 'Trang đơn hàng hậu mãi',
        module: 'aftersale',
        type: 'menu',
        path: '/aftersale/order',
        icon: 'Document',
        sort: 1,
        children: [
          { name: 'Xem hậu mãi cá nhân', code: 'aftersale:view:personal', type: 'button', sort: 1 },
          { name: 'Xem hậu mãi phòng ban', code: 'aftersale:view:department', type: 'button', sort: 2 },
          { name: 'Xem tất cả hậu mãi', code: 'aftersale:view:all', type: 'button', sort: 3 },
          { name: 'Tạo hậu mãi mới', code: 'aftersale:add', type: 'button', sort: 4 },
          { name: 'Chỉnh sửa hậu mãi', code: 'aftersale:edit', type: 'button', sort: 5 }
        ]
      },
      {
        name: 'Dữ liệu hậu mãi',
        code: 'aftersale:data',
        description: 'Trang dữ liệu hậu mãi',
        module: 'aftersale',
        type: 'menu',
        path: '/aftersale/data',
        icon: 'DataAnalysis',
        sort: 2,
        children: [
          { name: 'Xem dữ liệu hậu mãi phòng ban', code: 'aftersale:data:department', type: 'button', sort: 1 },
          { name: 'Xem dữ liệu hậu mãi toàn bộ', code: 'aftersale:data:all', type: 'button', sort: 2 }
        ]
      }
    ]
  },

  // Quản lý tài liệu
  {
    name: 'Quản lý tài liệu',
    code: 'data',
    description: 'Mô-đun quản lý tài liệu',
    module: 'data',
    type: 'menu',
    path: '/data',
    icon: 'Folder',
    sort: 8,
    children: [
      {
        name: 'Tìm kiếm khách hàng',
        code: 'data:customer',
        description: 'Trang tìm kiếm khách hàng',
        module: 'data',
        type: 'menu',
        path: '/data/customer',
        icon: 'Search',
        sort: 1,
        children: [
          { name: 'Tìm kiếm thông tin khách hàng', code: 'data:customer:search', type: 'button', sort: 1 }
        ]
      }
    ]
  },

  // Quản lý hệ thống
  {
    name: 'Quản lý hệ thống',
    code: 'system',
    description: 'Mô-đun quản lý hệ thống',
    module: 'system',
    type: 'menu',
    path: '/system',
    icon: 'Setting',
    sort: 9,
    children: [
      {
        name: 'Quản lý người dùng',
        code: 'system:user',
        description: 'Trang quản lý người dùng',
        module: 'system',
        type: 'menu',
        path: '/system/user',
        icon: 'User',
        sort: 1,
        children: [
          { name: 'Xem người dùng', code: 'system:user:view', type: 'button', sort: 1 },
          { name: 'Thêm người dùng', code: 'system:user:add', type: 'button', sort: 2 },
          { name: 'Chỉnh sửa người dùng', code: 'system:user:edit', type: 'button', sort: 3 },
          { name: 'Xóa người dùng', code: 'system:user:delete', type: 'button', sort: 4 },
          { name: 'Đặt lại mật khẩu', code: 'system:user:reset-password', type: 'button', sort: 5 }
        ]
      },
      {
        name: 'Quản lý vai trò',
        code: 'system:role',
        description: 'Trang quản lý vai trò',
        module: 'system',
        type: 'menu',
        path: '/system/role',
        icon: 'UserFilled',
        sort: 2,
        children: [
          { name: 'Xem vai trò', code: 'system:role:view', type: 'button', sort: 1 },
          { name: 'Thêm vai trò', code: 'system:role:add', type: 'button', sort: 2 },
          { name: 'Chỉnh sửa vai trò', code: 'system:role:edit', type: 'button', sort: 3 },
          { name: 'Xóa vai trò', code: 'system:role:delete', type: 'button', sort: 4 },
          { name: 'Phân quyền', code: 'system:role:assign-permission', type: 'button', sort: 5 }
        ]
      },
      {
        name: 'Quản lý phòng ban',
        code: 'system:department',
        description: 'Trang quản lý phòng ban',
        module: 'system',
        type: 'menu',
        path: '/system/department',
        icon: 'OfficeBuilding',
        sort: 3,
        children: [
          { name: 'Xem phòng ban', code: 'system:department:view', type: 'button', sort: 1 },
          { name: 'Thêm phòng ban', code: 'system:department:add', type: 'button', sort: 2 },
          { name: 'Chỉnh sửa phòng ban', code: 'system:department:edit', type: 'button', sort: 3 },
          { name: 'Xóa phòng ban', code: 'system:department:delete', type: 'button', sort: 4 }
        ]
      },
      {
        name: 'Bảng điều khiển siêu quản trị viên',
        code: 'system:admin',
        description: 'Bảng điều khiển dành riêng cho siêu quản trị viên',
        module: 'system',
        type: 'menu',
        path: '/system/admin',
        icon: 'Crown',
        sort: 4,
        children: [
          { name: 'Cấu hình hệ thống', code: 'system:admin:config', type: 'button', sort: 1 },
          { name: 'Sao lưu dữ liệu', code: 'system:admin:backup', type: 'button', sort: 2 },
          { name: 'Giám sát hệ thống', code: 'system:admin:monitor', type: 'button', sort: 3 }
        ]
      }
    ]
  }
];

// Cấu hình quyền hạn vai trò được định nghĩa theo yêu cầu
const defaultRoles = [
  // Một: Siêu quản trị viên - Có tất cả quyền hạn, không giới hạn
  {
    name: 'Siêu quản trị viên',
    code: 'super_admin',
    description: 'Siêu quản trị viên hệ thống, có tất cả quyền hạn',
    level: 1,
    color: '#ff4d4f',
    status: 'active',
    permissions: [] // Sẽ được phân bổ tất cả quyền hạn sau khi tạo
  },

  // Hai: Quản lý phòng ban - Quyền xem dữ liệu phòng ban
  {
    name: 'Quản lý phòng ban',
    code: 'manager',
    description: 'Quản lý phòng ban, chịu trách nhiệm quản lý nghiệp vụ phòng ban và quản lý nhóm, có quyền xem dữ liệu phòng ban',
    level: 3,
    color: '#fa8c16',
    status: 'active',
    permissions: [
      // 0. Bảng điều khiển dữ liệu (phòng ban)
      'dashboard', 'dashboard:personal', 'dashboard:department',

      // 1. Quản lý khách hàng và menu con: Danh sách khách hàng (có thể xem phòng ban), thêm khách hàng
      'customer', 'customer:list', 'customer:view:personal', 'customer:view:department', 'customer:add',

      // 2. Quản lý đơn hàng và menu con: Danh sách đơn hàng, thêm đơn hàng, duyệt đơn hàng (nếu có người duyệt độc lập thì sẽ không cấp quyền này)
      'order', 'order:list', 'order:view:personal', 'order:view:department', 'order:add', 'order:audit',

      // 3. Quản lý dịch vụ và menu con: Quản lý cuộc gọi
      'service', 'service:call', 'service:call:view', 'service:call:add', 'service:call:edit',

      // 4. Thống kê hiệu suất và menu con: Hiệu suất cá nhân, hiệu suất nhóm, phân tích hiệu suất (phân tích dữ liệu phòng ban), chia sẻ hiệu suất
      'performance', 'performance:personal', 'performance:personal:view',
      'performance:team', 'performance:team:view',
      'performance:analysis', 'performance:analysis:department',
      'performance:share', 'performance:share:view', 'performance:share:create',

      // 5. Quản lý logistics và menu con: Danh sách logistics, theo dõi logistics
      'logistics', 'logistics:list', 'logistics:view', 'logistics:add', 'logistics:edit',
      'logistics:tracking', 'logistics:tracking:view',

      // 6. Quản lý hậu mãi và menu con: Đơn hàng hậu mãi, tạo hậu mãi mới, dữ liệu hậu mãi (dữ liệu hậu mãi phòng ban)
      'aftersale', 'aftersale:order', 'aftersale:view:personal', 'aftersale:view:department', 'aftersale:add', 'aftersale:edit',
      'aftersale:data', 'aftersale:data:department',

      // 7. Quản lý tài liệu và menu con: Tìm kiếm khách hàng
      'data', 'data:customer', 'data:customer:search'
    ]
  },

  // Ba: Nhân viên bán hàng - Quyền dữ liệu cá nhân
  {
    name: 'Nhân viên bán hàng',
    code: 'sales',
    description: 'Nhân viên bán hàng, chịu trách nhiệm quản lý khách hàng và đơn hàng, chỉ giới hạn dữ liệu cá nhân',
    level: 4,
    color: '#52c41a',
    status: 'active',
    permissions: [
      // 0. Bảng điều khiển dữ liệu (chỉ dữ liệu cá nhân)
      'dashboard', 'dashboard:personal',

      // 1. Quản lý khách hàng và menu con: Danh sách khách hàng (có thể xem của mình), thêm khách hàng
      'customer', 'customer:list', 'customer:view:personal', 'customer:add',

      // 2. Quản lý đơn hàng và menu con: Danh sách đơn hàng, thêm đơn hàng
      'order', 'order:list', 'order:view:personal', 'order:add',

      // 3. Quản lý dịch vụ và menu con: Quản lý cuộc gọi
      'service', 'service:call', 'service:call:view', 'service:call:add', 'service:call:edit',

      // 4. Thống kê hiệu suất và menu con: Hiệu suất cá nhân, hiệu suất nhóm
      'performance', 'performance:personal', 'performance:personal:view',
      'performance:team', 'performance:team:view',

      // 5. Quản lý logistics và menu con: Danh sách logistics, theo dõi logistics
      'logistics', 'logistics:list', 'logistics:view', 'logistics:tracking', 'logistics:tracking:view',

      // 6. Quản lý hậu mãi và menu con: Đơn hàng hậu mãi (của mình), tạo hậu mãi mới
      'aftersale', 'aftersale:order', 'aftersale:view:personal', 'aftersale:add',

      // 7. Quản lý tài liệu và menu con: Tìm kiếm khách hàng
      'data', 'data:customer', 'data:customer:search'
    ]
  },

  // Bốn: Nhân viên dịch vụ khách hàng - Chỉ giới hạn quyền hạn do siêu quản trị viên cấu hình
  {
    name: 'Nhân viên dịch vụ khách hàng',
    code: 'service',
    description: 'Nhân viên dịch vụ khách hàng, chỉ giới hạn quyền hạn do siêu quản trị viên cấu hình, các quyền khác bị ẩn',
    level: 5,
    color: '#722ed1',
    status: 'active',
    permissions: [
      // Quyền cơ bản, quyền cụ thể do siêu quản trị viên cấu hình
      'customer', 'customer:list', 'customer:view:personal',
      'service', 'service:call', 'service:call:view', 'service:call:add'
    ]
  },

  // Năm: Quản trị viên - Có hầu hết quyền hạn, trừ thông tin nhạy cảm và đặc quyền siêu quản trị viên
  {
    name: 'Quản trị viên',
    code: 'admin',
    description: 'Quản trị viên hệ thống, có hầu hết quyền hạn, trừ thông tin nhạy cảm và đặc quyền siêu quản trị viên',
    level: 2,
    color: '#1890ff',
    status: 'active',
    permissions: [
      // Bảng điều khiển dữ liệu (tất cả dữ liệu)
      'dashboard', 'dashboard:personal', 'dashboard:department', 'dashboard:all',

      // Quản lý khách hàng (trừ xóa khách hàng)
      'customer', 'customer:list', 'customer:view:personal', 'customer:view:department', 'customer:view:all',
      'customer:add', 'customer:edit', 'customer:import', 'customer:export',

      // Quản lý đơn hàng
      'order', 'order:list', 'order:view:personal', 'order:view:department', 'order:view:all',
      'order:add', 'order:edit', 'order:audit',

      // Quản lý dịch vụ
      'service', 'service:call', 'service:call:view', 'service:call:add', 'service:call:edit',

      // Thống kê hiệu suất
      'performance', 'performance:personal', 'performance:personal:view',
      'performance:team', 'performance:team:view',
      'performance:analysis', 'performance:analysis:department', 'performance:analysis:all',
      'performance:share', 'performance:share:view', 'performance:share:create',

      // Quản lý logistics
      'logistics', 'logistics:list', 'logistics:view', 'logistics:add', 'logistics:edit',
      'logistics:tracking', 'logistics:tracking:view',

      // Quản lý hậu mãi
      'aftersale', 'aftersale:order', 'aftersale:view:personal', 'aftersale:view:department', 'aftersale:view:all',
      'aftersale:add', 'aftersale:edit',
      'aftersale:data', 'aftersale:data:department', 'aftersale:data:all',

      // Quản lý tài liệu
      'data', 'data:customer', 'data:customer:search',

      // Quản lý hệ thống (trừ xóa người dùng, xóa phòng ban, bảng điều khiển siêu quản trị viên)
      'system', 'system:user', 'system:user:view', 'system:user:add', 'system:user:edit', 'system:user:reset-password',
      'system:role', 'system:role:view', 'system:role:add', 'system:role:edit', 'system:role:assign-permission',
      'system:department', 'system:department:view', 'system:department:add', 'system:department:edit'
    ]
  }
];

// Hàm đệ quy tạo quyền hạn
async function createPermissions(permissions: any[], parent: Permission | null = null): Promise<Permission[]> {
  const permissionRepository = AppDataSource?.getTreeRepository(Permission);
  if (!permissionRepository) {
    throw new Error('Kết nối cơ sở dữ liệu chưa được khởi tạo');
  }

  const createdPermissions: Permission[] = [];

  for (const permData of permissions) {
    // Kiểm tra xem quyền hạn đã tồn tại chưa
    let permission = await permissionRepository.findOne({ where: { code: permData.code } });

    if (!permission) {
      const permissionData: any = {
        name: permData.name,
        code: permData.code,
        description: permData.description,
        module: permData.module,
        type: permData.type,
        path: permData.path,
        icon: permData.icon,
        sort: permData.sort
      };

      if (parent) {
        permissionData.parent = parent;
      }

      const newPermission = permissionRepository.create(permissionData);
      const savedPermission = await permissionRepository.save(newPermission);
      permission = Array.isArray(savedPermission) ? savedPermission[0] : savedPermission;
      logger.info(`Tạo quyền hạn: ${permission.name} (${permission.code})`);
    }

    if (permission) {
      createdPermissions.push(permission);

      // Đệ quy tạo quyền hạn con
      if (permData.children && permData.children.length > 0) {
        const childPermissions = await createPermissions(permData.children, permission);
        createdPermissions.push(...childPermissions);
      }
    }
  }

  return createdPermissions;
}

async function initNewRolesAndPermissions() {
  try {
    logger.info('Bắt đầu khởi tạo cấu hình vai trò và quyền hạn mới...');

    // Tạo quyền hạn
    logger.info('Tạo quyền hạn mặc định...');
    const allPermissions = await createPermissions(defaultPermissions);
    logger.info(`Đã tạo thành công ${allPermissions.length} quyền hạn`);

    // Tạo vai trò
    logger.info('Tạo vai trò mặc định...');
    const roleRepository = AppDataSource?.getRepository(Role);
    const permissionRepository = AppDataSource?.getTreeRepository(Permission);

    if (!roleRepository || !permissionRepository) {
      throw new Error('Kết nối cơ sở dữ liệu chưa được khởi tạo');
    }

    for (const roleData of defaultRoles) {
      // Kiểm tra xem vai trò đã tồn tại chưa
      let role = await roleRepository.findOne({
        where: { code: roleData.code },
        relations: ['permissions']
      });

      if (!role) {
        role = roleRepository.create({
          name: roleData.name,
          code: roleData.code,
          description: roleData.description,
          level: roleData.level,
          color: roleData.color,
          status: roleData.status as 'active' | 'inactive'
        });
        const savedRole = await roleRepository.save(role);
        if (savedRole) {
          role = savedRole;
          logger.info(`Tạo vai trò: ${role.name} (${role.code})`);
        }
      } else {
        // Cập nhật mô tả và quyền hạn của vai trò hiện có
        role.description = roleData.description;
        await roleRepository.save(role);
        logger.info(`Cập nhật vai trò: ${role.name} (${role.code})`);
      }

      // Phân bổ quyền hạn
      if (roleData.code === 'super_admin') {
        // Siêu quản trị viên có tất cả quyền hạn
        role.permissions = allPermissions;
      } else {
        // Các vai trò khác phân bổ quyền hạn theo cấu hình
        const rolePermissions: Permission[] = [];
        for (const permCode of roleData.permissions) {
          const permission = await permissionRepository.findOne({ where: { code: permCode } });
          if (permission) {
            rolePermissions.push(permission);
          }
        }
        role.permissions = rolePermissions;
      }

      await roleRepository.save(role);
      logger.info(`Đã phân bổ ${role.permissions.length} quyền hạn cho vai trò ${role.name}`);
    }

    logger.info('✅ Khởi tạo cấu hình vai trò và quyền hạn mới hoàn tất');
  } catch (error) {
    logger.error('❌ Khởi tạo cấu hình vai trò và quyền hạn thất bại:', error);
    throw error;
  }
}

export { initNewRolesAndPermissions };
