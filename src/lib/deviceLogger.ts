import { DeviceLog } from '@/models/DeviceLog';
import { NextRequest } from 'next/server';

interface LogDeviceActivityParams {
  deviceId: string;
  action: 'activated' | 'deactivated' | 'created' | 'updated' | 'deleted';
  description: string;
  performedBy: string; // User ID
  deactivationReason?: string; // Reason for deactivation (only for deactivated action)
  oldValues?: {
    status?: string;
    location?: string;
    deviceType?: string;
    name?: string;
  };
  newValues?: {
    status?: string;
    location?: string;
    deviceType?: string;
    name?: string;
  };
  request?: NextRequest; // To extract IP and user agent
}

export async function logDeviceActivity(params: LogDeviceActivityParams) {
  try {
    const {
      deviceId,
      action,
      description,
      performedBy,
      deactivationReason,
      oldValues,
      newValues,
      request
    } = params;

    // Extract IP address and user agent from request
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      // Get IP address
      ipAddress = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      // Get user agent
      userAgent = request.headers.get('user-agent') || 'unknown';
    }

    // Create the log entry
    const deviceLog = new DeviceLog({
      device: deviceId,
      action,
      description,
      deactivationReason,
      oldValues,
      newValues,
      performedBy,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    await deviceLog.save();
    
    console.log(`Device activity logged: ${action} for device ${deviceId} by user ${performedBy}`);
    
    return deviceLog;
  } catch (error) {
    console.error('Error logging device activity:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
}

// Helper function to generate action descriptions
export function generateActionDescription(
  action: string,
  deviceName: string,
  oldValues?: any,
  newValues?: any
): string {
  switch (action) {
    case 'activated':
      return `Device "${deviceName}" was activated`;
    case 'deactivated':
      return `Device "${deviceName}" was deactivated`;
    case 'created':
      return `Device "${deviceName}" was created`;
    case 'updated':
      return `Device "${deviceName}" was updated`;
    case 'deleted':
      return `Device "${deviceName}" was deleted`;
    default:
      return `Device "${deviceName}" had action: ${action}`;
  }
}
