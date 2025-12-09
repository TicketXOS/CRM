import axios from 'axios'
import crypto from 'crypto'

interface SFExpressConfig {
  appId: string
  checkWord: string
  apiUrl: string
}

interface QueryRouteParams {
  trackingNumber: string
  orderNumber?: string
}

class SFExpressService {
  private config: SFExpressConfig | null = null
  private mockMode: boolean = false // Công tắc chế độ Mock
  private sequenceCounter: number = 0 // Bộ đếm số thứ tự

  // Bảng ánh xạ mã lỗi API SF Express
  private readonly ERROR_CODE_MAP: Record<string, string> = {
    'A1000': 'Thành công',
    'A1001': 'Lỗi tham số',
    'A1002': 'Lỗi chữ ký số',
    'A1003': 'partnerID không tồn tại',
    'A1004': 'Lỗi checkWord',
    'A1005': 'Dấu thời gian đã hết hạn (quá 5 phút)',
    'A1006': 'requestID trùng lặp',
    'A1007': 'Mã dịch vụ không tồn tại',
    'A1008': 'IP chưa được ủy quyền',
    'A1009': 'Tần suất gọi API vượt quá giới hạn',
    'A1010': 'Hệ thống bất thường',
    'A2001': 'Mã vận đơn không tồn tại',
    'A2002': 'Định dạng mã vận đơn sai',
    'A2003': 'Đơn hàng không tồn tại',
    'A2004': 'Trạng thái đơn hàng không cho phép thao tác này',
    'A3001': 'Thông tin người gửi không đầy đủ',
    'A3002': 'Thông tin người nhận không đầy đủ',
    'A3003': 'Thông tin hàng hóa không đầy đủ',
    'A3004': 'Địa chỉ không nằm trong phạm vi dịch vụ',
    'A4001': 'Số dư không đủ',
    'A4002': 'Tài khoản thanh toán tháng không tồn tại',
    'A4003': 'Tài khoản thanh toán tháng đã bị đóng băng',
    'A9999': 'Hệ thống bận, vui lòng thử lại sau'
  }

  /**
   * Thiết lập cấu hình
   */
  setConfig(config: SFExpressConfig) {
    this.config = config
  }

  /**
   * Lấy cấu hình
   */
  getConfig(): SFExpressConfig | null {
    return this.config
  }

  /**
   * Bật chế độ Mock
   */
  enableMockMode() {
    this.mockMode = true
    console.log('Dịch vụ SF Express: Chế độ Mock đã được bật')
  }

  /**
   * Tắt chế độ Mock
   */
  disableMockMode() {
    this.mockMode = false
    console.log('Dịch vụ SF Express: Chế độ Mock đã được tắt')
  }

  /**
   * Kiểm tra xem có phải chế độ Mock không
   */
  isMockMode(): boolean {
    return this.mockMode
  }

  /**
   * Tạo chữ ký MD5
   */
  private generateSign(msgData: string, checkWord: string): string {
    const str = msgData + checkWord
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase()
  }

  /**
   * Tạo ID yêu cầu
   * Định dạng: Mã khách hàng + Dấu thời gian (13 chữ số) + 4 chữ số thứ tự
   * Ví dụ: TEST123456789012340001
   */
  private generateRequestID(partnerID: string): string {
    const timestamp = Date.now() // Dấu thời gian 13 chữ số

    // Tạo 4 chữ số thứ tự (0000-9999)
    this.sequenceCounter = (this.sequenceCounter + 1) % 10000
    const sequence = this.sequenceCounter.toString().padStart(4, '0')

    return `${partnerID}${timestamp}${sequence}`
  }

  /**
   * Lấy thông tin lỗi
   */
  private getErrorMessage(code: string, defaultMsg?: string): string {
    return this.ERROR_CODE_MAP[code] || defaultMsg || `Mã lỗi không xác định: ${code}`
  }

