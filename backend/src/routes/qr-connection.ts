import { Router } from 'express';
import { qrConnectionController } from '../controllers/qr-connection';

const router = Router();

// Tạo mã QR kết nối
router.post('/generate', qrConnectionController.generateQRCode.bind(qrConnectionController));

// Xác minh quét mã và thiết lập kết nối
router.post('/connect', qrConnectionController.connectDevice.bind(qrConnectionController));

// Lấy trạng thái kết nối
router.get('/status/:connectionId', qrConnectionController.getConnectionStatus.bind(qrConnectionController));

// Ngắt kết nối
router.delete('/disconnect/:connectionId', qrConnectionController.disconnectDevice.bind(qrConnectionController));

// Lấy danh sách thiết bị đã kết nối
router.get('/devices', qrConnectionController.getConnectedDevices.bind(qrConnectionController));

export default router;
