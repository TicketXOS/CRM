import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { LogisticsTracking, LogisticsStatus } from '../entities/LogisticsTracking';
import { LogisticsTrace } from '../entities/LogisticsTrace';
import { Order } from '../entities/Order';
import { Like, In, Between } from 'typeorm';
import { ExpressAPIService } from '../services/ExpressAPIService';
import { logger } from '../config/logger';

export class LogisticsController {
  private expressAPIService = ExpressAPIService.getInstance();

  private get logisticsTrackingRepository() {
    return AppDataSource!.getRepository(LogisticsTracking);
  }

  private get logisticsTraceRepository() {
    return AppDataSource!.getRepository(LogisticsTrace);
  }

  private get orderRepository() {
    return AppDataSource!.getRepository(Order);
  }

  // Lấy danh sách logistics
  async getLogisticsList(req: Request, res: Response) {
    try {
      const {
        page = 1,
        pageSize = 20,
        trackingNo,
        companyCode,
        status,
        startDate,
        endDate,
        orderId
      } = req.query;

      const queryBuilder = this.logisticsTrackingRepository
        .createQueryBuilder('logistics')
        .leftJoinAndSelect('logistics.order', 'order')
        .leftJoinAndSelect('order.customer', 'customer');

      // Điều kiện tìm kiếm
      if (trackingNo) {
        queryBuilder.andWhere('logistics.trackingNo LIKE :trackingNo', {
          trackingNo: `%${trackingNo}%`
        });
      }

      if (companyCode) {
        queryBuilder.andWhere('logistics.companyCode = :companyCode', { companyCode });
      }

      if (status) {
        queryBuilder.andWhere('logistics.status = :status', { status });
      }

      if (orderId) {
        queryBuilder.andWhere('logistics.orderId = :orderId', { orderId });
      }

      if (startDate && endDate) {
        queryBuilder.andWhere('logistics.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });
      }

      // Phân trang
      const skip = (Number(page) - 1) * Number(pageSize);
      queryBuilder.skip(skip).take(Number(pageSize));

      // Sắp xếp
      queryBuilder.orderBy('logistics.updatedAt', 'DESC');

      const [list, total] = await queryBuilder.getManyAndCount();

      res.json({
        code: 200,
        message: 'Lấy thành công',
        data: {
          list,
          total,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      });
    } catch (error) {
      console.error('Lấy danh sách logistics thất bại:', error);
      res.status(500).json({
        code: 500,
        message: 'Lấy danh sách logistics thất bại',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Tạo theo dõi logistics
  async createLogisticsTracking(req: Request, res: Response) {
    try {
      const {
        orderId,
        trackingNo,
        companyCode,
        companyName
      } = req.body;

      // Kiểm tra đơn hàng có tồn tại không
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({
          code: 404,
          message: 'Đơn hàng không tồn tại'
        });
      }

      // Kiểm tra xem đã tồn tại theo dõi logistics tương tự chưa
      const existingTracking = await this.logisticsTrackingRepository.findOne({
        where: { orderId, trackingNo }
      });

      if (existingTracking) {
        return res.status(400).json({
          code: 400,
          message: 'Theo dõi logistics của đơn hàng này đã tồn tại'
        });
      }

      // Tạo theo dõi logistics
      const logisticsTracking = this.logisticsTrackingRepository.create({
        orderId,
        trackingNo,
        companyCode,
        companyName,
        status: LogisticsStatus.PENDING,
        autoSyncEnabled: true,
        nextSyncTime: new Date(Date.now() + 5 * 60 * 1000) // Đồng bộ sau 5 phút
      });

      const savedTracking = await this.logisticsTrackingRepository.save(logisticsTracking);

      // Truy vấn thông tin logistics ngay lập tức
      await this.queryLogisticsInfo(savedTracking.id);

      return res.json({
        code: 200,
        message: 'Tạo thành công',
        data: savedTracking
      });
    } catch (error) {
      console.error('Tạo theo dõi logistics thất bại:', error);
      return res.status(500).json({
        code: 500,
        message: 'Tạo theo dõi logistics thất bại',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Truy vấn lịch sử logistics
  async getLogisticsTrace(req: Request, res: Response) {
    try {
      const { trackingNo, companyCode } = req.query;

      if (!trackingNo) {
        return res.status(400).json({
          code: 400,
          message: 'Số đơn logistics không được để trống'
        });
      }

      // Tìm bản ghi theo dõi logistics
      const tracking = await this.logisticsTrackingRepository.findOne({
        where: { trackingNo: trackingNo as string },
        relations: ['traces', 'order', 'order.customer']
      });

      if (!tracking) {
        // Nếu không có bản ghi, thử truy vấn API trực tiếp
        const apiResult = await this.expressAPIService.queryExpress(trackingNo as string, companyCode as string || 'auto');
        return res.json({
          code: 200,
          message: 'Truy vấn thành công',
          data: apiResult
        });
      }

      // Nếu bản ghi tồn tại nhưng cần cập nhật, truy vấn thông tin mới nhất
      const now = new Date();
      if (!tracking.nextSyncTime || now >= tracking.nextSyncTime) {
        await this.queryLogisticsInfo(tracking.id);

        // Lấy lại dữ liệu đã cập nhật
        const updatedTracking = await this.logisticsTrackingRepository.findOne({
          where: { id: tracking.id },
          relations: ['traces', 'order', 'order.customer']
        });

        return res.json({
          code: 200,
          message: 'Truy vấn thành công',
          data: updatedTracking
        });
      }

      return res.json({
        code: 200,
        message: 'Truy vấn thành công',
        data: tracking
      });
    } catch (error) {
      console.error('Truy vấn lịch sử logistics thất bại:', error);
      return res.status(500).json({
        code: 500,
        message: 'Truy vấn lịch sử logistics thất bại',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Đồng bộ trạng thái logistics hàng loạt
  async batchSyncLogistics(req: Request, res: Response) {
    try {
      const { trackingNumbers } = req.body;

      if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
        return res.status(400).json({
          code: 400,
          message: 'Vui lòng cung cấp danh sách số đơn vận chuyển hợp lệ'
        });
      }

      const results = await Promise.allSettled(
        trackingNumbers.map(async (trackingNo: string) => {
          const tracking = await this.logisticsTrackingRepository.findOne({
            where: { trackingNo: trackingNo }
          });

          if (tracking) {
            return this.queryLogisticsInfo(tracking.id);
          }
          return null;
        })
      );

      return res.json({
        code: 200,
        message: 'Đồng bộ hàng loạt hoàn tất',
        data: results
      });
    } catch (error) {
      console.error('Đồng bộ trạng thái logistics hàng loạt thất bại:', error);
      return res.status(500).json({
        code: 500,
        message: 'Đồng bộ trạng thái logistics hàng loạt thất bại',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Cập nhật trạng thái logistics
  async updateLogisticsStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, remark } = req.body;

      const tracking = await this.logisticsTrackingRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!tracking) {
        return res.status(404).json({
          code: 404,
          message: 'Bản ghi theo dõi logistics không tồn tại'
        });
      }

      // Cập nhật trạng thái
      tracking.status = status;
      tracking.updatedAt = new Date();

      await this.logisticsTrackingRepository.save(tracking);

      return res.json({
        code: 200,
        message: 'Cập nhật trạng thái logistics thành công',
        data: tracking
      });
    } catch (error) {
      console.error('Cập nhật trạng thái logistics thất bại:', error);
      return res.status(500).json({
        code: 500,
        message: 'Cập nhật trạng thái logistics thất bại',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Truy vấn thông tin logistics (phương thức nội bộ)
  private async queryLogisticsInfo(trackingId: number) {
    try {
      const tracking = await this.logisticsTrackingRepository.findOne({
        where: { id: trackingId }
      });

      if (!tracking) {
        throw new Error('Bản ghi theo dõi logistics không tồn tại');
      }

      // Gọi API vận chuyển
      const apiResult = await this.expressAPIService.queryExpress(tracking.trackingNo, tracking.companyCode);

      // Cập nhật trạng thái theo dõi logistics
      await this.logisticsTrackingRepository.update(trackingId, {
        status: this.mapApiStatusToLogisticsStatus(apiResult.status),
        currentLocation: apiResult.currentLocation,
        statusDescription: apiResult.statusDescription,
        lastUpdateTime: new Date(),
        nextSyncTime: new Date(Date.now() + 5 * 60 * 1000), // Đồng bộ lại sau 5 phút
        syncFailureCount: 0,
        lastSyncError: apiResult.success ? undefined : apiResult.error
      });

      // Lưu bản ghi lịch sử
      if (apiResult.traces && apiResult.traces.length > 0) {
        // Xóa bản ghi lịch sử cũ
        await this.logisticsTraceRepository.delete({ logisticsTrackingId: trackingId });

        // Chèn bản ghi lịch sử mới
        const traces = apiResult.traces.map(trace => ({
          logisticsTrackingId: trackingId,
          traceTime: new Date(trace.time),
          location: trace.location,
          description: trace.description,
          status: trace.status,
          operator: trace.operator,
          phone: trace.phone,
          rawData: trace
        }));

        await this.logisticsTraceRepository.save(traces);
      }

      return apiResult;
    } catch (error) {
      // Cập nhật thông tin đồng bộ thất bại
      await this.logisticsTrackingRepository.update(trackingId, {
        syncFailureCount: () => 'syncFailureCount + 1',
        lastSyncError: error instanceof Error ? error.message : String(error),
        nextSyncTime: new Date(Date.now() + 30 * 60 * 1000) // Thử lại sau 30 phút khi thất bại
      });
      throw error;
    }
  }

  // Lấy danh sách công ty vận chuyển được hỗ trợ
  async getSupportedCompanies(req: Request, res: Response) {
    try {
      const companies = this.expressAPIService.getSupportedCompanies();
      const configStatus = this.expressAPIService.getConfigStatus();

      res.json({
        code: 200,
        message: 'Lấy thành công',
        data: {
          companies,
          configStatus
        }
      });
    } catch (error) {
      console.error('Lấy danh sách công ty vận chuyển được hỗ trợ thất bại:', error);
      res.status(500).json({
        code: 500,
        message: 'Lấy danh sách công ty vận chuyển được hỗ trợ thất bại',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Ánh xạ trạng thái API sang trạng thái nội bộ
  private mapApiStatusToLogisticsStatus(apiStatus: string): LogisticsStatus {
    const statusMap: Record<string, LogisticsStatus> = {
      'pending': LogisticsStatus.PENDING,
      'picked_up': LogisticsStatus.PICKED_UP,
      'in_transit': LogisticsStatus.IN_TRANSIT,
      'out_for_delivery': LogisticsStatus.OUT_FOR_DELIVERY,
      'delivered': LogisticsStatus.DELIVERED,
      'exception': LogisticsStatus.EXCEPTION,
      'rejected': LogisticsStatus.REJECTED,
      'returned': LogisticsStatus.RETURNED
    };

    return statusMap[apiStatus] || LogisticsStatus.PENDING;
  }
}
