import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

interface ConnectedDevice {
  id: string
  deviceId: string
  deviceName: string
  deviceType: string
  connectionType: 'bluetooth' | 'network' | 'digital'
  connectedAt: string
  lastActivity: string
  status: 'connected' | 'disconnected'
  metadata?: any
}

interface ConnectionService {
  enabled: boolean
  deviceName?: string
  pairingCode?: string
  port?: number
  broadcastInterval?: number
  currentCode?: string
  expireTime?: number
}

export class AlternativeConnectionController {
  private connectedDevices: Map<string, ConnectedDevice> = new Map()
  private bluetoothService: ConnectionService = { enabled: false }
  private networkService: ConnectionService = { enabled: false }
  private digitalPairingService: ConnectionService = { enabled: false }

  // Các phương thức liên quan đến kết nối Bluetooth
  async startBluetoothService(req: Request, res: Response) {
    try {
      const { deviceName = 'CRM-Server' } = req.body

      this.bluetoothService = {
        enabled: true,
        deviceName,
        pairingCode: this.generateRandomCode(6)
      }

      return res.json({
        success: true,
        message: 'Dịch vụ Bluetooth đã được khởi động',
        data: {
          deviceName: this.bluetoothService.deviceName,
          pairingCode: this.bluetoothService.pairingCode
        }
      })
    } catch (error) {
      console.error('Khởi động dịch vụ Bluetooth thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Khởi động dịch vụ Bluetooth thất bại'
      })
    }
  }

  async stopBluetoothService(req: Request, res: Response) {
    try {
      this.bluetoothService = { enabled: false }

      // Ngắt kết nối tất cả thiết bị Bluetooth
      for (const [deviceId, device] of this.connectedDevices) {
        if (device.connectionType === 'bluetooth') {
          device.status = 'disconnected'
          this.connectedDevices.delete(deviceId)
        }
      }

      return res.json({
        success: true,
        message: 'Dịch vụ Bluetooth đã được dừng'
      })
    } catch (error) {
      console.error('Dừng dịch vụ Bluetooth thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Dừng dịch vụ Bluetooth thất bại'
      })
    }
  }

  async getBluetoothStatus(req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        data: this.bluetoothService
      })
    } catch (error) {
      console.error('Lấy trạng thái Bluetooth thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Lấy trạng thái Bluetooth thất bại'
      })
    }
  }

  async pairBluetoothDevice(req: Request, res: Response) {
    try {
      const { pairingCode, deviceInfo } = req.body

      if (!this.bluetoothService.enabled) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ Bluetooth chưa được khởi động'
        })
      }

      if (pairingCode !== this.bluetoothService.pairingCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã ghép đôi không đúng'
        })
      }

      const deviceId = uuidv4()
      const device: ConnectedDevice = {
        id: deviceId,
        deviceId: deviceInfo.deviceId || deviceId,
        deviceName: deviceInfo.deviceName || 'Thiết bị không xác định',
        deviceType: deviceInfo.deviceType || 'mobile',
        connectionType: 'bluetooth',
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'connected',
        metadata: deviceInfo
      }

      this.connectedDevices.set(deviceId, device)

      return res.json({
        success: true,
        message: 'Ghép đôi thiết bị Bluetooth thành công',
        data: device
      })
    } catch (error) {
      console.error('Ghép đôi thiết bị Bluetooth thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Ghép đôi thiết bị Bluetooth thất bại'
      })
    }
  }

  // Các phương thức liên quan đến kết nối cùng mạng
  async startNetworkDiscovery(req: Request, res: Response) {
    try {
      const { port = 8080, broadcastInterval = 10 } = req.body

      this.networkService = {
        enabled: true,
        port,
        broadcastInterval
      }

      return res.json({
        success: true,
        message: 'Phát hiện mạng đã được khởi động',
        data: {
          port: this.networkService.port,
          broadcastInterval: this.networkService.broadcastInterval
        }
      })
    } catch (error) {
      console.error('Khởi động phát hiện mạng thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Khởi động phát hiện mạng thất bại'
      })
    }
  }

  async stopNetworkDiscovery(req: Request, res: Response) {
    try {
      this.networkService = { enabled: false }

      // Ngắt kết nối tất cả thiết bị mạng
      for (const [deviceId, device] of this.connectedDevices) {
        if (device.connectionType === 'network') {
          device.status = 'disconnected'
          this.connectedDevices.delete(deviceId)
        }
      }

      return res.json({
        success: true,
        message: 'Phát hiện mạng đã được dừng'
      })
    } catch (error) {
      console.error('Dừng phát hiện mạng thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Dừng phát hiện mạng thất bại'
      })
    }
  }

  async getNetworkStatus(req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        data: this.networkService
      })
    } catch (error) {
      console.error('Lấy trạng thái mạng thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Lấy trạng thái mạng thất bại'
      })
    }
  }

  async connectNetworkDevice(req: Request, res: Response) {
    try {
      const { deviceInfo } = req.body

      if (!this.networkService.enabled) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ phát hiện mạng chưa được khởi động'
        })
      }

      const deviceId = uuidv4()
      const device: ConnectedDevice = {
        id: deviceId,
        deviceId: deviceInfo.deviceId || deviceId,
        deviceName: deviceInfo.deviceName || 'Thiết bị không xác định',
        deviceType: deviceInfo.deviceType || 'mobile',
        connectionType: 'network',
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'connected',
        metadata: deviceInfo
      }

      this.connectedDevices.set(deviceId, device)

      return res.json({
        success: true,
        message: 'Kết nối thiết bị mạng thành công',
        data: device
      })
    } catch (error) {
      console.error('Kết nối thiết bị mạng thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Kết nối thiết bị mạng thất bại'
      })
    }
  }

  // Các phương thức liên quan đến ghép đôi số
  async startDigitalPairing(req: Request, res: Response) {
    try {
      const { expireTime = 10 } = req.body

      this.digitalPairingService = {
        enabled: true,
        currentCode: this.generateRandomCode(6),
        expireTime
      }

      return res.json({
        success: true,
        message: 'Ghép đôi số đã được khởi động',
        data: {
          currentCode: this.digitalPairingService.currentCode,
          expireTime: this.digitalPairingService.expireTime
        }
      })
    } catch (error) {
      console.error('Khởi động ghép đôi số thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Khởi động ghép đôi số thất bại'
      })
    }
  }

  async stopDigitalPairing(req: Request, res: Response) {
    try {
      this.digitalPairingService = { enabled: false }

      return res.json({
        success: true,
        message: 'Ghép đôi số đã được dừng'
      })
    } catch (error) {
      console.error('Dừng ghép đôi số thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Dừng ghép đôi số thất bại'
      })
    }
  }

  async getDigitalPairingStatus(req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        data: this.digitalPairingService
      })
    } catch (error) {
      console.error('Lấy trạng thái ghép đôi số thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Lấy trạng thái ghép đôi số thất bại'
      })
    }
  }

  async pairWithCode(req: Request, res: Response) {
    try {
      const { pairingCode, deviceInfo } = req.body

      if (!this.digitalPairingService.enabled) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ ghép đôi số chưa được khởi động'
        })
      }

      if (pairingCode !== this.digitalPairingService.currentCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã ghép đôi không đúng'
        })
      }

      const deviceId = uuidv4()
      const device: ConnectedDevice = {
        id: deviceId,
        deviceId: deviceInfo.deviceId || deviceId,
        deviceName: deviceInfo.deviceName || 'Thiết bị không xác định',
        deviceType: deviceInfo.deviceType || 'mobile',
        connectionType: 'digital',
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'connected',
        metadata: deviceInfo
      }

      this.connectedDevices.set(deviceId, device)

      return res.json({
        success: true,
        message: 'Ghép đôi số thành công',
        data: device
      })
    } catch (error) {
      console.error('Ghép đôi số thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Ghép đôi số thất bại'
      })
    }
  }

  async generatePairingCode(req: Request, res: Response) {
    try {
      if (!this.digitalPairingService.enabled) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ ghép đôi số chưa được khởi động'
        })
      }

      this.digitalPairingService.currentCode = this.generateRandomCode(6)

      return res.json({
        success: true,
        message: 'Mã ghép đôi đã được cập nhật',
        data: {
          currentCode: this.digitalPairingService.currentCode
        }
      })
    } catch (error) {
      console.error('Tạo mã ghép đôi thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Tạo mã ghép đôi thất bại'
      })
    }
  }

  // Các phương thức quản lý kết nối chung
  async getAllConnectedDevices(req: Request, res: Response) {
    try {
      const devices = Array.from(this.connectedDevices.values())
        .filter(device => device.status === 'connected')

      return res.json({
        success: true,
        data: devices
      })
    } catch (error) {
      console.error('Lấy danh sách thiết bị kết nối thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Lấy danh sách thiết bị kết nối thất bại'
      })
    }
  }

  async disconnectDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params

      const device = this.connectedDevices.get(deviceId)
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Thiết bị không tồn tại'
        })
      }

      device.status = 'disconnected'
      this.connectedDevices.delete(deviceId)

      return res.json({
        success: true,
        message: 'Thiết bị đã được ngắt kết nối'
      })
    } catch (error) {
      console.error('Ngắt kết nối thiết bị thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Ngắt kết nối thiết bị thất bại'
      })
    }
  }

  async getConnectionStatistics(req: Request, res: Response) {
    try {
      const devices = Array.from(this.connectedDevices.values())
        .filter(device => device.status === 'connected')

      const stats = {
        total: devices.length,
        bluetooth: devices.filter(d => d.connectionType === 'bluetooth').length,
        network: devices.filter(d => d.connectionType === 'network').length,
        digital: devices.filter(d => d.connectionType === 'digital').length,
        qr: 0, // Có thể lấy từ dịch vụ kết nối mã QR
        services: {
          bluetooth: this.bluetoothService.enabled,
          network: this.networkService.enabled,
          digital: this.digitalPairingService.enabled
        }
      }

      return res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Lấy thống kê kết nối thất bại:', error)
      return res.status(500).json({
        success: false,
        message: 'Lấy thống kê kết nối thất bại'
      })
    }
  }

  // Phương thức tiện ích
  private generateRandomCode(length: number): string {
    const chars = '0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}
