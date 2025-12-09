import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { CustomerGroup } from '../entities/CustomerGroup';
import { CustomerTag } from '../entities/CustomerTag';
import { Like, Between } from 'typeorm';

const router = Router();

// Tất cả các route khách hàng đều cần xác thực
router.use(authenticateToken);

/**
 * @route GET /api/v1/customers
 * @desc Lấy danh sách khách hàng
 * @access Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    const {
      page = 1,
      pageSize = 10,
      name,
      phone,
      level,
      status,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 10;
    const skip = (pageNum - 1) * pageSizeNum;

    // Xây dựng điều kiện truy vấn
    const where: Record<string, unknown> = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (phone) {
      where.phone = Like(`%${phone}%`);
    }

    if (level) {
      where.level = level;
    }

    if (status) {
      where.status = status;
    }

    // Lọc theo phạm vi ngày tháng
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate as string), new Date(endDate as string));
    }

    const [customers, total] = await customerRepository.findAndCount({
      where,
      skip,
      take: pageSizeNum,
      order: { createdAt: 'DESC' }
    });

    // Chuyển đổi định dạng dữ liệu để khớp với mong đợi của frontend
    const list = customers.map(customer => ({
      id: customer.id,
      code: customer.customerNo || '',
      name: customer.name,
      phone: customer.phone || '',
      age: customer.age || 0,
      gender: customer.gender || 'unknown',
      height: customer.height || null,
      weight: customer.weight || null,
      address: customer.address || '',
      province: customer.province || '',
      city: customer.city || '',
      district: customer.district || '',
      street: customer.street || '',
      detailAddress: customer.detailAddress || '',
      overseasAddress: customer.overseasAddress || '',
      level: customer.level || 'normal',
      status: customer.status || 'active',
      salesPersonId: customer.salesPersonId || '',
      orderCount: customer.orderCount || 0,
      returnCount: customer.returnCount || 0,
      totalAmount: customer.totalAmount || 0,
      createTime: customer.createdAt?.toISOString() || '',
      createdBy: customer.createdBy || '',
      wechat: customer.wechat || '',
      wechatId: customer.wechat || '',
      email: customer.email || '',
      company: customer.company || '',
      source: customer.source || '',
      tags: customer.tags || [],
      remarks: customer.remark || '',
      remark: customer.remark || '',
      medicalHistory: customer.medicalHistory || '',
      improvementGoals: customer.improvementGoals || [],
      otherGoals: customer.otherGoals || '',
      fanAcquisitionTime: customer.fanAcquisitionTime?.toISOString() || ''
    }));

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách khách hàng thành công',
      data: {
        list,
        total,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Lấy danh sách khách hàng thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Lấy danh sách khách hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

// ========== Route nhóm khách hàng (phải được định nghĩa trước /:id) ==========

/**
 * @route GET /api/v1/customers/groups
 * @desc Lấy danh sách nhóm khách hàng
 * @access Private
 */
