import express from 'express'
import { ytoExpressService } from '../services/ytoExpressService'

const router = express.Router()

/**
 * Kiểm tra kết nối
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { userId, appKey, apiUrl } = req.body

    // Xác thực tham số
    if (!userId || !appKey || !apiUrl) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số bắt buộc: userId, appKey, apiUrl'
      })
    }

    // Gọi dịch vụ kiểm tra kết nối
    const result = await ytoExpressService.testConnection(userId, appKey, apiUrl)

    res.json(result)
  } catch (error: unknown) {
    console.error('Lỗi kiểm tra kết nối API YTO:', error)
    const errorMessage = error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ'
    res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
})

/**
 * Truy vấn lịch sử vận chuyển
 */
router.post('/query-tracking', async (req, res) => {
  try {
    const { userId, appKey, apiUrl, waybillNo } = req.body

    // Xác thực tham số
    if (!userId || !appKey || !apiUrl || !waybillNo) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số bắt buộc: userId, appKey, apiUrl, waybillNo'
      })
    }

    // Gọi dịch vụ truy vấn logistics
    const result = await ytoExpressService.queryTracking(userId, appKey, apiUrl, waybillNo)

    res.json(result)
  } catch (error: unknown) {
    console.error('Lỗi truy vấn logistics YTO:', error)
    const errorMessage = error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ'
    res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
})

export default router
