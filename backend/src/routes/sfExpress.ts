import express from 'express'
import sfExpressService from '../services/sfExpressService'

const router = express.Router()

/**
 * Kiểm tra kết nối
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { appId, checkWord, apiUrl } = req.body

    if (!appId || !checkWord || !apiUrl) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số bắt buộc'
      })
    }

    const result = await sfExpressService.testConnection({
      appId,
      checkWord,
      apiUrl
    })

    return res.json(result)
  } catch (error: any) {
    console.error('Kiểm tra kết nối thất bại:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Kiểm tra kết nối thất bại'
    })
  }
})

/**
 * Thiết lập cấu hình
 */
router.post('/config', async (req, res) => {
  try {
    const { appId, checkWord, apiUrl, enabled } = req.body

    if (!appId || !checkWord || !apiUrl) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số bắt buộc'
      })
    }

    sfExpressService.setConfig({
      appId,
      checkWord,
      apiUrl
    })

    return res.json({
      success: true,
      message: 'Lưu cấu hình thành công'
    })
  } catch (error: any) {
    console.error('Lưu cấu hình thất bại:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Lưu cấu hình thất bại'
    })
  }
})

/**
 * Lấy cấu hình
 */
router.get('/config', async (req, res) => {
  try {
    const config = sfExpressService.getConfig()

    if (!config) {
      return res.json({
        success: false,
        message: 'Chưa được cấu hình'
      })
    }

    // Không trả về thông tin nhạy cảm
    return res.json({
      success: true,
      data: {
        appId: config.appId,
        apiUrl: config.apiUrl,
        configured: true
      }
    })
  } catch (error: any) {
    console.error('Lấy cấu hình thất bại:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Lấy cấu hình thất bại'
    })
  }
})

/**
 * Truy vấn lịch sử vận chuyển
 */
router.post('/track', async (req, res) => {
  try {
    const { trackingNumber, orderNumber } = req.body

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Số đơn vận chuyển không được để trống'
      })
    }

    const result = await sfExpressService.queryRoute({
      trackingNumber,
      orderNumber
    })

    return res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Truy vấn lịch sử vận chuyển thất bại:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Truy vấn thất bại'
    })
  }
})

/**
 * Lọc đơn hàng
 */
router.post('/filter-orders', async (req, res) => {
  try {
    const result = await sfExpressService.filterOrders(req.body)

    return res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Lọc đơn hàng thất bại:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Truy vấn thất bại'
    })
  }
})

/**
 * Tạo đơn hàng
 */
router.post('/create-order', async (req, res) => {
  try {
    const result = await sfExpressService.createOrder(req.body)

    return res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Tạo đơn hàng thất bại:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Tạo đơn hàng thất bại'
    })
  }
})

/**
 * Bật chế độ Mock
 */
router.post('/enable-mock', async (req, res) => {
  try {
    sfExpressService.enableMockMode()
    return res.json({
      success: true,
      message: 'Chế độ Mock đã được bật'
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Bật chế độ Mock thất bại'
    })
  }
})

/**
 * Tắt chế độ Mock
 */
router.post('/disable-mock', async (req, res) => {
  try {
    sfExpressService.disableMockMode()
    return res.json({
      success: true,
      message: 'Chế độ Mock đã được tắt'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Tắt chế độ Mock thất bại'
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
})

/**
 * Lấy trạng thái chế độ Mock
 */
router.get('/mock-status', async (req, res) => {
  try {
    const isMock = sfExpressService.isMockMode()
    return res.json({
      success: true,
      data: { mockMode: isMock }
    })
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lấy trạng thái chế độ Mock thất bại'
    })
  }
})

export default router
