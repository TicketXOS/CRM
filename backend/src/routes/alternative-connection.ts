import { Router } from 'express'
import { AlternativeConnectionController } from '../controllers/alternative-connection'
import { authenticateTokenSimple } from '../middleware/simpleAuth'

const router = Router()
const controller = new AlternativeConnectionController()

// Route liên quan đến kết nối Bluetooth
router.post('/bluetooth/start', authenticateTokenSimple, controller.startBluetoothService.bind(controller))
router.post('/bluetooth/stop', authenticateTokenSimple, controller.stopBluetoothService.bind(controller))
router.get('/bluetooth/status', authenticateTokenSimple, controller.getBluetoothStatus.bind(controller))
router.post('/bluetooth/pair', authenticateTokenSimple, controller.pairBluetoothDevice.bind(controller))

// Route liên quan đến kết nối cùng mạng
router.post('/network/start', authenticateTokenSimple, controller.startNetworkDiscovery.bind(controller))
router.post('/network/stop', authenticateTokenSimple, controller.stopNetworkDiscovery.bind(controller))
router.get('/network/status', authenticateTokenSimple, controller.getNetworkStatus.bind(controller))
router.post('/network/connect', authenticateTokenSimple, controller.connectNetworkDevice.bind(controller))

// Route liên quan đến ghép đôi số
router.post('/digital/start', authenticateTokenSimple, controller.startDigitalPairing.bind(controller))
router.post('/digital/stop', authenticateTokenSimple, controller.stopDigitalPairing.bind(controller))
router.get('/digital/status', authenticateTokenSimple, controller.getDigitalPairingStatus.bind(controller))
router.post('/digital/pair', authenticateTokenSimple, controller.pairWithCode.bind(controller))
router.post('/digital/generate-code', authenticateTokenSimple, controller.generatePairingCode.bind(controller))

// Route quản lý kết nối chung
router.get('/devices', authenticateTokenSimple, controller.getAllConnectedDevices.bind(controller))
router.delete('/devices/:deviceId', authenticateTokenSimple, controller.disconnectDevice.bind(controller))
router.get('/statistics', authenticateTokenSimple, controller.getConnectionStatistics.bind(controller))

export default router
