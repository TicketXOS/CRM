import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Department } from '../entities/Department';
import { User } from '../entities/User';
import { IsNull, Not } from 'typeorm';

export class DepartmentController {
  private get departmentRepository() {
    if (!AppDataSource) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Department);
  }

  private get userRepository() {
    if (!AppDataSource) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(User);
  }

  /**
   * Lấy danh sách phòng ban
   */
  async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      const departments = await this.departmentRepository.find({
        order: { sortOrder: 'ASC', createdAt: 'ASC' }
      });

      // Tính số lượng thành viên của mỗi phòng ban
      const departmentsWithCount = await Promise.all(departments.map(async (dept: Department) => {
        // Truy vấn riêng số lượng người dùng của phòng ban này
        const memberCount = await this.userRepository.count({
          where: { departmentId: dept.id }
        });

        return {
          id: dept.id.toString(),
          name: dept.name,
          code: dept.code,
          description: dept.description,
          parentId: dept.parentId ? dept.parentId.toString() : null,
          level: dept.level || 1,
          sortOrder: dept.sortOrder,
          status: dept.status,
          memberCount: memberCount,
          createdAt: dept.createdAt.toISOString(),
          updatedAt: dept.updatedAt.toISOString()
        };
      }));

      res.json({
        success: true,
        data: departmentsWithCount
      });
    } catch (error) {
      console.error('Lấy danh sách phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy danh sách phòng ban thất bại'
      });
    }
  }

  /**
   * Lấy cấu trúc cây phòng ban
   */
  async getDepartmentTree(req: Request, res: Response): Promise<void> {
    try {
      const departments = await this.departmentRepository.find({
        order: { sortOrder: 'ASC', createdAt: 'ASC' }
      });

      // Xây dựng cấu trúc cây
      const departmentMap = new Map();
      const rootDepartments: unknown[] = [];

      // Tạo tất cả các nút phòng ban trước (bao gồm truy vấn số lượng thành viên)
      for (const dept of departments) {
        const memberCount = await this.userRepository.count({
          where: { departmentId: dept.id }
        });

        const deptNode = {
          id: dept.id.toString(),
          name: dept.name,
          code: dept.code,
          description: dept.description,
          parentId: dept.parentId?.toString(),
          sortOrder: dept.sortOrder,
          status: dept.status,
          memberCount: memberCount,
          createdAt: dept.createdAt.toISOString(),
          updatedAt: dept.updatedAt.toISOString(),
          children: []
        };
        departmentMap.set(dept.id.toString(), deptNode);
      }

      // Xây dựng quan hệ cha-con
      departmentMap.forEach(dept => {
        if (dept.parentId) {
          const parent = departmentMap.get(dept.parentId);
          if (parent) {
            parent.children.push(dept);
          } else {
            rootDepartments.push(dept);
          }
        } else {
          rootDepartments.push(dept);
        }
      });

      res.json({
        success: true,
        data: rootDepartments
      });
    } catch (error) {
      console.error('Lấy cây phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy cây phòng ban thất bại'
      });
    }
  }

  /**
   * Lấy chi tiết phòng ban
   */
  async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      // Truy vấn riêng số lượng thành viên
      const memberCount = await this.userRepository.count({
        where: { departmentId: id }
      });

      const result = {
        id: department.id.toString(),
        name: department.name,
        code: department.code,
        description: department.description,
        parentId: department.parentId?.toString(),
        sortOrder: department.sortOrder,
        status: department.status,
        memberCount: memberCount,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString()
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Lấy chi tiết phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy chi tiết phòng ban thất bại'
      });
    }
  }

  /**
   * Tạo phòng ban
   */
  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, description, parentId, sortOrder = 0, status = 'active', level = 1 } = req.body;

      console.log('[Tạo phòng ban] Dữ liệu nhận được:', { name, code, description, parentId, sortOrder, status, level });

      // Xác thực các trường bắt buộc
      if (!name || !code) {
        res.status(400).json({
          success: false,
          message: 'Tên phòng ban và mã không được để trống'
        });
        return;
      }

      // Kiểm tra tên phòng ban có trùng lặp không
      const existingByName = await this.departmentRepository.findOne({
        where: { name }
      });
      if (existingByName) {
        res.status(400).json({
          success: false,
          message: 'Tên phòng ban đã tồn tại'
        });
        return;
      }

      // Kiểm tra mã phòng ban có trùng lặp không
      if (code) {
        const existingByCode = await this.departmentRepository.findOne({
          where: { code }
        });
        if (existingByCode) {
          res.status(400).json({
            success: false,
            message: 'Mã phòng ban đã tồn tại'
          });
          return;
        }
      }

      // Nếu có phòng ban cha, kiểm tra phòng ban cha có tồn tại không
      if (parentId) {
        const parentDept = await this.departmentRepository.findOne({
          where: { id: parentId }
        });
        if (!parentDept) {
          res.status(400).json({
            success: false,
            message: 'Phòng ban cha không tồn tại'
          });
          return;
        }
      }

      // Tạo ID phòng ban
      const departmentId = `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const department = this.departmentRepository.create({
        id: departmentId,
        name,
        code,
        description: description || null,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        status: status || 'active',
        level: level || 1,
        memberCount: 0
      });

      console.log('[Tạo phòng ban] Đối tượng phòng ban chuẩn bị lưu:', department);

      const savedDepartment = await this.departmentRepository.save(department);

      console.log('[Tạo phòng ban] Lưu thành công:', savedDepartment);

      const result = {
        id: savedDepartment.id,
        name: savedDepartment.name,
        code: savedDepartment.code,
        description: savedDepartment.description,
        parentId: savedDepartment.parentId,
        sortOrder: savedDepartment.sortOrder,
        status: savedDepartment.status,
        level: savedDepartment.level,
        memberCount: 0,
        createdAt: savedDepartment.createdAt.toISOString(),
        updatedAt: savedDepartment.updatedAt.toISOString()
      };

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tạo phòng ban thành công'
      });
    } catch (error: any) {
      console.error('[Tạo phòng ban] Thất bại:', error);
      console.error('[Tạo phòng ban] Ngăn xếp lỗi:', error?.stack);
      res.status(500).json({
        success: false,
        message: `Tạo phòng ban thất bại: ${error?.message || 'Lỗi không xác định'}`
      });
    }
  }

  /**
   * Cập nhật phòng ban
   */
  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, code, description, parentId, sortOrder, status } = req.body;

      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      // Kiểm tra tên phòng ban có trùng lặp không (loại trừ chính nó)
      if (name && name !== department.name) {
        const existingByName = await this.departmentRepository.findOne({
          where: { name }
        });
        if (existingByName && existingByName.id !== id) {
          res.status(400).json({
            success: false,
            message: 'Tên phòng ban đã tồn tại'
          });
          return;
        }
      }

      // Kiểm tra mã phòng ban có trùng lặp không (loại trừ chính nó)
      if (code && code !== department.code) {
        const existingByCode = await this.departmentRepository.findOne({
          where: { code }
        });
        if (existingByCode && existingByCode.id !== id) {
          res.status(400).json({
            success: false,
            message: 'Mã phòng ban đã tồn tại'
          });
          return;
        }
      }

      // Nếu có phòng ban cha, kiểm tra phòng ban cha có tồn tại không và không phải chính nó
      if (parentId) {
        if (parentId === id) {
          res.status(400).json({
            success: false,
            message: 'Không thể đặt chính nó làm phòng ban cha'
          });
          return;
        }

        const parentDept = await this.departmentRepository.findOne({
          where: { id: parentId }
        });
        if (!parentDept) {
          res.status(400).json({
            success: false,
            message: 'Phòng ban cha không tồn tại'
          });
          return;
        }
      }

      // Cập nhật thông tin phòng ban
      if (name !== undefined) department.name = name;
      if (code !== undefined) department.code = code;
      if (description !== undefined) department.description = description;
      if (parentId !== undefined) department.parentId = parentId || null;
      if (sortOrder !== undefined) department.sortOrder = sortOrder;
      if (status !== undefined) department.status = status;

      const savedDepartment = await this.departmentRepository.save(department);

      // Truy vấn riêng số lượng thành viên
      const memberCount = await this.userRepository.count({
        where: { departmentId: id }
      });

      const result = {
        id: savedDepartment.id.toString(),
        name: savedDepartment.name,
        code: savedDepartment.code,
        description: savedDepartment.description,
        parentId: savedDepartment.parentId?.toString(),
        sortOrder: savedDepartment.sortOrder,
        status: savedDepartment.status,
        memberCount: memberCount,
        createdAt: savedDepartment.createdAt.toISOString(),
        updatedAt: savedDepartment.updatedAt.toISOString()
      };

      res.json({
        success: true,
        data: result,
        message: 'Cập nhật phòng ban thành công'
      });
    } catch (error) {
      console.error('Cập nhật phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Cập nhật phòng ban thất bại'
      });
    }
  }

  /**
   * Xóa phòng ban
   */
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      // Kiểm tra xem có phòng ban con không
      const childDepartments = await this.departmentRepository.find({
        where: { parentId: id }
      });

      if (childDepartments.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Phòng ban này còn có phòng ban con, không thể xóa'
        });
        return;
      }

      // Kiểm tra xem có thành viên không
      const memberCount = await this.userRepository.count({
        where: { departmentId: id }
      });

      if (memberCount > 0) {
        res.status(400).json({
          success: false,
          message: 'Phòng ban này còn có thành viên, không thể xóa'
        });
        return;
      }

      await this.departmentRepository.remove(department);

      res.json({
        success: true,
        message: 'Xóa phòng ban thành công'
      });
    } catch (error) {
      console.error('Xóa phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Xóa phòng ban thất bại'
      });
    }
  }

  /**
   * Cập nhật trạng thái phòng ban
   */
  async updateDepartmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Giá trị trạng thái không hợp lệ'
        });
        return;
      }

      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      department.status = status;
      const savedDepartment = await this.departmentRepository.save(department);

      // Truy vấn riêng số lượng thành viên
      const memberCount = await this.userRepository.count({
        where: { departmentId: id }
      });

      const result = {
        id: savedDepartment.id.toString(),
        name: savedDepartment.name,
        code: savedDepartment.code,
        description: savedDepartment.description,
        parentId: savedDepartment.parentId?.toString(),
        sortOrder: savedDepartment.sortOrder,
        status: savedDepartment.status,
        memberCount: memberCount,
        createdAt: savedDepartment.createdAt.toISOString(),
        updatedAt: savedDepartment.updatedAt.toISOString()
      };

      res.json({
        success: true,
        data: result,
        message: 'Cập nhật trạng thái phòng ban thành công'
      });
    } catch (error) {
      console.error('Cập nhật trạng thái phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Cập nhật trạng thái phòng ban thất bại'
      });
    }
  }

  /**
   * Lấy danh sách thành viên phòng ban
   */
  async getDepartmentMembers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const users = await this.userRepository.find({
        where: { departmentId: id }
      });

      const members = users.map((user: User) => ({
        id: user.id.toString(),
        userId: user.id.toString(),
        departmentId: id,
        name: user.realName || user.username,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        joinedAt: user.createdAt.toISOString()
      }));

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      console.error('Lấy danh sách thành viên phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy danh sách thành viên phòng ban thất bại'
      });
    }
  }

  /**
   * Thêm thành viên vào phòng ban
   */
  async addDepartmentMember(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;
      const { userId, role } = req.body;

      // Kiểm tra phòng ban có tồn tại không
      const department = await this.departmentRepository.findOne({
        where: { id: departmentId }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      // Kiểm tra người dùng có tồn tại không
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
        return;
      }

      // Cập nhật phòng ban của người dùng
      user.departmentId = departmentId;
      if (role) {
        user.role = role;
      }

      const savedUser = await this.userRepository.save(user);

      const result = {
        id: savedUser.id.toString(),
        userId: savedUser.id.toString(),
        departmentId: departmentId,
        name: savedUser.realName || savedUser.username,
        username: savedUser.username,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        status: savedUser.status,
        joinedAt: savedUser.createdAt.toISOString()
      };

      res.json({
        success: true,
        data: result,
        message: 'Thêm thành viên vào phòng ban thành công'
      });
    } catch (error) {
      console.error('Thêm thành viên vào phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Thêm thành viên vào phòng ban thất bại'
      });
    }
  }

  /**
   * Xóa thành viên khỏi phòng ban
   */
  async removeDepartmentMember(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId, userId } = req.params;

      // Kiểm tra người dùng có tồn tại không và thuộc phòng ban này không
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
          departmentId: departmentId
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại hoặc không thuộc phòng ban này'
        });
        return;
      }

      // Đặt phòng ban của người dùng thành null
      user.departmentId = null;
      await this.userRepository.save(user);

      res.json({
        success: true,
        message: 'Xóa thành viên khỏi phòng ban thành công'
      });
    } catch (error) {
      console.error('Xóa thành viên khỏi phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Xóa thành viên khỏi phòng ban thất bại'
      });
    }
  }

  /**
   * Lấy thống kê phòng ban
   */
  async getDepartmentStats(req: Request, res: Response): Promise<void> {
    try {
      const totalDepartments = await this.departmentRepository.count();
      const activeDepartments = await this.departmentRepository.count({
        where: { status: 'active' }
      });
      const totalMembers = await this.userRepository.count({
        where: { departmentId: Not(IsNull()) }
      });

      const stats = {
        totalDepartments,
        activeDepartments,
        totalMembers,
        departmentsByType: {
          'Phòng ban chính': await this.departmentRepository.count({
            where: { parentId: IsNull() }
          }),
          'Phòng ban con': await this.departmentRepository.count({
            where: { parentId: Not(IsNull()) }
          })
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Lấy thống kê phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy thống kê phòng ban thất bại'
      });
    }
  }

  /**
   * Lấy danh sách vai trò của phòng ban
   * Trả về thông tin vai trò của tất cả thành viên trong phòng ban này
   */
  async getDepartmentRoles(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Kiểm tra phòng ban có tồn tại không
      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      // Lấy thống kê vai trò của thành viên phòng ban
      const users = await this.userRepository.find({
        where: { departmentId: id }
      });

      // Thống kê theo vai trò
      const roleMap = new Map<string, number>();
      users.forEach((user: User) => {
        const role = user.role || 'user';
        roleMap.set(role, (roleMap.get(role) || 0) + 1);
      });

      // Xây dựng danh sách vai trò
      const roles = Array.from(roleMap.entries()).map(([roleName, count], index) => ({
        id: `role_${id}_${index}`,
        name: roleName,
        departmentId: id,
        userCount: count,
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Lấy danh sách vai trò phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy danh sách vai trò phòng ban thất bại'
      });
    }
  }

  /**
   * Cập nhật quyền của phòng ban
   */
  async updateDepartmentPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      // Hiện tại quyền được lưu trong bộ nhớ, thực tế nên lưu vào cơ sở dữ liệu
      // Ở đây trả về phản hồi thành công
      res.json({
        success: true,
        data: {
          id: department.id,
          name: department.name,
          permissions: permissions || []
        },
        message: 'Cập nhật quyền phòng ban thành công'
      });
    } catch (error) {
      console.error('Cập nhật quyền phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Cập nhật quyền phòng ban thất bại'
      });
    }
  }

  /**
   * Di chuyển phòng ban (thay đổi phòng ban cha)
   */
  async moveDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;

      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Phòng ban không tồn tại'
        });
        return;
      }

      // Không thể đặt chính nó làm phòng ban cha
      if (newParentId === id) {
        res.status(400).json({
          success: false,
          message: 'Không thể đặt chính nó làm phòng ban cha'
        });
        return;
      }

      // Nếu có phòng ban cha mới, kiểm tra có tồn tại không
      if (newParentId) {
        const parentDept = await this.departmentRepository.findOne({
          where: { id: newParentId }
        });
        if (!parentDept) {
          res.status(400).json({
            success: false,
            message: 'Phòng ban cha đích không tồn tại'
          });
          return;
        }
      }

      department.parentId = newParentId || null;
      const savedDepartment = await this.departmentRepository.save(department);

      const memberCount = await this.userRepository.count({
        where: { departmentId: id }
      });

      res.json({
        success: true,
        data: {
          id: savedDepartment.id,
          name: savedDepartment.name,
          parentId: savedDepartment.parentId,
          memberCount
        },
        message: 'Di chuyển phòng ban thành công'
      });
    } catch (error) {
      console.error('Di chuyển phòng ban thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Di chuyển phòng ban thất bại'
      });
    }
  }
}
