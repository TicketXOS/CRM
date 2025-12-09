import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/logs/system:
 *   get:
 *     summary: Lấy nhật ký hệ thống
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Giới hạn số lượng nhật ký trả về
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Lọc theo mức độ nhật ký
 *     responses:
 *       200:
 *         description: Danh sách nhật ký hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                       level:
 *                         type: string
 *                       module:
 *                         type: string
 *                       message:
 *                         type: string
 *                       details:
 *                         type: string
 */
router.get('/system', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const levelFilter = req.query.level as string;

    logger.info('Lấy nhật ký hệ thống', {
      limit,
      levelFilter,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const logsDir = path.join(process.cwd(), 'logs');
    const logFiles = [
      path.join(logsDir, 'combined.log'),
      path.join(logsDir, 'error.log'),
      path.join(logsDir, 'operations.log')
    ];

    let allLogs: any[] = [];

    // Đọc tất cả các tệp nhật ký
    for (const logFile of logFiles) {
      if (fs.existsSync(logFile)) {
        try {
          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              // Thử phân tích nhật ký định dạng JSON
              if (line.includes('{') && line.includes('}')) {
                const jsonStart = line.indexOf('{');
                const jsonPart = line.substring(jsonStart);
                const logData = JSON.parse(jsonPart);

                if (logData.timestamp && logData.level && logData.message) {
                  allLogs.push({
                    id: `${logData.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: logData.timestamp,
                    level: logData.level.toUpperCase(),
                    module: logData.service || 'Hệ thống',
                    message: logData.message,
                    details: JSON.stringify(logData, null, 2)
                  });
                }
              } else {
                // Phân tích nhật ký định dạng văn bản
                const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
                const levelMatch = line.match(/\[(ERROR|WARN|INFO|DEBUG)\]/);

                if (timestampMatch && levelMatch) {
                  const timestamp = timestampMatch[1];
                  const level = levelMatch[1];
                  const messageStart = line.indexOf(']:') + 2;
                  const message = line.substring(messageStart).trim();

                  allLogs.push({
                    id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp,
                    level,
                    module: 'Hệ thống',
                    message,
                    details: line
                  });
                }
              }
            } catch (parseError) {
              // Bỏ qua các dòng lỗi phân tích
            }
          }
        } catch (fileError) {
          logger.warn(`Đọc tệp nhật ký thất bại: ${logFile}`, { error: fileError instanceof Error ? fileError.message : String(fileError) });
        }
      }
    }

    // Sắp xếp theo dấu thời gian (mới nhất trước)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Áp dụng lọc theo mức độ
    if (levelFilter) {
      allLogs = allLogs.filter(log => log.level.toLowerCase() === levelFilter.toLowerCase());
    }

    // Giới hạn số lượng trả về
    allLogs = allLogs.slice(0, limit);

    res.json({
      success: true,
      data: allLogs,
      total: allLogs.length
    });

  } catch (error) {
    logger.error('Lấy nhật ký hệ thống thất bại', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Lấy nhật ký hệ thống thất bại',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/v1/logs/clear:
 *   delete:
 *     summary: Xóa nhật ký hệ thống
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/clear', async (req, res) => {
  try {
    logger.info('Yêu cầu xóa nhật ký hệ thống', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const logsDir = path.join(process.cwd(), 'logs');
    const logFiles = [
      path.join(logsDir, 'combined.log'),
      path.join(logsDir, 'error.log'),
      path.join(logsDir, 'operations.log'),
      path.join(logsDir, 'access.log'),
      path.join(logsDir, 'performance.log')
    ];

    let clearedCount = 0;
    for (const logFile of logFiles) {
      if (fs.existsSync(logFile)) {
        try {
          fs.writeFileSync(logFile, '');
          clearedCount++;
        } catch (error) {
          logger.warn(`Xóa tệp nhật ký thất bại: ${logFile}`, { error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    logger.info('Nhật ký hệ thống đã được xóa', { clearedFiles: clearedCount });

    res.json({
      success: true,
      message: `Đã xóa ${clearedCount} tệp nhật ký`,
      clearedFiles: clearedCount
    });

  } catch (error) {
      logger.error('Xóa nhật ký hệ thống thất bại', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        message: 'Xóa nhật ký hệ thống thất bại',
        error: error instanceof Error ? error.message : String(error)
      });
    }
});

export default router;
