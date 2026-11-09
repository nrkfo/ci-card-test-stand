import { Router } from 'express';
import { 
  getAdbStatus, 
  reconnectAdb,
  connectDeviceByIp,
  disconnectDeviceByIp,
  autoDetectDevice,
  scanWifiDevices
} from '../controllers/adbController.js';

export const adbRoutes = Router();

adbRoutes.get('/status', getAdbStatus);
adbRoutes.get('/auto-detect', autoDetectDevice);
adbRoutes.post('/auto-detect', autoDetectDevice);
adbRoutes.get('/scan-wifi', scanWifiDevices);
adbRoutes.post('/scan-wifi', scanWifiDevices);
adbRoutes.post('/reconnect', reconnectAdb);
adbRoutes.post('/connect', connectDeviceByIp);
adbRoutes.post('/disconnect', disconnectDeviceByIp);
