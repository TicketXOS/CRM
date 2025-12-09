import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Tải xuống APK Android
router.get('/download/android', (req, res) => {
  const apkPath = path.join(__dirname, '../../../public/downloads/CRM-Mobile-SDK-v2.1.3.apk');

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({
      success: false,
      message: 'File APK không tồn tại, vui lòng xây dựng ứng dụng trước'
    });
  }

  // Thiết lập header tải xuống
  res.setHeader('Content-Disposition', 'attachment; filename="CRM-Mobile-SDK-v2.1.3.apk"');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');

  // Gửi file
  return res.sendFile(apkPath, (err) => {
    if (err) {
      console.error('Gửi file APK thất bại:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Tải xuống thất bại'
        });
      }
    }
  });
});

// Tải xuống IPA iOS
router.get('/download/ios', (req, res) => {
  const ipaPath = path.join(__dirname, '../../../mobile-sdk/ios/build/CRM-Mobile-SDK-1.0.0.ipa');

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(ipaPath)) {
    return res.status(404).json({
      success: false,
      message: 'File IPA không tồn tại, phiên bản iOS đang được phát triển'
    });
  }

  // Thiết lập header tải xuống
  res.setHeader('Content-Disposition', 'attachment; filename="CRM-Mobile-SDK-1.0.0.ipa"');
  res.setHeader('Content-Type', 'application/octet-stream');

  // Gửi file
  return res.sendFile(ipaPath, (err) => {
    if (err) {
      console.error('Gửi file IPA thất bại:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Tải xuống thất bại'
        });
      }
    }
  });
});

// Định dạng kích thước file
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Lấy thông tin SDK
router.get('/info', (req, res) => {
  const androidApkPath = path.join(__dirname, '../../../public/downloads/CRM-Mobile-SDK-v2.1.3.apk');
  const iosIpaPath = path.join(__dirname, '../../../mobile-sdk/ios/build/CRM-Mobile-SDK-1.0.0.ipa');

  const androidExists = fs.existsSync(androidApkPath);
  const iosExists = fs.existsSync(iosIpaPath);

  const androidStats = androidExists ? fs.statSync(androidApkPath) : null;
  const iosStats = iosExists ? fs.statSync(iosIpaPath) : null;

  const info = {
    android: {
      available: androidExists,
      size: androidStats ? androidStats.size : 0,
      fileSizeFormatted: androidStats ? formatFileSize(androidStats.size) : 'Không xác định',
      version: '2.1.3',
      lastModified: androidStats ? androidStats.mtime : null,
      supportedSystems: 'Android 5.0+',
      packageType: 'APK',
      fileName: 'CRM-Mobile-SDK-v2.1.3.apk'
    },
    ios: {
      available: iosExists,
      size: iosStats ? iosStats.size : 0,
      fileSizeFormatted: iosStats ? formatFileSize(iosStats.size) : 'Chờ phát hành',
      version: '1.0.0',
      lastModified: iosStats ? iosStats.mtime : null,
      supportedSystems: 'iOS 12.0+',
      packageType: 'IPA',
      fileName: 'CRM-Mobile-SDK-1.0.0.ipa'
    }
  };

  res.json({
    success: true,
    data: info
  });
});

export default router;
