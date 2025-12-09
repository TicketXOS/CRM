import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Permission } from '../entities/Permission';
import { TreeRepository } from 'typeorm';

export class PermissionController {
  private get permissionRepository(): TreeRepository<Permission> {
    return AppDataSource!.getTreeRepository(Permission);
  }

  // Lấy cây quyền
  async getPermissionTree(req: Request, res: Response) {
    try {
      const permissions = await this.permissionRepository.findTrees();

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Lấy cây quyền thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy cây quyền thất bại'
      });
    }
  }

  // Lấy danh sách quyền (phẳng)
  async getPermissions(req: Request, res: Response) {
    try {
      const { type, module, status } = req.query;

      const queryBuilder = this.permissionRepository.createQueryBuilder('permission');

      if (type) {
        queryBuilder.andWhere('permission.type = :type', { type });
      }

      if (module) {
        queryBuilder.andWhere('permission.module = :module', { module });
      }

      if (status) {
        queryBuilder.andWhere('permission.status = :status', { status });
      }

      queryBuilder.orderBy('permission.sort', 'ASC');

      const permissions = await queryBuilder.getMany();

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Lấy danh sách quyền thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Lấy danh sách quyền thất bại'
      });
    }
  }

  // Tạo quyền
  async createPermission(req: Request, res: Response): Promise<any> {
    try {
      const {
        name,
        code,
        description,
        module,
        type = 'menu',
        path,
        icon,
        sort = 0,
        status = 'active',
        parentId
      } = req.body;

      // Kiểm tra mã quyền đã tồn tại chưa
      const existingPermission = await this.permissionRepository.findOne({
        where: { code }
      });

      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: 'Mã quyền đã tồn tại'
        });
      }

      // Lấy quyền cha
      let parent: Permission | undefined = undefined;
      if (parentId) {
        const foundParent = await this.permissionRepository.findOne({
          where: { id: parentId }
        });
        if (!foundParent) {
          return res.status(400).json({
            success: false,
            message: 'Quyền cha không tồn tại'
          });
        }
        parent = foundParent;
      }

      // Tạo quyền
      const permissionData: any = {
        name,
        code,
        description,
        module,
        type: type as 'menu' | 'button' | 'api',
        path,
        icon,
        sort,
        status: status as 'active' | 'inactive'
      };

      if (parent) {
        permissionData.parent = parent;
      }

      const permission = this.permissionRepository.create(permissionData);

      const savedPermission = await this.permissionRepository.save(permission);

      res.status(201).json({
        success: true,
        data: savedPermission,
        message: 'Tạo quyền thành công'
      });
    } catch (error) {
      console.error('Tạo quyền thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Tạo quyền thất bại'
      });
    }
  }

  // Cập nhật quyền
  async updatePermission(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { name, code, description, module, type, path, icon, sort, status, parentId } = req.body;

      const permission = await this.permissionRepository.findOne({
        where: { id: Number(id) }
      });

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Quyền không tồn tại'
        });
      }

      // Kiểm tra mã có xung đột với quyền khác không
      if (code && code !== permission.code) {
        const existingPermission = await this.permissionRepository.findOne({ where: { code } });
        if (existingPermission) {
          return res.status(400).json({
            success: false,
            message: 'Mã quyền đã tồn tại'
          });
        }
      }

      // Cập nhật thông tin cơ bản
      if (name) permission.name = name;
      if (code) permission.code = code;
      if (description !== undefined) permission.description = description;
      if (module) permission.module = module;
      if (type) permission.type = type;
      if (path !== undefined) permission.path = path;
      if (icon !== undefined) permission.icon = icon;
      if (sort !== undefined) permission.sort = sort;
      if (status) permission.status = status;

      // Cập nhật quyền cha
      if (parentId !== undefined) {
        if (parentId) {
          const parent = await this.permissionRepository.findOne({
            where: { id: parentId }
          });
          if (!parent) {
            return res.status(400).json({
              success: false,
              message: 'Quyền cha không tồn tại'
            });
          }
          (permission as any).parent = parent;
        } else {
          (permission as any).parent = undefined;
        }
      }

      const savedPermission = await this.permissionRepository.save(permission);

      res.json({
        success: true,
        data: savedPermission,
        message: 'Cập nhật quyền thành công'
      });
    } catch (error) {
      console.error('Cập nhật quyền thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Cập nhật quyền thất bại'
      });
    }
  }

  // Xóa quyền
  async deletePermission(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const permission = await this.permissionRepository.findOne({
        where: { id: Number(id) }
      });

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Quyền không tồn tại'
        });
      }

      // Kiểm tra xem có quyền con không
      const children = await this.permissionRepository.findDescendants(permission);
      if (children.length > 1) { // Bao gồm chính nó, nên lớn hơn 1 có nghĩa là có quyền con
        return res.status(400).json({
          success: false,
          message: 'Quyền này còn có quyền con, không thể xóa'
        });
      }

      await this.permissionRepository.remove(permission);

      res.json({
        success: true,
        message: 'Xóa quyền thành công'
      });
    } catch (error) {
      console.error('Xóa quyền thất bại:', error);
      res.status(500).json({
        success: false,
        message: 'Xóa quyền thất bại'
      });
    }
  }
}
