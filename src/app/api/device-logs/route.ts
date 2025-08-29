import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { DeviceLog } from '@/models/DeviceLog';
import { verifyToken } from '@/lib/auth';

// GET /api/device-logs - Get all device activity logs
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const action = url.searchParams.get('action');
    const deviceId = url.searchParams.get('deviceId');
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const skip = (page - 1) * limit;

    // Build query filter
    const filter: any = {};
    
    if (action && action !== 'all') {
      filter.action = action;
    }
    
    if (deviceId) {
      filter.device = deviceId;
    }
    
    if (userId) {
      filter.performedBy = userId;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Fetch device logs with pagination
    const [logs, totalCount] = await Promise.all([
      DeviceLog.find(filter)
        .populate('device', 'name deviceType')
        .populate('performedBy', 'username email role')
        .populate('oldValues.location', 'name')
        .populate('newValues.location', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeviceLog.countDocuments(filter)
    ]);

    // Transform the data with null checks
    const transformedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      device: log.device ? {
        id: log.device._id.toString(),
        name: log.device.name,
        deviceType: log.device.deviceType
      } : {
        id: 'deleted',
        name: 'Deleted Device',
        deviceType: 'unknown'
      },
      action: log.action,
      description: log.description,
      deactivationReason: log.deactivationReason,
      oldValues: log.oldValues,
      newValues: log.newValues,
      performedBy: log.performedBy ? {
        id: log.performedBy._id.toString(),
        username: log.performedBy.username,
        email: log.performedBy.email,
        role: log.performedBy.role
      } : {
        id: 'unknown',
        username: 'Unknown User',
        email: 'unknown@example.com',
        role: 'unknown'
      },
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));

    return NextResponse.json({
      message: 'Device logs fetched successfully',
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching device logs:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}