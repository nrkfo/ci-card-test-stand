import { Request, Response } from 'express';
import { adbService } from '../services/adbService.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getAdbStatus(req: Request, res: Response) {
  try {
    const devicesData = await adbService.getConnectedDevices();

    let serverVersion = 'Unknown';
    try {
      const { stdout } = await execAsync('adb version', { timeout: 3000 });
      const versionMatch = stdout.match(/version\s+([0-9\.]+)/i);
      if (versionMatch) serverVersion = versionMatch[1];
    } catch {
      serverVersion = 'Not installed or not in PATH';
    }

    const firstDev = devicesData.devices[0];
    return res.json({
      connected: devicesData.devices.length > 0,
      connection_type: firstDev ? firstDev.connectionType : 'NONE',
      devices: devicesData.devices,
      active_device: firstDev || null,
      adbVersion: serverVersion,
      active_model: firstDev?.model || null,
      active_serial: firstDev?.serial_number || null,
      active_ip: firstDev?.ip || (firstDev?.id.includes(':') ? firstDev.id.split(':')[0] : null)
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function autoDetectDevice(req: Request, res: Response) {
  try {
    const result = await adbService.autoDetectDevice();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function scanWifiDevices(req: Request, res: Response) {
  try {
    const result = await adbService.scanWifiNetworkForDevices();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function reconnectAdb(req: Request, res: Response) {
  try {
    try {
      await execAsync('adb kill-server && adb start-server', { timeout: 5000 });
    } catch {
      // ignore restart hiccups
    }
    const devicesData = await adbService.getConnectedDevices();
    return res.json({
      success: true,
      devices: devicesData.devices
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function connectDeviceByIp(req: Request, res: Response) {
  try {
    const { ip } = req.body;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Параметр ip (IP адрес телевизора) обязателен' });
    }
    const result = await adbService.connectByIp(ip);
    const devicesData = await adbService.getConnectedDevices();
    return res.json({
      ...result,
      devices: devicesData.devices
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function disconnectDeviceByIp(req: Request, res: Response) {
  try {
    const { ip } = req.body;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Параметр ip обязателен' });
    }
    const result = await adbService.disconnectByIp(ip);
    const devicesData = await adbService.getConnectedDevices();
    return res.json({
      ...result,
      devices: devicesData.devices
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