router.get('/groups', async (req: Request, res: Response) => {
  try {
    const groupRepository = AppDataSource.getRepository(CustomerGroup);
    const { page = 1, pageSize = 20, name, status: _status } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Record<string, unknown> = {};
    if (name) {
      where.name = Like(`%${name}%`);
    }

    const [groups, total] = await groupRepository.findAndCount({
      where,
      skip,
      take: pageSizeNum,
      order: { createdAt: 'DESC' }
    });

    const list = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description || '',
      status: 'active',
      customerCount: group.customerCount || 0,
      createTime: group.createdAt?.toISOString() || '',
      conditions: []
    }));

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách nhóm thành công',
      data: { list, total, page: pageNum, pageSize: pageSizeNum }
    });
  } catch (error) {
    console.error('Lấy danh sách nhóm thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Lấy danh sách nhóm thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route POST /api/v1/customers/groups
 * @desc Tạo nhóm khách hàng
 * @access Private
 */
router.post('/groups', async (req: Request, res: Response) => {
  try {
    const groupRepository = AppDataSource.getRepository(CustomerGroup);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Tên nhóm không được để trống'
      });
    }

    const group = groupRepository.create({
      name,
      description: description || '',
      customerCount: 0
    });

    const savedGroup = await groupRepository.save(group);

    res.status(201).json({
      success: true,
      code: 200,
      message: 'Tạo nhóm thành công',
      data: {
        id: savedGroup.id,
        name: savedGroup.name,
        description: savedGroup.description || '',
        status: 'active',
        customerCount: 0,
        createTime: savedGroup.createdAt?.toISOString() || '',
        conditions: []
      }
    });
  } catch (error) {
    console.error('Tạo nhóm thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Tạo nhóm thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/customers/groups/:id
 * @desc Lấy chi tiết nhóm khách hàng
 * @access Private
 */
router.get('/groups/:id', async (req: Request, res: Response) => {
  try {
    const groupRepository = AppDataSource.getRepository(CustomerGroup);
    const group = await groupRepository.findOne({
      where: { id: req.params.id }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Nhóm không tồn tại'
      });
    }

    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết nhóm thành công',
      data: {
        id: group.id,
        name: group.name,
        description: group.description || '',
        status: 'active',
        customerCount: group.customerCount || 0,
        createTime: group.createdAt?.toISOString() || '',
        conditions: []
      }
    });
  } catch (error) {
    console.error('Lấy chi tiết nhóm thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Lấy chi tiết nhóm thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route PUT /api/v1/customers/groups/:id
 * @desc Cập nhật nhóm khách hàng
 * @access Private
 */
router.put('/groups/:id', async (req: Request, res: Response) => {
  try {
    const groupRepository = AppDataSource.getRepository(CustomerGroup);
    const group = await groupRepository.findOne({
      where: { id: req.params.id }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Nhóm không tồn tại'
      });
    }

    const { name, description } = req.body;
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;

    const updatedGroup = await groupRepository.save(group);

    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật nhóm thành công',
      data: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description || '',
        status: 'active',
        customerCount: updatedGroup.customerCount || 0,
        createTime: updatedGroup.createdAt?.toISOString() || '',
        conditions: []
      }
    });
  } catch (error) {
    console.error('Cập nhật nhóm thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Cập nhật nhóm thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route DELETE /api/v1/customers/groups/:id
 * @desc Xóa nhóm khách hàng
 * @access Private
 */
router.delete('/groups/:id', async (req: Request, res: Response) => {
  try {
    const groupRepository = AppDataSource.getRepository(CustomerGroup);
    const group = await groupRepository.findOne({
      where: { id: req.params.id }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Nhóm không tồn tại'
      });
    }

    await groupRepository.remove(group);

    res.json({
      success: true,
      code: 200,
      message: 'Xóa nhóm thành công'
    });
  } catch (error) {
    console.error('Xóa nhóm thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Xóa nhóm thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

// ========== Route nhãn khách hàng (phải được định nghĩa trước /:id) ==========

/**
 * @route GET /api/v1/customers/tags
 * @desc Lấy danh sách nhãn khách hàng
 * @access Private
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tagRepository = AppDataSource.getRepository(CustomerTag);
    const { page = 1, pageSize = 20, name, status: _status } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Record<string, unknown> = {};
    if (name) {
      where.name = Like(`%${name}%`);
    }

    const [tags, total] = await tagRepository.findAndCount({
      where,
      skip,
      take: pageSizeNum,
      order: { createdAt: 'DESC' }
    });

    const list = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color || '#007bff',
      description: tag.description || '',
      status: 'active' as const,
      customerCount: tag.customerCount || 0,
      createTime: tag.createdAt?.toISOString() || ''
    }));

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách nhãn thành công',
      data: { list, total, page: pageNum, pageSize: pageSizeNum }
    });
  } catch (error) {
    console.error('Lấy danh sách nhãn thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Lấy danh sách nhãn thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route POST /api/v1/customers/tags
 * @desc Tạo nhãn khách hàng
 * @access Private
 */
router.post('/tags', async (req: Request, res: Response) => {
  try {
    const tagRepository = AppDataSource.getRepository(CustomerTag);
    const { name, color, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Tên nhãn không được để trống'
      });
    }

    const tag = tagRepository.create({
      name,
      color: color || '#007bff',
      description: description || '',
      customerCount: 0
    });

    const savedTag = await tagRepository.save(tag);

    res.status(201).json({
      success: true,
      code: 200,
      message: 'Tạo nhãn thành công',
      data: {
        id: savedTag.id,
        name: savedTag.name,
        color: savedTag.color || '#007bff',
        description: savedTag.description || '',
        status: 'active',
        customerCount: 0,
        createTime: savedTag.createdAt?.toISOString() || ''
      }
    });
  } catch (error) {
    console.error('Tạo nhãn thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Tạo nhãn thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/customers/tags/:id
 * @desc Lấy chi tiết nhãn khách hàng
 * @access Private
 */
router.get('/tags/:id', async (req: Request, res: Response) => {
  try {
    const tagRepository = AppDataSource.getRepository(CustomerTag);
    const tag = await tagRepository.findOne({
      where: { id: req.params.id }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Nhãn không tồn tại'
      });
    }

    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết nhãn thành công',
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color || '#007bff',
        description: tag.description || '',
        status: 'active',
        customerCount: tag.customerCount || 0,
        createTime: tag.createdAt?.toISOString() || ''
      }
    });
  } catch (error) {
    console.error('Lấy chi tiết nhãn thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Lấy chi tiết nhãn thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route PUT /api/v1/customers/tags/:id
 * @desc Cập nhật nhãn khách hàng
 * @access Private
 */
router.put('/tags/:id', async (req: Request, res: Response) => {
  try {
    const tagRepository = AppDataSource.getRepository(CustomerTag);
    const tag = await tagRepository.findOne({
      where: { id: req.params.id }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Nhãn không tồn tại'
      });
    }

    const { name, color, description } = req.body;
    if (name !== undefined) tag.name = name;
    if (color !== undefined) tag.color = color;
    if (description !== undefined) tag.description = description;

    const updatedTag = await tagRepository.save(tag);

    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật nhãn thành công',
      data: {
        id: updatedTag.id,
        name: updatedTag.name,
        color: updatedTag.color || '#007bff',
        description: updatedTag.description || '',
        status: 'active',
        customerCount: updatedTag.customerCount || 0,
        createTime: updatedTag.createdAt?.toISOString() || ''
      }
    });
  } catch (error) {
    console.error('Cập nhật nhãn thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Cập nhật nhãn thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route DELETE /api/v1/customers/tags/:id
 * @desc Xóa nhãn khách hàng
 * @access Private
 */
router.delete('/tags/:id', async (req: Request, res: Response) => {
  try {
    const tagRepository = AppDataSource.getRepository(CustomerTag);
    const tag = await tagRepository.findOne({
      where: { id: req.params.id }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Nhãn không tồn tại'
      });
    }

    await tagRepository.remove(tag);

    res.json({
      success: true,
      code: 200,
      message: 'Xóa nhãn thành công'
    });
  } catch (error) {
    console.error('Xóa nhãn thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Xóa nhãn thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/customers/check-exists
 * @desc Kiểm tra khách hàng có tồn tại không (qua số điện thoại)
 * @access Private
 * @note Route này phải được định nghĩa trước route /:id, nếu không sẽ bị /:id khớp
 */
router.get('/check-exists', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Số điện thoại không được để trống',
        data: null
      });
    }

    console.log('[Kiểm tra khách hàng tồn tại] Truy vấn số điện thoại:', phone);

    const existingCustomer = await customerRepository.findOne({
      where: { phone: phone as string }
    });

    if (existingCustomer) {
      console.log('[Kiểm tra khách hàng tồn tại] Tìm thấy khách hàng:', existingCustomer.name);
      return res.json({
        success: true,
        code: 200,
        message: 'Số điện thoại này đã có bản ghi khách hàng',
        data: {
          id: existingCustomer.id,
          name: existingCustomer.name,
          phone: existingCustomer.phone,
          creatorName: existingCustomer.createdBy || '',
          createTime: existingCustomer.createdAt?.toISOString() || ''
        }
      });
    }

    console.log('[Kiểm tra khách hàng tồn tại] Khách hàng không tồn tại, có thể tạo');
    return res.json({
      success: true,
      code: 200,
      message: 'Số điện thoại này chưa tồn tại, có thể tạo',
      data: null
    });
  } catch (error) {
    console.error('Kiểm tra khách hàng tồn tại thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Kiểm tra khách hàng tồn tại thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
      data: null
    });
  }
});

/**
 * @route GET /api/v1/customers/:id
 * @desc Lấy chi tiết khách hàng
 * @access Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({
      where: { id: req.params.id }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Khách hàng không tồn tại'
      });
    }

    // Chuyển đổi định dạng dữ liệu
    const data = {
      id: customer.id,
      code: customer.customerNo || '',
      name: customer.name,
      phone: customer.phone || '',
      age: customer.age || 0,
      gender: customer.gender || 'unknown',
      height: customer.height || null,
      weight: customer.weight || null,
      address: customer.address || '',
      province: customer.province || '',
      city: customer.city || '',
      district: customer.district || '',
      street: customer.street || '',
      detailAddress: customer.detailAddress || '',
      overseasAddress: customer.overseasAddress || '',
      level: customer.level || 'normal',
      status: customer.status || 'active',
      salesPersonId: customer.salesPersonId || '',
      orderCount: customer.orderCount || 0,
      returnCount: customer.returnCount || 0,
      totalAmount: customer.totalAmount || 0,
      createTime: customer.createdAt?.toISOString() || '',
      createdBy: customer.createdBy || '',
      wechat: customer.wechat || '',
      wechatId: customer.wechat || '',
      email: customer.email || '',
      company: customer.company || '',
      source: customer.source || '',
      tags: customer.tags || [],
      remarks: customer.remark || '',
      remark: customer.remark || '',
      medicalHistory: customer.medicalHistory || '',
      improvementGoals: customer.improvementGoals || [],
      otherGoals: customer.otherGoals || '',
      fanAcquisitionTime: customer.fanAcquisitionTime?.toISOString() || ''
    };

    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết khách hàng thành công',
      data
    });
  } catch (error) {
    console.error('Lấy chi tiết khách hàng thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Lấy chi tiết khách hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route POST /api/v1/customers
 * @desc 创建客户
 * @access Private
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const {
      name, phone, email, address, level, source, tags, remarks, remark, company,
      age, gender, height, weight, wechat, wechatId,
      province, city, district, street, detailAddress, overseasAddress,
      medicalHistory, improvementGoals, otherGoals, fanAcquisitionTime,
      status, salesPersonId, createdBy
    } = req.body;

    console.log('[Tạo khách hàng] Nhận dữ liệu yêu cầu:', req.body);

    // Xác thực trường bắt buộc
    if (!name) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Tên khách hàng không được để trống'
      });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    if (phone) {
      const existingCustomer = await customerRepository.findOne({ where: { phone } });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'Số điện thoại này đã có bản ghi khách hàng'
        });
      }
    }

    // Lấy thông tin người dùng hiện tại
    const currentUser = (req as any).user;
    const finalCreatedBy = createdBy || salesPersonId || currentUser?.id || 'admin';

    // Tạo khách hàng
    const customer = customerRepository.create({
      name,
      phone,
      email,
      address,
      province,
      city,
      district,
      street,
      detailAddress,
      overseasAddress,
      level: level || 'normal',
      source: source || 'other',
      tags: tags || [],
      remark: remarks || remark || null,
      company,
      status: status || 'active',
      salesPersonId: salesPersonId || currentUser?.id || null,
      createdBy: finalCreatedBy,
      // Các trường mới
      age: age || null,
      gender: gender || 'unknown',
      height: height || null,
      weight: weight || null,
      wechat: wechat || wechatId || null,
      medicalHistory: medicalHistory || null,
      improvementGoals: improvementGoals || [],
      otherGoals: otherGoals || null,
      fanAcquisitionTime: fanAcquisitionTime ? new Date(fanAcquisitionTime) : null,
      orderCount: 0,
      returnCount: 0,
      totalAmount: 0
    });

    console.log('[Tạo khách hàng] Đối tượng khách hàng chuẩn bị lưu:', customer);

    const savedCustomer = await customerRepository.save(customer);
    console.log('[Tạo khách hàng] Lần lưu đầu tiên hoàn tất, savedCustomer:', savedCustomer);
    console.log('[Tạo khách hàng] savedCustomer.id:', savedCustomer.id);

    // Tạo mã khách hàng
    savedCustomer.customerNo = `C${savedCustomer.id.substring(0, 8).toUpperCase()}`;
    console.log('[Tạo khách hàng] Mã khách hàng đã tạo:', savedCustomer.customerNo);

    await customerRepository.save(savedCustomer);
    console.log('[Tạo khách hàng] Lần lưu thứ hai hoàn tất');

    console.log('[Tạo khách hàng] Lưu thành công, ID khách hàng:', savedCustomer.id);

    // Chuyển đổi định dạng dữ liệu để trả về
    const data = {
      id: savedCustomer.id,
      code: savedCustomer.customerNo,
      name: savedCustomer.name,
      phone: savedCustomer.phone || '',
      age: savedCustomer.age || 0,
      gender: savedCustomer.gender || 'unknown',
      height: savedCustomer.height || null,
      weight: savedCustomer.weight || null,
      address: savedCustomer.address || '',
      province: savedCustomer.province || '',
      city: savedCustomer.city || '',
      district: savedCustomer.district || '',
      street: savedCustomer.street || '',
      detailAddress: savedCustomer.detailAddress || '',
      level: level || 'normal',
      status: status || 'active',
      salesPersonId: savedCustomer.salesPersonId || '',
      orderCount: 0,
      createTime: savedCustomer.createdAt?.toISOString() || '',
      createdBy: savedCustomer.createdBy || '',
      wechat: savedCustomer.wechat || '',
      email: savedCustomer.email || '',
      company: savedCustomer.company || '',
      source: savedCustomer.source || '',
      tags: savedCustomer.tags || [],
      remarks: savedCustomer.remark || '',
      medicalHistory: savedCustomer.medicalHistory || '',
      improvementGoals: savedCustomer.improvementGoals || [],
      otherGoals: savedCustomer.otherGoals || ''
    };

    console.log('[Tạo khách hàng] Đối tượng data chuẩn bị trả về:', data);
    console.log('[Tạo khách hàng] data.id:', data.id);
    console.log('[Tạo khách hàng] data.name:', data.name);

    res.status(201).json({
      success: true,
      code: 200,
      message: 'Tạo khách hàng thành công',
      data
    });

    console.log('[Tạo khách hàng] Phản hồi đã gửi');
  } catch (error) {
    console.error('[Tạo khách hàng] Tạo khách hàng thất bại:', error);
    console.error('[Tạo khách hàng] Chi tiết lỗi:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Tạo khách hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route PUT /api/v1/customers/:id
 * @desc Cập nhật khách hàng
 * @access Private
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customerId = req.params.id;

    const customer = await customerRepository.findOne({ where: { id: customerId } });

    if (!customer) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Khách hàng không tồn tại'
      });
    }

    const {
      name, phone, email, address, level, source, tags, remarks, remark, company, status,
      age, gender, height, weight, wechat, wechatId,
      province, city, district, street, detailAddress, overseasAddress,
      medicalHistory, improvementGoals, otherGoals, fanAcquisitionTime
    } = req.body;

    // Cập nhật trường
    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (province !== undefined) customer.province = province;
    if (city !== undefined) customer.city = city;
    if (district !== undefined) customer.district = district;
    if (street !== undefined) customer.street = street;
    if (detailAddress !== undefined) customer.detailAddress = detailAddress;
    if (overseasAddress !== undefined) customer.overseasAddress = overseasAddress;
    if (level !== undefined) customer.level = level;
    if (source !== undefined) customer.source = source;
    if (tags !== undefined) customer.tags = tags;
    if (remarks !== undefined || remark !== undefined) customer.remark = remarks || remark;
    if (company !== undefined) customer.company = company;
    if (status !== undefined) customer.status = status;
    if (age !== undefined) customer.age = age;
    if (gender !== undefined) customer.gender = gender;
    if (height !== undefined) customer.height = height;
    if (weight !== undefined) customer.weight = weight;
    if (wechat !== undefined || wechatId !== undefined) customer.wechat = wechat || wechatId;
    if (medicalHistory !== undefined) customer.medicalHistory = medicalHistory;
    if (improvementGoals !== undefined) customer.improvementGoals = improvementGoals;
    if (otherGoals !== undefined) customer.otherGoals = otherGoals;
    if (fanAcquisitionTime !== undefined) customer.fanAcquisitionTime = fanAcquisitionTime ? new Date(fanAcquisitionTime) : undefined;

    const updatedCustomer = await customerRepository.save(customer);

    // Chuyển đổi định dạng dữ liệu để trả về
    const data = {
      id: updatedCustomer.id,
      code: updatedCustomer.customerNo || '',
      name: updatedCustomer.name,
      phone: updatedCustomer.phone || '',
      age: updatedCustomer.age || 0,
      gender: updatedCustomer.gender || 'unknown',
      height: updatedCustomer.height || null,
      weight: updatedCustomer.weight || null,
      address: updatedCustomer.address || '',
      level: updatedCustomer.level || 'normal',
      status: updatedCustomer.status || 'active',
      salesPersonId: updatedCustomer.salesPersonId || '',
      orderCount: updatedCustomer.orderCount || 0,
      createTime: updatedCustomer.createdAt?.toISOString() || '',
      createdBy: updatedCustomer.createdBy || '',
      email: updatedCustomer.email || '',
      company: updatedCustomer.company || '',
      source: updatedCustomer.source || '',
      tags: updatedCustomer.tags || [],
      remarks: updatedCustomer.remark || ''
    };

    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật khách hàng thành công',
      data
    });
  } catch (error) {
    console.error('Cập nhật khách hàng thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Cập nhật khách hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route DELETE /api/v1/customers/:id
 * @desc Xóa khách hàng
 * @access Private
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customerId = req.params.id;

    const customer = await customerRepository.findOne({ where: { id: customerId } });

    if (!customer) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Khách hàng không tồn tại'
      });
    }

    await customerRepository.remove(customer);

    res.json({
      success: true,
      code: 200,
      message: 'Xóa khách hàng thành công'
    });
  } catch (error) {
    console.error('Xóa khách hàng thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Xóa khách hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

/**
 * @route GET /api/v1/customers/search
 * @desc Tìm kiếm khách hàng
 * @access Private
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const { keyword, page = 1, pageSize = 10 } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 10;
    const skip = (pageNum - 1) * pageSizeNum;

    let queryBuilder = customerRepository.createQueryBuilder('customer');

    if (keyword) {
      queryBuilder = queryBuilder.where(
        'customer.name LIKE :keyword OR customer.phone LIKE :keyword OR customer.email LIKE :keyword',
        { keyword: `%${keyword}%` }
      );
    }

    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(pageSizeNum)
      .orderBy('customer.createdAt', 'DESC')
      .getManyAndCount();

    // Chuyển đổi định dạng dữ liệu
    const list = customers.map(customer => ({
      id: customer.id,
      code: customer.customerNo || '',
      name: customer.name,
      phone: customer.phone || '',
      age: customer.age || 0,
      address: customer.address || '',
      level: customer.level || 'normal',
      status: customer.status || 'active',
      salesPersonId: customer.salesPersonId || '',
      orderCount: customer.orderCount || 0,
      createTime: customer.createdAt?.toISOString() || '',
      createdBy: customer.createdBy || '',
      email: customer.email || '',
      company: customer.company || '',
      source: customer.source || '',
      tags: customer.tags || [],
      remarks: customer.remark || ''
    }));

    res.json({
      success: true,
      code: 200,
      message: 'Tìm kiếm khách hàng thành công',
      data: {
        list,
        total,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Tìm kiếm khách hàng thất bại:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: 'Tìm kiếm khách hàng thất bại',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

// ========== Route con chi tiết khách hàng ==========

/**
 * @route GET /api/v1/customers/:id/orders
 * @desc Lấy lịch sử đơn hàng của khách hàng
 * @access Private
 */
router.get('/:id/orders', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    // Trả về mảng rỗng, thực tế nên truy vấn từ bảng đơn hàng
    res.json({
      success: true,
      code: 200,
      data: []
    });
  } catch (error) {
    console.error('Lấy đơn hàng khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy đơn hàng khách hàng thất bại' });
  }
});

/**
 * @route GET /api/v1/customers/:id/services
 * @desc Lấy bản ghi dịch vụ sau bán hàng của khách hàng
 * @access Private
 */
router.get('/:id/services', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    res.json({ success: true, code: 200, data: [] });
  } catch (error) {
    console.error('Lấy bản ghi dịch vụ sau bán hàng khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy bản ghi dịch vụ sau bán hàng khách hàng thất bại' });
  }
});

/**
 * @route GET /api/v1/customers/:id/calls
 * @desc Lấy lịch sử cuộc gọi của khách hàng
 * @access Private
 */
router.get('/:id/calls', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    res.json({ success: true, code: 200, data: [] });
  } catch (error) {
    console.error('Lấy lịch sử cuộc gọi khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy lịch sử cuộc gọi khách hàng thất bại' });
  }
});