  /**
   * Phương thức yêu cầu chung
   * Triển khai theo tài liệu API SF Express Bridge
   */
  private async request(serviceCode: string, msgData: any, config?: SFExpressConfig) {
    const cfg = config || this.config

    if (!cfg) {
      throw new Error('Cấu hình SF Express chưa được thiết lập')
    }

    // 将msgData转为JSON字符串
    const msgDataStr = typeof msgData === 'string' ? msgData : JSON.stringify(msgData)

    // 生成签名: MD5(msgData + checkWord)
    const msgDigest = this.generateSign(msgDataStr, cfg.checkWord)

    // 构建请求参数
    const requestData = {
      partnerID: cfg.appId,
      requestID: this.generateRequestID(cfg.appId), // 客户编码 + 时间戳 + 4位序列号
      serviceCode: serviceCode,
      timestamp: Date.now(),
      msgDigest: msgDigest,
      msgData: msgDataStr
    }

    console.log('=== Chi tiết yêu cầu API SF Express ===')
    console.log('URL:', cfg.apiUrl)
    console.log('Mã dịch vụ:', serviceCode)
    console.log('Mã khách hàng:', cfg.appId)
    console.log('ID yêu cầu:', requestData.requestID)
    console.log('Dấu thời gian:', requestData.timestamp)
    console.log('Dữ liệu nghiệp vụ:', msgDataStr)
    console.log('Chữ ký:', msgDigest)
    console.log('Văn bản chữ ký:', msgDataStr + ' + ***checkWord***')
    console.log('========================')

    try {
      // Sử dụng định dạng application/x-www-form-urlencoded
      const formData = new URLSearchParams()
      Object.entries(requestData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      const startTime = Date.now()
      const response = await axios.post(cfg.apiUrl, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        timeout: 30000 // Hết thời gian 30 giây
      })
      const endTime = Date.now()

      console.log('=== Chi tiết phản hồi API SF Express ===')
      console.log('Thời gian phản hồi:', `${endTime - startTime}ms`)
      console.log('Trạng thái phản hồi:', response.status)
      console.log('Dữ liệu phản hồi:', JSON.stringify(response.data, null, 2))
      console.log('========================')

      return response.data
    } catch (error: any) {
      console.error('=== Gọi API SF Express thất bại ===')
      console.error('Loại lỗi:', error.code || 'UNKNOWN')
      console.error('Thông tin lỗi:', error.message)

      if (error.response) {
        console.error('Trạng thái HTTP:', error.response.status)
        console.error('Tiêu đề phản hồi:', error.response.headers)
        console.error('Dữ liệu phản hồi:', error.response.data)
      } else if (error.request) {
        console.error('Yêu cầu đã được gửi nhưng không có phản hồi')
        console.error('Chi tiết yêu cầu:', error.request)
      } else {
        console.error('Lỗi cấu hình yêu cầu:', error.config)
      }
      console.error('========================')

      throw error
    }
  }

