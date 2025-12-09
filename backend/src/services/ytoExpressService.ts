import crypto from 'crypto'
import axios from 'axios'

/**
 * Dịch vụ YTO Express
 */
export class YTOExpressService {
  /**
   * Tạo chữ ký MD5
   */
  private generateSign(params: Record<string, any>, appKey: string): string {
    // 1. Sắp xếp tham số
    const sortedKeys = Object.keys(params).sort()

    // 2. Nối chuỗi: appKey + key1value1key2value2... + appKey
    let signStr = appKey
    sortedKeys.forEach(key => {
      if (key !== 'sign') { // Loại trừ trường sign
        signStr += key + params[key]
      }
    })
    signStr += appKey

    // 3. Mã hóa MD5 và chuyển thành chữ hoa
    return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase()
  }

  /**
   * Kiểm tra kết nối
   */
  async testConnection(userId: string, appKey: string, apiUrl: string): Promise<{
    success: boolean
    message: string
    data?: any
  }> {
    try {
      // Xây dựng tham số yêu cầu kiểm tra
      const params = {
        user_id: userId,
        format: 'JSON',
        method: 'yto.marketing.trace.query',
        timestamp: Date.now().toString(),
        v: '1.0',
        waybill_no: 'YT1234567890' // Mã vận đơn kiểm tra
      }

      // Tạo chữ ký
      const sign = this.generateSign(params, appKey)
      const requestParams = {
        ...params,
        sign
      }

      console.log('Tham số yêu cầu kiểm tra API YTO:', requestParams)

      // Gửi yêu cầu
      const response = await axios.post(apiUrl, null, {
        params: requestParams,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      })

      console.log('Phản hồi kiểm tra API YTO:', response.data)

      // Kiểm tra phản hồi
      if (response.data) {
        // Phản hồi thành công API YTO
        if (response.data.success === true || response.data.success === 'true') {
          return {
            success: true,
            message: 'Kết nối thành công',
            data: response.data
          }
        }

        // API YTO trả về lỗi
        return {
          success: false,
          message: response.data.reason || response.data.message || 'Kết nối thất bại',
          data: response.data
        }
      }

      return {
        success: false,
        message: 'Dữ liệu phản hồi trống'
      }
    } catch (error: any) {
      console.error('Kiểm tra kết nối API YTO thất bại:', error)

      // Phân tích thông tin lỗi
      let errorMessage = 'Kết nối thất bại'

      if (error.response) {
        // Máy chủ trả về phản hồi lỗi
        errorMessage = `Lỗi máy chủ: ${error.response.status}`
        if (error.response.data) {
          errorMessage += ` - ${error.response.data.reason || error.response.data.message || ''}`
        }
      } else if (error.request) {
        // Yêu cầu đã được gửi nhưng không nhận được phản hồi
        errorMessage = 'Lỗi mạng: Không thể kết nối đến máy chủ YTO'
      } else {
        // Lỗi cấu hình yêu cầu
        errorMessage = error.message || 'Lỗi không xác định'
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  /**
   * Truy vấn lịch sử logistics
   */
  async queryTracking(
    userId: string,
    appKey: string,
    apiUrl: string,
    waybillNo: string
  ): Promise<{
    success: boolean
    message: string
    data?: any
  }> {
    try {
      // Xây dựng tham số yêu cầu truy vấn
      const params = {
        user_id: userId,
        format: 'JSON',
        method: 'yto.marketing.trace.query',
        timestamp: Date.now().toString(),
        v: '1.0',
        waybill_no: waybillNo
      }

      // Tạo chữ ký
      const sign = this.generateSign(params, appKey)
      const requestParams = {
        ...params,
        sign
      }

      console.log('Tham số yêu cầu truy vấn logistics YTO:', requestParams)

      // Gửi yêu cầu
      const response = await axios.post(apiUrl, null, {
        params: requestParams,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      })

      console.log('Phản hồi truy vấn logistics YTO:', response.data)

      // Kiểm tra phản hồi
      if (response.data) {
        if (response.data.success === true || response.data.success === 'true') {
          // Chuyển đổi sang định dạng thống nhất
          const traces = response.data.traces || []
          const formattedTraces = traces.map((trace: any) => ({
            time: trace.scan_date || trace.time,
            location: trace.scan_city || trace.location,
            station: trace.scan_site || trace.station,
            status: trace.remark || trace.status,
            description: trace.remark || trace.description
          }))

          return {
            success: true,
            message: 'Truy vấn thành công',
            data: {
              waybillNo: waybillNo,
              traces: formattedTraces,
              raw: response.data
            }
          }
        }

        return {
          success: false,
          message: response.data.reason || response.data.message || 'Truy vấn thất bại',
          data: response.data
        }
      }

      return {
        success: false,
        message: 'Dữ liệu phản hồi trống'
      }
    } catch (error: any) {
      console.error('Truy vấn logistics YTO thất bại:', error)

      let errorMessage = 'Truy vấn thất bại'

      if (error.response) {
        errorMessage = `Lỗi máy chủ: ${error.response.status}`
        if (error.response.data) {
          errorMessage += ` - ${error.response.data.reason || error.response.data.message || ''}`
        }
      } else if (error.request) {
        errorMessage = 'Lỗi mạng: Không thể kết nối đến máy chủ YTO'
      } else {
        errorMessage = error.message || 'Lỗi không xác định'
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }
}

// Xuất singleton
export const ytoExpressService = new YTOExpressService()