/**
 * @route GET /api/v1/customers/:id/followups
 * @desc Lấy bản ghi theo dõi khách hàng
 * @access Private
 */
router.get('/:id/followups', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    res.json({ success: true, code: 200, data: [] });
  } catch (error) {
    console.error('Lấy bản ghi theo dõi khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy bản ghi theo dõi khách hàng thất bại' });
  }
});

/**
 * @route POST /api/v1/customers/:id/followups
 * @desc Thêm bản ghi theo dõi khách hàng
 * @access Private
 */
router.post('/:id/followups', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    const followUpData = req.body;
    const newFollowUp = {
      id: `followup_${Date.now()}`,
      customerId,
      ...followUpData,
      createTime: new Date().toISOString()
    };
    res.status(201).json({ success: true, code: 200, data: newFollowUp });
  } catch (error) {
    console.error('Thêm bản ghi theo dõi thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Thêm bản ghi theo dõi thất bại' });
  }
});

/**
 * @route PUT /api/v1/customers/:id/followups/:followUpId
 * @desc Cập nhật bản ghi theo dõi khách hàng
 * @access Private
 */
router.put('/:id/followups/:followUpId', async (req: Request, res: Response) => {
  try {
    const { id: customerId, followUpId } = req.params;
    const followUpData = req.body;
    res.json({ success: true, code: 200, data: { id: followUpId, ...followUpData } });
  } catch (error) {
    console.error('Cập nhật bản ghi theo dõi thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Cập nhật bản ghi theo dõi thất bại' });
  }
});