  /**
   * Kiểm tra kết nối
   * Sử dụng giao diện truy vấn tuyến đường để kiểm tra kết nối và chữ ký có đúng không
   */
  async testConnection(config: SFExpressConfig): Promise<{ success: boolean; message: string; data?: any }> {
    // Chế độ Mock: Trả về thành công trực tiếp
    if (this.mockMode) {
      console.log('Chế độ Mock: Kiểm tra kết nối')
      return {
        success: true,
        message: 'Kết nối thành công (Chế độ Mock)',
        data: {
          mode: 'mock',
          apiResultCode: 'A1000',
          apiErrorMsg: '',
          apiResultData: {}
        }
      }
    }

    try {
      // Sử dụng giao diện truy vấn tuyến đường để kiểm tra
      // Ngay cả khi mã vận đơn không tồn tại, chỉ cần chữ ký đúng, vẫn sẽ trả về phản hồi lỗi bình thường
      const msgData = {
        trackingType: '1', // 1: Truy vấn theo mã vận đơn SF Express
        trackingNumber: ['SF1234567890'], // Mã vận đơn kiểm tra
        methodType: '1' // 1: Truy vấn tiêu chuẩn
      }

      const result = await this.request('EXP_RECE_SEARCH_ROUTES', msgData, config)

      console.log('Kết quả kiểm tra kết nối:', result)

      // Kiểm tra định dạng phản hồi
      if (result && typeof result === 'object') {
        // Định dạng phản hồi API SF Express: { apiResultCode, apiErrorMsg, apiResultData }
        const { apiResultCode, apiErrorMsg } = result

        if (apiResultCode) {
          const errorMsg = this.getErrorMessage(apiResultCode, apiErrorMsg)

          // A1000 hoặc A2001 (mã vận đơn không tồn tại) đều cho thấy kết nối và chữ ký đúng
          if (apiResultCode === 'A1000' || apiResultCode === 'A2001') {
            return {
              success: true,
              message: `✓ Kết nối thành công! ${errorMsg}`,
              data: result
            }
          }

          // Lỗi chữ ký hoặc cấu hình
          if (['A1002', 'A1003', 'A1004'].includes(apiResultCode)) {
            return {
              success: false,
              message: `✗ Lỗi cấu hình: [${apiResultCode}] ${errorMsg}`,
              data: result
            }
          }

          // Các mã lỗi khác, nhưng có thể nhận phản hồi cho thấy kết nối bình thường
          return {
            success: true,
            message: `✓ Kết nối thành công (${apiResultCode}: ${errorMsg})`,
            data: result
          }
        }

        // Có phản hồi nhưng định dạng không đúng
        return {
          success: true,
          message: '✓ Kết nối thành công, đã nhận phản hồi',
          data: result
        }
      }

      // Nhận phản hồi nhưng định dạng bất thường
      return {
        success: true,
        message: '✓ Kết nối thành công',
        data: result
      }

    } catch (error: any) {
      console.error('Lỗi kiểm tra kết nối:', error)

      // Lỗi hết thời gian
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        return {
          success: false,
          message: '✗ Kết nối hết thời gian, vui lòng kiểm tra mạng hoặc địa chỉ API có đúng không'
        }
      }

      // Lỗi mạng
      if (error?.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: '✗ Không thể kết nối đến API SF Express, vui lòng kiểm tra địa chỉ API và kết nối mạng'
        }
      }

      // Lỗi phân giải DNS
      if (error?.code === 'ENOTFOUND') {
        return {
          success: false,
          message: '✗ Địa chỉ API không hợp lệ, không thể phân giải tên miền'
        }
      }

      // Có phản hồi HTTP
      if (error?.response) {
        const status = error.response.status
        const data = error.response.data

        console.log('Phản hồi HTTP:', { status, data })

        // Lỗi 404 - Đường dẫn không đúng
        if (status === 404) {
          return {
            success: false,
            message: '✗ Lỗi đường dẫn API (404), vui lòng xác nhận sử dụng đường dẫn đầy đủ: /std/service'
          }
        }

        // Lỗi 403 - IP chưa được ủy quyền
        if (status === 403) {
          return {
            success: false,
            message: '✗ IP chưa được ủy quyền hoặc bị từ chối truy cập (403), vui lòng cấu hình danh sách trắng IP trên nền tảng SF Bridge'
          }
        }

        // Lỗi 500 - Lỗi máy chủ
        if (status === 500) {
          return {
            success: false,
            message: '✗ Lỗi nội bộ máy chủ SF Express (500), vui lòng thử lại sau'
          }
        }

        // Phản hồi 200 nhưng có lỗi
        if (status === 200) {
          // Kiểm tra xem có phải lỗi nghiệp vụ SF Express không
          if (data && data.apiResultCode) {
            const errorMsg = this.getErrorMessage(data.apiResultCode, data.apiErrorMsg)
            return {
              success: data.apiResultCode === 'A1000' || data.apiResultCode === 'A2001',
              message: `[${data.apiResultCode}] ${errorMsg}`,
              data: data
            }
          }

          return {
            success: true,
            message: '✓ Kết nối thành công',
            data: data
          }
        }

        // Các lỗi HTTP khác
        return {
          success: false,
          message: `✗ Lỗi HTTP ${status}: ${data?.message || error.message}`
        }
      }

