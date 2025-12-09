import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../config/logger';
import { catchAsync } from '../middleware/errorHandler';

const router = Router();

/**
 * API tải xuống SDK
 * GET /api/v1/sdk/download/:platform
 */
router.get('/download/:platform', catchAsync(async (req: Request, res: Response): Promise<Response | void> => {
  const { platform } = req.params;

  // Xác thực tham số nền tảng
  if (!platform || !['android', 'ios'].includes(platform.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Tham số nền tảng không hợp lệ, các nền tảng được hỗ trợ: android, ios',
      code: 'INVALID_PLATFORM'
    });
  }

  // Xác định đường dẫn và tên file
  const fileName = platform.toLowerCase() === 'android'
    ? 'CRM-Mobile-SDK-1.0.0-release.apk'
    : 'crm-mobile-sdk-ios.ipa';

  // Lấy file từ thư mục public/downloads của dự án frontend
  const filePath = path.join(process.cwd(), '..', 'public', 'downloads', fileName);

  logger.info(`Yêu cầu tải xuống SDK: ${platform}, đường dẫn file: ${filePath}`);

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(filePath)) {
    logger.error(`File SDK không tồn tại: ${filePath}`);
    return res.status(404).json({
      success: false,
      message: `File SDK ${platform.toUpperCase()} không tồn tại`,
      code: 'SDK_FILE_NOT_FOUND'
    });
  }

  try {
    // Lấy thông tin file
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Thiết lập header phản hồi
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileSize.toString());
    res.setHeader('Cache-Control', 'no-cache');

    // Ghi log tải xuống
    logger.info(`Bắt đầu tải xuống SDK: ${platform}, kích thước file: ${fileSize} bytes, IP: ${req.ip}`);

    // Tạo luồng file và gửi
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error) => {
      logger.error(`Lỗi đọc luồng file SDK: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Đọc file thất bại',
          code: 'FILE_READ_ERROR'
        });
      }
    });

    fileStream.on('end', () => {
      logger.info(`Tải xuống SDK hoàn tất: ${platform}, IP: ${req.ip}`);
    });

    // Truyền file qua pipeline
    return fileStream.pipe(res);

  } catch (error: any) {
    logger.error(`Lỗi xử lý tải xuống SDK: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}));

/**
 * API lấy thông tin SDK
 * GET /api/v1/sdk/info/:platform
 */
router.get('/info/:platform', catchAsync(async (req: Request, res: Response): Promise<Response | void> => {
  const { platform } = req.params;

  // Xác thực tham số nền tảng
  if (!platform || !['android', 'ios'].includes(platform.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Tham số nền tảng không hợp lệ, các nền tảng được hỗ trợ: android, ios',
      code: 'INVALID_PLATFORM'
    });
  }

  const fileName = platform.toLowerCase() === 'android'
    ? 'CRM-Mobile-SDK-1.0.0-release.apk'
    : 'crm-mobile-sdk-ios.ipa';

  const filePath = path.join(process.cwd(), '..', 'public', 'downloads', fileName);

  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);

      // Định dạng kích thước file
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      res.json({
        success: true,
        data: {
          platform: platform.toLowerCase(),
          fileName,
          fileSize: stats.size,
          fileSizeFormatted: formatFileSize(stats.size),
          lastModified: stats.mtime,
          version: '1.0.0',
          buildType: platform.toLowerCase() === 'android' ? 'release' : 'production',
          packageType: platform.toLowerCase() === 'android' ? 'APK' : 'IPA',
          supportedSystems: platform.toLowerCase() === 'android' ? 'Android 5.0+' : 'iOS 12.0+',
          available: true,
          downloadUrl: `/api/v1/sdk/download/${platform.toLowerCase()}`
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          platform: platform.toLowerCase(),
          fileName,
          available: false,
          message: 'File SDK tạm thời không khả dụng'
        }
      });
    }
  } catch (error: any) {
    logger.error(`Lỗi lấy thông tin SDK: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Lấy thông tin SDK thất bại',
      code: 'GET_SDK_INFO_ERROR'
    });
  }
}));

/**
 * Lấy danh sách tất cả SDK khả dụng
 * GET /api/v1/sdk/list
 */
router.get('/list', catchAsync(async (req: Request, res: Response): Promise<Response | void> => {
  const platforms = ['android', 'ios'];
  const sdkList = [];

  // Hàm hỗ trợ định dạng kích thước file
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  for (const platform of platforms) {
    const fileName = platform === 'android'
      ? 'CRM-Mobile-SDK-1.0.0-release.apk'
      : 'crm-mobile-sdk-ios.ipa';

    const filePath = path.join(process.cwd(), '..', 'public', 'downloads', fileName);

    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        sdkList.push({
          platform,
          fileName,
          fileSize: stats.size,
          fileSizeFormatted: formatFileSize(stats.size),
          lastModified: stats.mtime,
          version: '1.0.0',
          buildType: platform === 'android' ? 'release' : 'production',
          packageType: platform === 'android' ? 'APK' : 'IPA',
          supportedSystems: platform === 'android' ? 'Android 5.0+' : 'iOS 12.0+',
          available: true,
          downloadUrl: `/api/v1/sdk/download/${platform}`
        });
      } else {
        sdkList.push({
          platform,
          fileName,
          available: false,
          message: 'File SDK tạm thời không khả dụng'
        });
      }
    } catch (error) {
      sdkList.push({
        platform,
        fileName,
        available: false,
        error: 'Lấy thông tin SDK thất bại'
      });
    }
  }

  res.json({
    success: true,
    data: sdkList
  });
}));

export default router;
