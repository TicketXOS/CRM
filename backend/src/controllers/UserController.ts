import { Request, Response } from 'express';
import { getDataSource } from '../config/database';
import { User } from '../entities/User';
import { Department } from '../entities/Department';
import { OperationLog } from '../entities/OperationLog';
import { JwtConfig } from '../config/jwt';
import { catchAsync, BusinessError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger, operationLogger } from '../config/logger';
import bcrypt from 'bcryptjs';

export class UserController {
  private get userRepository() {
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new BusinessError('数据库连接未初始化');
    }
    return dataSource.getRepository(User);
  }

  /**
   * Xác thực mật khẩu (hỗ trợ bcrypt hash và mật khẩu dạng văn bản, tương thích ngược)
   * @param password Mật khẩu nhập vào
   * @param storedPassword Mật khẩu được lưu trong cơ sở dữ liệu
   * @returns Có xác thực thành công không
   */
  private async verifyPassword(password: string, storedPassword: string): Promise<boolean> {
    if (!storedPassword) {
      return false;
    }

    // Kiểm tra xem có phải là bcrypt hash không (bcrypt hash thường bắt đầu bằng $2a$, $2b$, $2x$, $2y$, độ dài 60)
    const isBcryptHash = storedPassword.startsWith('$2') && storedPassword.length === 60;

    if (isBcryptHash) {
      // Sử dụng bcrypt để xác thực mật khẩu hash
      return await bcrypt.compare(password, storedPassword);
    } else {
      // Mật khẩu dạng văn bản: so sánh trực tiếp (tương thích ngược)
      return password === storedPassword;
    }
  }

  private get departmentRepository() {
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new BusinessError('数据库连接未初始化');
    }
    return dataSource.getRepository(Department);
  }

  /**
   * Đăng nhập người dùng
   */
  login = catchAsync(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Tìm người dùng
    const user = await this.userRepository.findOne({
      where: { username }
    });

    console.log('[Login Debug] Đối tượng người dùng đã tìm thấy:', user);
    console.log('[Login Debug] Các khóa của đối tượng người dùng:', user ? Object.keys(user) : 'null');

    if (!user) {
      // Ghi nhật ký đăng nhập thất bại (thất bại không ảnh hưởng đến việc trả về lỗi)
      try {
        await this.logOperation({
          action: 'login',
          module: 'auth',
          description: `Đăng nhập người dùng thất bại: Tên đăng nhập không tồn tại - ${username}`,
          result: 'failed',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (logError) {
        console.error('[Login] Ghi nhật ký thất bại:', logError);
      }

      throw new BusinessError('Tên đăng nhập hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === 'locked') {
      throw new BusinessError('Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên', 'ACCOUNT_LOCKED');
    }

    if (user.status === 'inactive') {
      throw new BusinessError('Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản trị viên', 'ACCOUNT_DISABLED');
    }

    // Xác thực mật khẩu
    console.log('[Login Debug] Bắt đầu xác thực mật khẩu');
    console.log('[Login Debug] Tên đăng nhập:', username);
    console.log('[Login Debug] Mật khẩu nhập vào:', password);
    console.log('[Login Debug] Mật khẩu hash trong cơ sở dữ liệu:', user.password);
    console.log('[Login Debug] Độ dài mật khẩu hash:', user.password?.length);

    // Xác thực mật khẩu: hỗ trợ bcrypt hash và mật khẩu dạng văn bản (tương thích ngược)
    const storedPassword = user.password || '';
    let isPasswordValid = await this.verifyPassword(password, storedPassword);

    // Nếu xác thực mật khẩu dạng văn bản thành công, tự động hash và cập nhật vào cơ sở dữ liệu
    if (isPasswordValid && !storedPassword.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
      await this.userRepository.save(user);
      console.log('[Login] Đã tự động chuyển mật khẩu dạng văn bản sang bcrypt hash');
    }

    console.log('[Login Debug] Kết quả xác thực mật khẩu:', isPasswordValid);

    if (!isPasswordValid) {
      // Tăng số lần đăng nhập thất bại
      user.loginFailCount += 1;

      // Nếu số lần thất bại vượt quá 5 lần, khóa tài khoản
      if (user.loginFailCount >= 5) {
        user.status = 'locked';
        user.lockedAt = new Date();
      }

      await this.userRepository.save(user);

      // Ghi nhật ký đăng nhập thất bại (thất bại không ảnh hưởng đến việc trả về lỗi)
      try {
        await this.logOperation({
          userId: user.id,
          username: user.username,
          action: 'login',
          module: 'auth',
          description: `Đăng nhập người dùng thất bại: Mật khẩu sai - ${username}`,
          result: 'failed',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (logError) {
        console.error('[Login] Ghi nhật ký thất bại:', logError);
      }

      throw new BusinessError('Tên đăng nhập hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
    }

    // Đăng nhập thành công, đặt lại số lần thất bại
    try {
      user.loginFailCount = 0;
      user.loginCount = user.loginCount + 1;
      user.lastLoginAt = new Date();
      user.lastLoginIp = req.ip || '';
      await this.userRepository.save(user);
    } catch (saveError) {
      console.error('[Login] Lưu thông tin người dùng thất bại, nhưng tiếp tục quy trình đăng nhập:', saveError);
    }

    // Tạo JWT token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId
    };

    const tokens = JwtConfig.generateTokenPair(tokenPayload);

    // Ghi nhật ký đăng nhập thành công (thất bại không ảnh hưởng đến đăng nhập)
    try {
      await this.logOperation({
        userId: user.id,
        username: user.username,
        action: 'login',
        module: 'auth',
        description: `Đăng nhập người dùng thành công - ${username}`,
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (logError) {
      console.error('[Login] Ghi nhật ký thất bại, nhưng tiếp tục quy trình đăng nhập:', logError);
    }

    // Trả về thông tin người dùng và token
    const { password: _, ...userInfo } = user;

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userInfo,
        tokens
      }
    });
  });

  /**
   * Làm mới token
   */
  refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Token làm mới không được để trống');
    }

    // Xác thực token làm mới
    const payload = JwtConfig.verifyRefreshToken(refreshToken);

    // Kiểm tra người dùng có tồn tại và trạng thái bình thường không
    const user = await this.userRepository.findOne({
      where: { id: payload.userId }
    });

    if (!user || user.status !== 'active') {
      throw new BusinessError('Trạng thái người dùng bất thường, vui lòng đăng nhập lại', 'USER_STATUS_INVALID');
    }

    // Tạo cặp token mới
    const newTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId
    };

    const tokens = JwtConfig.generateTokenPair(newTokenPayload);

    res.json({
      success: true,
      message: 'Làm mới token thành công',
      data: { tokens }
    });
  });

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getCurrentUser = catchAsync(async (req: Request, res: Response) => {
    const user = req.currentUser!;

    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Cập nhật thông tin người dùng hiện tại
   */
  updateCurrentUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { realName, email, phone, avatar } = req.body;

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng');
    }

    // Kiểm tra email đã được người dùng khác sử dụng chưa
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BusinessError('Email đã được người dùng khác sử dụng', 'EMAIL_ALREADY_EXISTS');
      }
    }

    // Cập nhật thông tin người dùng
    Object.assign(user, {
      realName: realName || user.realName,
      email: email || user.email,
      phone: phone || user.phone,
      avatar: avatar || user.avatar
    });

    await this.userRepository.save(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: req.user!.userId,
      username: req.user!.username,
      action: 'update',
      module: 'user',
      description: 'Cập nhật thông tin cá nhân',
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: user
    });
  });

  /**
   * Đổi mật khẩu
   */
  changePassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng');
    }

    // Xác thực mật khẩu hiện tại
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BusinessError('Mật khẩu hiện tại không đúng', 'INVALID_CURRENT_PASSWORD');
    }

    // Kiểm tra mật khẩu mới có giống mật khẩu hiện tại không
    const isSamePassword = await this.verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      throw new BusinessError('Mật khẩu mới không được giống mật khẩu hiện tại', 'SAME_PASSWORD');
    }

    // Mã hóa mật khẩu mới
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: req.user!.userId,
      username: req.user!.username,
      action: 'update',
      module: 'user',
      description: 'Đổi mật khẩu',
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  });

  /**
   * Tạo người dùng (chức năng quản trị viên)
   */
  createUser = catchAsync(async (req: Request, res: Response) => {
    const { username, password, realName, email, phone, role, departmentId } = req.body;

    // Xác thực các trường bắt buộc
    if (!username || !password || !realName || !role) {
      throw new ValidationError('Tên đăng nhập, mật khẩu, tên thật và vai trò là các trường bắt buộc');
    }

    // Kiểm tra tên đăng nhập đã tồn tại chưa
    const existingUser = await this.userRepository.findOne({
      where: { username }
    });

    if (existingUser) {
      throw new BusinessError('Tên đăng nhập đã tồn tại', 'USERNAME_EXISTS');
    }

    // Kiểm tra email đã tồn tại chưa
    if (email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email }
      });

      if (existingEmail) {
        throw new BusinessError('Email đã tồn tại', 'EMAIL_EXISTS');
      }
    }

    // Xác thực phòng ban có tồn tại không
    if (departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: departmentId }
      });

      if (!department) {
        throw new NotFoundError('Phòng ban được chỉ định không tồn tại');
      }
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo ID người dùng
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Tạo người dùng - đảm bảo tất cả các trường bắt buộc đều có giá trị
    const user = this.userRepository.create({
      id: userId,
      username,
      password: hashedPassword,
      name: realName,  // name là trường bắt buộc
      realName,
      email: email || null,
      phone: phone || null,
      role,
      roleId: role,  // roleId là trường bắt buộc, sử dụng giá trị role
      departmentId: departmentId || null,
      status: 'active',
      loginFailCount: 0,
      loginCount: 0
    });

    const savedUser = await this.userRepository.save(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: (req as any).user?.id,
      username: (req as any).user?.username,
      action: 'create',
      module: 'user',
      description: `Tạo người dùng: ${username} (${realName})`,
      result: 'success',
      details: { userId: savedUser.id, username, realName, role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    const { password: _, ...userWithoutPassword } = savedUser;

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: {
        user: userWithoutPassword
      }
    });
  });

  /**
   * Lấy danh sách người dùng (chức năng quản trị viên)
   */
  getUsers = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, departmentId, role, status } = req.query as any;

    // Entity User không có liên kết department, truy vấn trực tiếp bảng người dùng
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.realName',
        'user.name',
        'user.email',
        'user.phone',
        'user.avatar',
        'user.role',
        'user.roleId',
        'user.status',
        'user.departmentId',
        'user.departmentName',
        'user.position',
        'user.lastLoginAt',
        'user.lastLoginIp',
        'user.createdAt',
        'user.updatedAt'
      ]);

    // Điều kiện tìm kiếm
    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.realName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (departmentId) {
      queryBuilder.andWhere('user.departmentId = :departmentId', { departmentId });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Phân trang
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Sắp xếp
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      data: {
        items: users,  // Frontend mong đợi trường items
        users,         // Giữ tương thích
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  });

  /**
   * Lấy thống kê người dùng
   */
  getUserStatistics = catchAsync(async (req: Request, res: Response) => {
    // Lấy tổng số người dùng
    const total = await this.userRepository.count();

    // Lấy số người dùng theo từng trạng thái
    const active = await this.userRepository.count({ where: { status: 'active' } });
    const inactive = await this.userRepository.count({ where: { status: 'inactive' } });
    const locked = await this.userRepository.count({ where: { status: 'locked' } });

    // Lấy số người dùng theo từng vai trò
    const adminCount = await this.userRepository.count({ where: { role: 'admin' } });
    const managerCount = await this.userRepository.count({ where: { role: 'manager' } });
    const salesCount = await this.userRepository.count({ where: { role: 'sales' } });
    const serviceCount = await this.userRepository.count({ where: { role: 'service' } });

    // Lấy số người dùng theo từng phòng ban
    const departmentStats = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.department', 'department')
      .select([
        'user.departmentId as departmentId',
        'department.name as departmentName',
        'COUNT(user.id) as count'
      ])
      .where('user.departmentId IS NOT NULL')
      .groupBy('user.departmentId')
      .addGroupBy('department.name')
      .getRawMany();

    const statistics = {
      total,
      active,
      inactive,
      locked,
      byRole: {
        admin: adminCount,
        manager: managerCount,
        sales: salesCount,
        service: serviceCount
      },
      byDepartment: departmentStats.map(stat => ({
        departmentId: parseInt(stat.departmentId),
        departmentName: stat.departmentName || 'Phòng ban không xác định',
        count: parseInt(stat.count)
      }))
    };

    res.json({
      success: true,
      data: statistics
    });
  });

  /**
   * Lấy chi tiết người dùng
   */
  getUserById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    const { password: _, ...userInfo } = user;

    res.json({
      success: true,
      data: userInfo
    });
  });

  /**
   * Cập nhật thông tin người dùng
   */
  updateUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { realName, name, email, phone, role, roleId, departmentId, position, employeeNumber, status, remark } = req.body;

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    // Cập nhật các trường
    if (realName !== undefined) user.realName = realName;
    if (name !== undefined) user.name = name || realName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (roleId !== undefined) user.role = roleId; // roleId cũng được ánh xạ đến trường role
    if (departmentId !== undefined) user.departmentId = departmentId ? String(departmentId) : null;
    if (position !== undefined) user.position = position;
    if (employeeNumber !== undefined) user.employeeNumber = employeeNumber;
    if (status !== undefined) user.status = status;
    if (remark !== undefined) (user as any).remark = remark;

    const updatedUser = await this.userRepository.save(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: req.user?.userId,
      username: req.user?.username,
      action: 'update_user',
      module: 'user',
      description: `Cập nhật thông tin người dùng: ${user.username}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { password: _, ...userInfo } = updatedUser;

    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: userInfo
    });
  });

  /**
   * Xóa người dùng
   */
  deleteUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    // Không cho phép xóa siêu quản trị viên
    if (user.role === 'super_admin' || user.username === 'superadmin') {
      throw new BusinessError('Không thể xóa tài khoản siêu quản trị viên');
    }

    await this.userRepository.remove(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: req.user?.userId,
      username: req.user?.username,
      action: 'delete_user',
      module: 'user',
      description: `Xóa người dùng: ${user.username}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  });

  /**
   * Cập nhật trạng thái người dùng (kích hoạt/vô hiệu hóa/khóa)
   */
  updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { status } = req.body;

    if (!['active', 'inactive', 'locked'].includes(status)) {
      throw new ValidationError('Giá trị trạng thái không hợp lệ');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    user.status = status;
    if (status === 'locked') {
      user.lockedAt = new Date();
    } else if (status === 'active') {
      user.lockedAt = null;
      user.loginFailCount = 0;
    }

    const updatedUser = await this.userRepository.save(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: req.user?.userId,
      username: req.user?.username,
      action: 'update_user_status',
      module: 'user',
      description: `Cập nhật trạng thái người dùng: ${user.username} -> ${status}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { password: _, ...userInfo } = updatedUser;

    res.json({
      success: true,
      message: 'Cập nhật trạng thái người dùng thành công',
      data: userInfo
    });
  });

  /**
   * Cập nhật trạng thái làm việc của người dùng
   */
  updateEmploymentStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { employmentStatus } = req.body;

    if (!['active', 'resigned'].includes(employmentStatus)) {
      throw new ValidationError('Giá trị trạng thái làm việc không hợp lệ');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    (user as any).employmentStatus = employmentStatus;
    if (employmentStatus === 'resigned') {
      (user as any).resignedAt = new Date();
    }

    const updatedUser = await this.userRepository.save(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: req.user?.userId,
      username: req.user?.username,
      action: 'update_employment_status',
      module: 'user',
      description: `Cập nhật trạng thái làm việc của người dùng: ${user.username} -> ${employmentStatus}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { password: _, ...userInfo } = updatedUser;

    res.json({
      success: true,
      message: 'Cập nhật trạng thái làm việc thành công',
      data: userInfo
    });
  });

  /**
   * Đặt lại mật khẩu người dùng
   */
  resetUserPassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    // Tạo mật khẩu tạm thời hoặc sử dụng mật khẩu được cung cấp
    const tempPassword = newPassword || Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    user.password = hashedPassword;
    (user as any).mustChangePassword = true;
    user.loginFailCount = 0;
    if (user.status === 'locked') {
      user.status = 'active';
      user.lockedAt = null;
    }

    await this.userRepository.save(user);

    // Ghi nhật ký thao tác
    await this.logOperation({
      userId: req.user?.userId,
      username: req.user?.username,
      action: 'reset_password',
      module: 'user',
      description: `Đặt lại mật khẩu người dùng: ${user.username}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      data: {
        tempPassword: newPassword ? undefined : tempPassword
      }
    });
  });

  /**
   * Ghi nhật ký thao tác
   */
  private async logOperation(data: {
    userId?: string;
    username?: string;
    action: string;
    module: string;
    description: string;
    result?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      // Chỉ ghi vào nhật ký tệp, không ghi vào cơ sở dữ liệu
      operationLogger.info('Nhật ký thao tác', data);
    } catch (error) {
      logger.error('Ghi nhật ký thao tác thất bại:', error);
    }
  }
}