      // Các lỗi khác
      const errorMessage = error instanceof Error ? error.message : 'Kết nối thất bại'
      return {
        success: false,
        message: `✗ ${errorMessage}`
      }
    }
  }

  /**
   * Truy vấn lịch sử logistics
   * Mã dịch vụ: EXP_RECE_SEARCH_ROUTES
   */
  async queryRoute(params: QueryRouteParams) {
    if (!this.config) {
      throw new Error('Cấu hình SF Express chưa được thiết lập, vui lòng cấu hình trước')
    }

    // Chế độ Mock: Trả về dữ liệu mô phỏng
    if (this.mockMode) {
      console.log('Chế độ Mock: Truy vấn lịch sử logistics', params.trackingNumber)
      return {
        success: true,
        data: {
          routeResps: [
            {
              mailNo: params.trackingNumber,
              routes: [
                {
                  acceptTime: '2024-01-15 10:00:00',
                  acceptAddress: 'Thành phố Thâm Quyến',
                  remark: '【Thành phố Thâm Quyến】 Đã nhận hàng',
                  opCode: '50'
                },
                {
                  acceptTime: '2024-01-15 12:30:00',
                  acceptAddress: 'Trung tâm vận chuyển Thâm Quyến',
                  remark: 'Bưu kiện tại 【Trung tâm vận chuyển Thâm Quyến】 đã được xếp lên xe, chuẩn bị gửi đến trạm tiếp theo',
                  opCode: '505'
                },
                {
                  acceptTime: '2024-01-16 08:00:00',
                  acceptAddress: 'Trung tâm vận chuyển Quảng Châu',
                  remark: 'Bưu kiện đã đến 【Trung tâm vận chuyển Quảng Châu】',
                  opCode: '505'
                },
                {
                  acceptTime: '2024-01-16 14:00:00',
                  acceptAddress: 'Thành phố Quảng Châu',
                  remark: 'Bưu kiện đã đến 【Thành phố Quảng Châu】 đang giao hàng',
                  opCode: '204'
                },
                {
                  acceptTime: '2024-01-16 16:30:00',
                  acceptAddress: 'Thành phố Quảng Châu',
                  remark: 'Đã ký nhận, người ký nhận: Bản thân',
                  opCode: '80'
                }
              ]
            }
          ]
        },
        message: 'Truy vấn thành công (Chế độ Mock)'
      }
    }

    const msgData = {
      trackingType: '1', // 1: Truy vấn theo mã vận đơn SF Express
      trackingNumber: [params.trackingNumber],
      methodType: '1' // 1: Truy vấn tiêu chuẩn
    }

    // Nếu có mã đơn hàng khách hàng, thêm vào yêu cầu
    if (params.orderNumber) {
      Object.assign(msgData, { referenceNumber: params.orderNumber })
    }

    const result = await this.request('EXP_RECE_SEARCH_ROUTES', msgData)

    // Phân tích phản hồi
    const errorMsg = this.getErrorMessage(result.apiResultCode, result.apiErrorMsg)

    if (result.apiResultCode === 'A1000') {
      return {
        success: true,
        data: result.apiResultData,
        message: 'Truy vấn thành công'
      }
    } else {
      return {
        success: false,
        message: `[${result.apiResultCode}] ${errorMsg}`,
        code: result.apiResultCode
      }
    }
  }

  /**
   * Lọc đơn hàng
   */
  async filterOrders(params: unknown) {
    if (!this.config) {
      throw new Error('Cấu hình SF Express chưa được thiết lập, vui lòng cấu hình trước')
    }

    const msgData = JSON.stringify(params)
    return await this.request('EXP_RECE_SEARCH_ORDER_BSP', msgData)
  }

  /**
   * Tạo đơn hàng
   */
  async createOrder(orderData: unknown) {
    if (!this.config) {
      throw new Error('Cấu hình SF Express chưa được thiết lập, vui lòng cấu hình trước')
    }

    const msgData = JSON.stringify(orderData)
    return await this.request('EXP_RECE_CREATE_ORDER', msgData)
  }
}

export default new SFExpressService()