/**
 * @route DELETE /api/v1/customers/:id/followups/:followUpId
 * @desc Xóa bản ghi theo dõi khách hàng
 * @access Private
 */
router.delete('/:id/followups/:followUpId', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, code: 200, message: 'Xóa thành công' });
  } catch (error) {
    console.error('Xóa bản ghi theo dõi thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Xóa bản ghi theo dõi thất bại' });
  }
});

/**
 * @route GET /api/v1/customers/:id/tags
 * @desc Lấy nhãn khách hàng
 * @access Private
 */
router.get('/:id/tags', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { id: req.params.id } });
    res.json({ success: true, code: 200, data: customer?.tags || [] });
  } catch (error) {
    console.error('Lấy nhãn khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Lấy nhãn khách hàng thất bại' });
  }
});

/**
 * @route POST /api/v1/customers/:id/tags
 * @desc Thêm nhãn khách hàng
 * @access Private
 */
router.post('/:id/tags', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { id: req.params.id } });
    if (!customer) {
      return res.status(404).json({ success: false, code: 404, message: 'Khách hàng không tồn tại' });
    }
    const tagData = req.body;
    const newTag = { id: `tag_${Date.now()}`, ...tagData };
    customer.tags = [...(customer.tags || []), newTag];
    await customerRepository.save(customer);
    res.status(201).json({ success: true, code: 200, data: newTag });
  } catch (error) {
    console.error('Thêm nhãn khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Thêm nhãn khách hàng thất bại' });
  }
});

/**
 * @route DELETE /api/v1/customers/:id/tags/:tagId
 * @desc Xóa nhãn khách hàng
 * @access Private
 */
router.delete('/:id/tags/:tagId', async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { id: req.params.id } });
    if (!customer) {
      return res.status(404).json({ success: false, code: 404, message: 'Khách hàng không tồn tại' });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customer.tags = (customer.tags || []).filter((tag: any) => tag.id !== req.params.tagId);
    await customerRepository.save(customer);
    res.json({ success: true, code: 200, message: 'Xóa thành công' });
  } catch (error) {
    console.error('Xóa nhãn khách hàng thất bại:', error);
    res.status(500).json({ success: false, code: 500, message: 'Xóa nhãn khách hàng thất bại' });
  }
});

export default router;
