import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Device } from '@/models/Device';
import { Location } from '@/models/Location';
import { School } from '@/models/School';
import { verifyToken } from '@/lib/auth';
import { logDeviceActivity, generateActionDescription } from '@/lib/deviceLogger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    await dbConnect();
    console.log('PATCH /api/devices/[deviceId] - Starting');

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Invalid token');
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    console.log('User role:', decoded.role);

    // Check if user has permission to update devices
    if (decoded.role !== 'admin' && decoded.role !== 'engineer') {
      console.log('Insufficient permissions');
      return NextResponse.json({ message: 'Forbidden - Only admins and engineers can update devices' }, { status: 403 });
    }

    const { deviceId } = await params;
    const body = await request.json();
    const { status, deactivationReason } = body;

    console.log('Device ID:', deviceId);
    console.log('New status:', status);
    console.log('Deactivation reason:', deactivationReason);

    // Validate status
    if (status && !['active', 'inactive'].includes(status)) {
      console.log('Invalid status value');
      return NextResponse.json({ message: 'Invalid status. Must be active or inactive.' }, { status: 400 });
    }

    // Validate deactivation reason when deactivating
    if (status === 'inactive' && !deactivationReason) {
      console.log('Deactivation reason required');
      return NextResponse.json({ message: 'Deactivation reason is required when deactivating a device.' }, { status: 400 });
    }

    // Get the current device data before updating
    const currentDevice = await Device.findById(deviceId).lean();
    if (!currentDevice) {
      console.log('Device not found');
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    // Update device
    const updatedDevice = await Device.findByIdAndUpdate(
      deviceId,
      { status },
      { new: true }
    ).lean();

    if (!updatedDevice) {
      console.log('Device not found after update');
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    // Log the device activity
    if ((currentDevice as any).status !== status) {
      const action = status === 'active' ? 'activated' : 'deactivated';
      await logDeviceActivity({
        deviceId: deviceId,
        action: action,
        description: generateActionDescription(action, (currentDevice as any).name),
        performedBy: decoded.id,
        deactivationReason: status === 'inactive' ? deactivationReason : undefined,
        oldValues: {
          status: (currentDevice as any).status
        },
        newValues: {
          status: status
        },
        request
      });
    }

    console.log('Device updated successfully');

    // Transform the data
    const transformedDevice = {
      id: (updatedDevice as any)._id.toString(),
      name: (updatedDevice as any).name,
      deviceType: (updatedDevice as any).deviceType,
      location: (updatedDevice as any).location.toString(),
      status: (updatedDevice as any).status,
      mounted: (updatedDevice as any).mounted || false,
      school: (updatedDevice as any).school.toString()
    };

    return NextResponse.json({ 
      message: 'Device updated successfully',
      device: transformedDevice 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get device
    const device = await Device.findById(deviceId)
      .populate('location', 'name floor building')
      .populate('school', 'name address')
      .lean();

    if (!device) {
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    // Transform the data
    const transformedDevice = {
      id: (device as any)._id.toString(),
      name: (device as any).name,
      deviceType: (device as any).deviceType,
      location: (device as any).location._id.toString(),
      status: (device as any).status,
      school: (device as any).school._id.toString(),
      locationData: (device as any).location ? {
        id: (device as any).location._id.toString(),
        name: (device as any).location.name,
        floor: (device as any).location.floor,
        building: (device as any).location.building
      } : undefined,
      schoolData: (device as any).school ? {
        id: (device as any).school._id.toString(),
        name: (device as any).school.name,
        address: (device as any).school.address
      } : undefined
    };

    return NextResponse.json({ device: transformedDevice }, { status: 200 });

  } catch (error) {
    console.error('Error fetching device:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/devices/[deviceId] - Update a device
export async function PUT(
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

    // Check if user has permission to update devices
    if (decoded.role !== 'admin' && decoded.role !== 'engineer') {
      return NextResponse.json({ message: 'Forbidden - Only admins and engineers can update devices' }, { status: 403 });
    }

    const { deviceId } = await params;
    const body = await request.json();
    const { name, deviceType, location, school, status } = body;

    // Validate required fields
    if (!name || !deviceType || !location || !school) {
      return NextResponse.json({ message: 'Name, device type, location, and school are required' }, { status: 400 });
    }

    // Get the current device data before updating
    const currentDevice = await Device.findById(deviceId).lean();
    if (!currentDevice) {
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    // Check if location and school exist
    const [locationExists, schoolExists] = await Promise.all([
      Location.findById(location),
      School.findById(school)
    ]);

    if (!locationExists) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    if (!schoolExists) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    // Update device
    const updatedDevice = await Device.findByIdAndUpdate(
      deviceId,
      { name, deviceType, location, school, status },
      { new: true }
    ).populate('location', 'name').populate('school', 'name').lean();

    if (!updatedDevice) {
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    // Log device activities based on what changed
    const oldValues = {
      name: (currentDevice as any).name,
      deviceType: (currentDevice as any).deviceType,
      location: (currentDevice as any).location.toString(),
      status: (currentDevice as any).status
    };

    const newValues = {
      name,
      deviceType,
      location,
      status
    };

    // Log status changes
    if (oldValues.status !== newValues.status) {
      const action = status === 'active' ? 'activated' : 'deactivated';
      await logDeviceActivity({
        deviceId: deviceId,
        action: action,
        description: generateActionDescription(action, name),
        performedBy: decoded.id,
        oldValues,
        newValues,
        request
      });
    }

    // Log general update if other fields changed
    if (oldValues.name !== newValues.name || oldValues.deviceType !== newValues.deviceType) {
      await logDeviceActivity({
        deviceId: deviceId,
        action: 'updated',
        description: generateActionDescription('updated', name),
        performedBy: decoded.id,
        oldValues,
        newValues,
        request
      });
    }

    // Transform the data
    const transformedDevice = {
      id: (updatedDevice as any)._id.toString(),
      name: (updatedDevice as any).name,
      deviceType: (updatedDevice as any).deviceType,
      location: (updatedDevice as any).location._id.toString(),
      locationName: (updatedDevice as any).location.name,
      status: (updatedDevice as any).status,
      school: (updatedDevice as any).school._id.toString(),
      schoolName: (updatedDevice as any).school.name
    };

    return NextResponse.json({
      message: 'Device updated successfully',
      device: transformedDevice
    });

  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/[deviceId] - Delete a device
export async function DELETE(
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

    // Check if user has permission to delete devices
    if (decoded.role !== 'admin' && decoded.role !== 'engineer') {
      return NextResponse.json({ message: 'Forbidden - Only admins and engineers can delete devices' }, { status: 403 });
    }

    const { deviceId } = await params;

    // Get device data before deletion for logging
    const deviceToDelete = await Device.findById(deviceId).lean();
    if (!deviceToDelete) {
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    // Delete device
    const deletedDevice = await Device.findByIdAndDelete(deviceId);

    if (!deletedDevice) {
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    // Log the device deletion
    await logDeviceActivity({
      deviceId: deviceId,
      action: 'deleted',
      description: generateActionDescription('deleted', (deviceToDelete as any).name),
      performedBy: decoded.id,
      oldValues: {
        name: (deviceToDelete as any).name,
        deviceType: (deviceToDelete as any).deviceType,
        location: (deviceToDelete as any).location.toString(),
        status: (deviceToDelete as any).status
      },
      request
    });

    return NextResponse.json({
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
