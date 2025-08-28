import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { DeviceLog } from '@/models/DeviceLog';
import { verifyToken } from '@/lib/auth';

// GET /api/devices/[deviceId]/logs - Get device activity logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
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

    const { deviceId } = await params;

    // Get query parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const action = url.searchParams.get('action');
    const skip = (page - 1) * limit;

    // Build query filter
    const filter: any = { device: deviceId };
    if (action && action !== 'all') {
      filter.action = action;
    }

    // Fetch device logs with pagination
    const [logs, totalCount] = await Promise.all([
      DeviceLog.find(filter)
        .populate('device', 'name deviceType')
        .populate('performedBy', 'username email')
        .populate('oldValues.location', 'name')
        .populate('newValues.location', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeviceLog.countDocuments(filter)
    ]);

    // Transform the data
    const transformedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      device: {
        id: log.device._id.toString(),
        name: log.device.name,
        deviceType: log.device.deviceType
      },
      action: log.action,
      description: log.description,
      oldValues: log.oldValues,
      newValues: log.newValues,
      performedBy: {
        id: log.performedBy._id.toString(),
        username: log.performedBy.username,
        email: log.performedBy.email
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
