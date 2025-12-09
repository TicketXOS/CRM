import { Request, Response } from 'express';
import { getDataSource } from '../config/database';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { User } from '../entities/User';
import { Repository, TreeRepository } from 'typeorm';

export class RoleController {
  private get roleRepository(): Repository<Role> {
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new Error('Kết nối cơ sở dữ liệu chưa được khởi tạo');
    }
    return dataSource.getRepository(Role);
  }

  private get permissionRepository(): TreeRepository<Permission> {
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new Error('Kết nối cơ sở dữ liệu chưa được khởi tạo');
    }
    return dataSource.getTreeRepository(Permission);
  }

  private get userRepository(): Repository<User> {
    const dataSource = getDataSource();
    if (!dataSource) {
      throw new Error('Kết nối cơ sở dữ liệu chưa được khởi tạo');
    }
    return dataSource.getRepository(User);
  }

  // Lấy danh sách vai trò
  async getRoles(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;

      const queryBuilder = this.roleRepository.createQueryBuilder('role');

      if (search) {
        queryBuilder.andWhere('(role.name LIKE :search OR role.code LIKE :search)', {
          search: `%${search}%`
        });
      }

      if (status) {
        queryBuilder.andWhere('role.status = :status', { status });
      }

      const [roles, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .getManyAndCount();

      // Tính số lượng người dùng và quyền của mỗi vai trò
      const rolesWithCounts = await Promise.all(
        roles.map(async (role) => {
          // Truy vấn số lượng người dùng qua trường roleId
          const userCount = await this.userRepository.count({
            where: { roleId: role.id }
          });

          // permissions là trường JSON, lấy độ dài trực tiếp
          const permissionCount = Array.isArray(role.permissions) ? role.permissions.length : 0;

          return {
            ...role,
            userCount,
            permissionCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          roles: rolesWithCounts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Lấy danh sách vai trò thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy danh sách vai trò thất bại'
      });
    }
  }

  // Lấy chi tiết vai trò
  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const role = await this.roleRepository.findOne({
        where: { id: String(id) }
      });

      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Vai trò không tồn tại'
        });
        return;
      }

      // Lấy số lượng người dùng của vai trò này
      const userCount = await this.userRepository.count({
        where: { roleId: role.id }
      });

      res.json({
        success: true,
        data: {
          ...role,
          userCount,
          permissionCount: Array.isArray(role.permissions) ? role.permissions.length : 0
        }
      });
    } catch (error) {
      console.error('Lấy chi tiết vai trò thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy chi tiết vai trò thất bại'
      });
    }
  }

  // Tạo vai trò
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, description, status = 'active', level = 0, color, permissions = [] } = req.body;

      // Kiểm tra tên và mã vai trò đã tồn tại chưa
      const existingRole = await this.roleRepository.findOne({
        where: [
          { name },
          { code }
        ]
      });

      if (existingRole) {
        res.status(400).json({
          success: false,
          message: existingRole.name === name ? 'Tên vai trò đã tồn tại' : 'Mã vai trò đã tồn tại'
        });
        return;
      }

      // Tạo ID vai trò
      const roleId = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Tạo vai trò - permissions là trường JSON
      const role = this.roleRepository.create({
        id: roleId,
        name,
        code,
        description,
        status: status as 'active' | 'inactive',
        level,
        color,
        permissions: Array.isArray(permissions) ? permissions : []
      });

      const savedRole = await this.roleRepository.save(role);

      res.status(201).json({
        success: true,
        data: savedRole,
        message: 'Tạo vai trò thành công'
      });
    } catch (error) {
      console.error('Tạo vai trò thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Tạo vai trò thất bại'
      });
    }
  }

  // Cập nhật vai trò
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, code, description, status, level, color, permissions } = req.body;

      const role = await this.roleRepository.findOne({
        where: { id: String(id) }
      });

      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Vai trò không tồn tại'
        });
        return;
      }

      // Kiểm tra tên và mã có xung đột với vai trò khác không
      if (name && name !== role.name) {
        const existingRole = await this.roleRepository.findOne({ where: { name } });
        if (existingRole) {
          res.status(400).json({
            success: false,
            message: 'Tên vai trò đã tồn tại'
          });
          return;
        }
      }

      if (code && code !== role.code) {
        const existingRole = await this.roleRepository.findOne({ where: { code } });
        if (existingRole) {
          res.status(400).json({
            success: false,
            message: 'Mã vai trò đã tồn tại'
          });
          return;
        }
      }

      // Cập nhật thông tin cơ bản
      if (name) role.name = name;
      if (code) role.code = code;
      if (description !== undefined) role.description = description;
      if (status) role.status = status;
      if (level !== undefined) role.level = level;
      if (color !== undefined) role.color = color;

      // Cập nhật quyền - permissions là trường JSON
      if (permissions !== undefined) {
        role.permissions = Array.isArray(permissions) ? permissions : [];
      }

      const savedRole = await this.roleRepository.save(role);

      res.json({
        success: true,
        data: savedRole,
        message: 'Cập nhật vai trò thành công'
      });
    } catch (error) {
      console.error('Cập nhật vai trò thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Cập nhật vai trò thất bại'
      });
    }
  }

  // Xóa vai trò
  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const role = await this.roleRepository.findOne({
        where: { id: String(id) }
      });

      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Vai trò không tồn tại'
        });
        return;
      }

      // Kiểm tra xem có người dùng sử dụng vai trò này không
      const usersWithRole = await this.userRepository.count({
        where: { roleId: String(id) }
      });

      if (usersWithRole > 0) {
        res.status(400).json({
          success: false,
          message: `Vai trò này còn có ${usersWithRole} người dùng, không thể xóa`
        });
        return;
      }

      await this.roleRepository.remove(role);

      res.json({
        success: true,
        message: 'Xóa vai trò thành công'
      });
    } catch (error) {
      console.error('Xóa vai trò thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Xóa vai trò thất bại'
      });
    }
  }

  // Lấy thống kê vai trò
  async getRoleStats(req: Request, res: Response) {
    try {
      const total = await this.roleRepository.count();
      const active = await this.roleRepository.count({ where: { status: 'active' } });
      const permissions = await this.permissionRepository.count();

      res.json({
        success: true,
        data: {
          total,
          active,
          permissions
        }
      });
    } catch (error) {
      console.error('Lấy thống kê vai trò thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy thống kê vai trò thất bại'
      });
    }
  }

  // Lấy quyền của vai trò
  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Thử tìm vai trò
      const role = await this.roleRepository.findOne({
        where: { id: String(id) }
      });

      // Nếu không tìm thấy vai trò, trả về quyền mặc định (thay vì 404)
      if (!role) {
        console.log(`[RoleController] Vai trò ${id} không tồn tại, trả về quyền mặc định`);
        res.json({
          success: true,
          data: {
            roleId: String(id),
            roleName: 'default',
            permissions: []  // Trả về mảng quyền rỗng, frontend sẽ sử dụng quyền mặc định
          }
        });
        return;
      }

      // permissions là trường JSON, trả về trực tiếp
      const permissions = Array.isArray(role.permissions) ? role.permissions : [];

      res.json({
        success: true,
        data: {
          roleId: role.id,
          roleName: role.name,
          permissions: permissions
        }
      });
    } catch (error) {
      console.error('Lấy quyền vai trò thất bại:', error);
      // Khi có lỗi cũng trả về quyền mặc định, tránh frontend báo lỗi
      res.json({
        success: true,
        data: {
          roleId: req.params.id,
          roleName: 'default',
          permissions: []
        }
      });
    }
  }
}
