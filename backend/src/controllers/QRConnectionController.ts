import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

interface ConnectionSession {
  id: string;
  token: string;
  userId?: string;
  deviceInfo?: any;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'connected' | 'expired';
  serverUrl: string;
  permissions: string[];
}

interface ConnectedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  userId: string;
  connectionToken: string;
  lastConnected: Date;
  status: 'online' | 'offline';
  permissions: string[];
}

export class QRConnectionController {
  private connectionSessions: Map<string, ConnectionSession> = new Map();
  private connectedDevices: Map<string, ConnectedDevice> = new Map();

  // Tạo mã QR kết nối
  async generateQRCode(req: Request, res: Response) {
    try {
      const { userId, permissions = ['call', 'sms', 'sync'] } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID người dùng không được để trống'
        });
      }

      const connectionId = uuidv4();
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

      const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

      const session: ConnectionSession = {
        id: connectionId,
        token,
        userId,
        createdAt: new Date(),
        expiresAt,
        status: 'pending',
        serverUrl,
        permissions
      };

      this.connectionSessions.set(connectionId, session);

      // Tạo dữ liệu mã QR
      const qrData = {
        connectionId,
        token,
        serverUrl,
        permissions,
        expiresAt: expiresAt.getTime()
      };

      // Dọn dẹp các phiên đã hết hạn
      this.cleanExpiredSessions();

      return res.json({
         success: true,
         data: {
           connectionId,
           qrData: JSON.stringify(qrData),
           expiresAt,
           permissions
         },
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

  // Xác thực quét mã và thiết lập kết nối
  async connectDevice(req: Request, res: Response) {
    try {
      const { connectionId, token, deviceInfo } = req.body;

      if (!connectionId || !token || !deviceInfo) {
        return res.status(400).json({
          success: false,
          message: 'Tham số kết nối không đầy đủ'
        });
      }

      const session = this.connectionSessions.get(connectionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Phiên kết nối không tồn tại'
        });
      }

      if (session.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Phiên kết nối đã hết hiệu lực'
        });
      }

      if (session.token !== token) {
        return res.status(401).json({
          success: false,
          message: 'Token kết nối không hợp lệ'
        });
      }

      if (new Date() > session.expiresAt) {
        session.status = 'expired';
        return res.status(410).json({
          success: false,
          message: 'Phiên kết nối đã hết hạn'
        });
      }

      // Tạo token kết nối thiết bị
      const deviceConnectionToken = crypto.randomBytes(32).toString('hex');
      const deviceId = deviceInfo.deviceId || uuidv4();

      // Tạo bản ghi thiết bị kết nối
      const connectedDevice: ConnectedDevice = {
        id: uuidv4(),
        deviceId,
        deviceName: deviceInfo.deviceName || 'Thiết bị không xác định',
        userId: session.userId!,
        connectionToken: deviceConnectionToken,
        lastConnected: new Date(),
        status: 'online',
        permissions: session.permissions
      };

      this.connectedDevices.set(deviceId, connectedDevice);
      session.status = 'connected';
      session.deviceInfo = deviceInfo;

      return res.json({
         success: true,
         data: {
           deviceId,
           connectionToken: deviceConnectionToken,
           serverUrl: session.serverUrl,
           permissions: session.permissions,
           userId: session.userId
         },
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

  // Lấy trạng thái kết nối
  async getConnectionStatus(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const session = this.connectionSessions.get(connectionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Phiên kết nối không tồn tại'
        });
      }

      return res.json({
         success: true,
         data: {
           status: session.status,
           createdAt: session.createdAt,
           expiresAt: session.expiresAt,
           deviceInfo: session.deviceInfo
         },
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

  // Ngắt kết nối thiết bị
  async disconnectDevice(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { deviceId } = req.body;

      if (deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
          device.status = 'offline';
        }
      }

      const session = this.connectionSessions.get(connectionId);
      if (session) {
        session.status = 'expired';
      }

      return res.json({
         success: true,
         message: 'Thiết bị đã được ngắt kết nối'
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

  // Lấy danh sách thiết bị đã kết nối
  async getConnectedDevices(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      let devices = Array.from(this.connectedDevices.values());

      if (userId) {
        devices = devices.filter(device => device.userId === userId);
      }

      return res.json({
         success: true,
         data: devices.map(device => ({
           id: device.id,
           deviceId: device.deviceId,
           deviceName: device.deviceName,
           lastConnected: device.lastConnected,
           status: device.status,
           permissions: device.permissions
         }))
       });
    } catch (error) {
      console.error('Lấy danh sách thiết bị thất bại:', error);
      return res.status(500).json({
        success: false,
        message: 'Lấy danh sách thiết bị thất bại'
      });
    }
  }

  // Kết nối lại thiết bị
  async reconnectDevice(req: Request, res: Response) {
    try {
      const { deviceId, connectionToken } = req.body;

      if (!deviceId || !connectionToken) {
        return res.status(400).json({
          success: false,
          message: 'ID thiết bị và token kết nối không được để trống'
        });
      }

      const device = this.connectedDevices.get(deviceId);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Thiết bị không tồn tại'
        });
      }

      if (device.connectionToken !== connectionToken) {
        return res.status(401).json({
          success: false,
          message: 'Token kết nối không hợp lệ'
        });
      }

      // Cập nhật trạng thái thiết bị
      device.status = 'online';
      device.lastConnected = new Date();

      return res.json({
         success: true,
         data: {
           deviceId: device.deviceId,
           deviceName: device.deviceName,
           permissions: device.permissions,
           userId: device.userId
         },
         message: 'Kết nối lại thiết bị thành công'
       });
    } catch (error) {
      console.error('Kết nối lại thiết bị thất bại:', error);
      return res.status(500).json({
        success: false,
        message: 'Kết nối lại thiết bị thất bại'
      });
    }
  }

  // Dọn dẹp các phiên đã hết hạn
  private cleanExpiredSessions() {
    const now = new Date();
    for (const [id, session] of this.connectionSessions.entries()) {
      if (now > session.expiresAt) {
        session.status = 'expired';
        // Có thể chọn xóa phiên đã hết hạn, hoặc giữ lại một thời gian để ghi nhật ký
        // this.connectionSessions.delete(id);
      }
    }
  }
}
