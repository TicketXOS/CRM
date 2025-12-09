import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

interface QRConnectionData {
  connectionId: string;
  qrData: string;
  qrCodeUrl?: string;
  expiresAt: string;
  permissions: string[];
}

interface ConnectedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  lastConnected: string;
  status: 'online' | 'offline';
  permissions: string[];
}

interface ConnectionStatus {
  status: 'pending' | 'connected' | 'expired';
  createdAt: string;
  expiresAt: string;
  deviceInfo?: any;
}

// Lưu trữ trong bộ nhớ (môi trường sản xuất nên sử dụng cơ sở dữ liệu)
const connections = new Map<string, {
  connectionId: string;
  userId: string;
  permissions: string[];
  status: 'pending' | 'connected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: any;
}>();

const connectedDevices = new Map<string, ConnectedDevice>();

export class QRConnectionController {

  /**
   * Tạo mã QR kết nối
   */
  async generateQRCode(req: Request, res: Response) {
    try {
      const { userId, permissions = ['call', 'sms', 'contacts'] } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID người dùng không được để trống'
        });
      }

      // Tạo ID kết nối
      const connectionId = uuidv4();

      // Đặt thời gian hết hạn (5 phút)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Tạo dữ liệu kết nối
      const connectionData = {
        connectionId,
        userId,
        permissions,
        status: 'pending' as const,
        createdAt: new Date(),
        expiresAt
      };

      // Lưu thông tin kết nối
      connections.set(connectionId, connectionData);

      // Tạo dữ liệu mã QR (định dạng JSON)
      const qrData = JSON.stringify({
        type: 'crm_mobile_connection',
        connectionId,
        serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
        permissions,
        expiresAt: expiresAt.toISOString()
      });

      // Tạo URL hình ảnh mã QR
      let qrCodeUrl: string;
      try {
        qrCodeUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (qrError) {
        console.warn('Tạo QRCode thất bại, sử dụng dịch vụ trực tuyến:', qrError);
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      }

      const response: QRConnectionData = {
        connectionId,
        qrData,
        qrCodeUrl,
        expiresAt: expiresAt.toISOString(),
        permissions
      };

      return res.json({
         success: true,
         data: response,
         message: 'Tạo mã QR thành công'
       });

    } catch (error) {
      console.error('Tạo mã QR thất bại:', error);
      return res.status(500).json({
        success: false,
        message: 'Tạo mã QR thất bại',
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      });
    }
  }

  /**
   * Lấy trạng thái kết nối
   */
  async getConnectionStatus(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      const connection = connections.get(connectionId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Kết nối không tồn tại'
        });
      }

      // Kiểm tra xem đã hết hạn chưa
      if (new Date() > connection.expiresAt) {
        connection.status = 'expired';
        connections.set(connectionId, connection);
      }

      const response: ConnectionStatus = {
        status: connection.status,
        createdAt: connection.createdAt.toISOString(),
        expiresAt: connection.expiresAt.toISOString(),
        deviceInfo: connection.deviceInfo
      };

      return res.json({
         success: true,
         data: response,
         message: 'Lấy trạng thái kết nối thành công'
       });

    } catch (error) {
      console.error('Lấy trạng thái kết nối thất bại:', error);
      return res.status(500).json({
        success: false,
        message: 'Lấy trạng thái kết nối thất bại',
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      });
    }
  }

  /**
   * Ngắt kết nối thiết bị
   */
  async disconnectDevice(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { deviceId } = req.body;

      const connection = connections.get(connectionId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Kết nối không tồn tại'
        });
      }

      // Cập nhật trạng thái kết nối
      connection.status = 'expired';
      connections.set(connectionId, connection);

      // Nếu chỉ định deviceId, xóa khỏi danh sách thiết bị đã kết nối
      if (deviceId && connectedDevices.has(deviceId)) {
        connectedDevices.delete(deviceId);
      }

      return res.json({
         success: true,
         message: 'Ngắt kết nối thiết bị thành công'
       });

    } catch (error) {
      console.error('Ngắt kết nối thiết bị thất bại:', error);
      return res.status(500).json({
        success: false,
        message: 'Ngắt kết nối thiết bị thất bại',
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      });
    }
  }

  /**
   * Lấy danh sách thiết bị đã kết nối
   */
  async getConnectedDevices(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      // Lọc thiết bị của người dùng (nếu chỉ định userId)
      const devices = Array.from(connectedDevices.values());

      if (userId) {
        // Có thể lọc thiết bị theo userId ở đây, hiện tại trả về tất cả thiết bị
        // devices = devices.filter(device => device.userId === userId);
      }

      return res.json({
         success: true,
         data: devices,
         message: 'Lấy danh sách thiết bị kết nối thành công'
       });

    } catch (error) {
      console.error('Lấy danh sách thiết bị kết nối thất bại:', error);
      return res.status(500).json({
        success: false,
        message: 'Lấy danh sách thiết bị kết nối thất bại',
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      });
    }
  }

  /**
   * Mô phỏng kết nối thiết bị (dùng cho kiểm thử)
   */
  async connectDevice(req: Request, res: Response) {
    try {
      const { connectionId, deviceInfo } = req.body;

      const connection = connections.get(connectionId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Kết nối không tồn tại'
        });
      }

      if (connection.status === 'expired') {
        return res.status(400).json({
          success: false,
          message: 'Kết nối đã hết hạn'
        });
      }

      // Cập nhật trạng thái kết nối
      connection.status = 'connected';
      connection.deviceInfo = deviceInfo;
      connections.set(connectionId, connection);

      // Thêm vào danh sách thiết bị đã kết nối
      const device: ConnectedDevice = {
        id: uuidv4(),
        deviceId: deviceInfo.deviceId || uuidv4(),
        deviceName: deviceInfo.deviceName || 'Thiết bị không xác định',
        lastConnected: new Date().toISOString(),
        status: 'online',
        permissions: connection.permissions
      };

      connectedDevices.set(device.deviceId, device);

      return res.json({
        success: true,
        data: device,
        message: 'Kết nối thiết bị thành công'
      });

    } catch (error) {
      console.error('Kết nối thiết bị thất bại:', error);
      return res.status(500).json({
        success: false,
        message: 'Kết nối thiết bị thất bại',
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      });
    }
  }
}

export const qrConnectionController = new QRConnectionController();
