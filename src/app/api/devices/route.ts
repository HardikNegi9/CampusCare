import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Device } from '@/models/Device';
import { Location } from '@/models/Location';
import { School } from '@/models/School';
import { verifyToken } from '@/lib/auth';
import { logDeviceActivity, generateActionDescription } from '@/lib/deviceLogger';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const schoolId = searchParams.get('schoolId');

    let query = {};
    
    if (locationId) {
      query = { location: locationId };
    } else if (schoolId) {
      query = { school: schoolId };
    }

    // Fetch devices with populated location and school data
    const devices = await Device.find(query)
      .populate('location', 'name floor building')
      .populate('school', 'name address')
      .lean();

    // Transform the data to match frontend types
    const transformedDevices = devices.map((device: any) => ({
      id: device._id.toString(),
      name: device.name,
      deviceType: device.deviceType,
      location: device.location?._id?.toString() || '',
      locationName: device.location?.name || 'Unknown Location',
      status: device.status,
      school: device.school?._id?.toString() || '',
      schoolName: device.school?.name || 'Unknown School',
      serialNumber: device.serialNumber,
      purchaseDate: device.purchaseDate,
      warrantyExpiry: device.warrantyExpiry,
      locationData: device.location ? {
        id: device.location._id?.toString() || '',
        name: device.location.name || 'Unknown Location',
        floor: device.location.floor,
        building: device.location.building,
        school: device.location.school?.toString()
      } : undefined,
      schoolData: device.school ? {
        id: device.school._id?.toString() || '',
        name: device.school.name || 'Unknown School',
        address: device.school.address,
        region: device.school.region?.toString()
      } : undefined
    }));

    return NextResponse.json({ devices: transformedDevices }, { status: 200 });

  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/devices - Create a new device
export async function POST(request: NextRequest) {
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

    // Check if user has permission to create devices
    if (decoded.role !== 'admin' && decoded.role !== 'engineer') {
      return NextResponse.json({ message: 'Forbidden - Only admins and engineers can create devices' }, { status: 403 });
    }

    const body = await request.json();
    const { name, deviceType, location, school, status = 'active' } = body;

    // Validate required fields
    if (!name || !deviceType || !location || !school) {
      return NextResponse.json({ message: 'Name, device type, location, and school are required' }, { status: 400 });
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

    // Create device
    const device = new Device({
      name,
      deviceType,
      location,
      school,
      status
    });

    await device.save();

    // Log the device creation activity
    await logDeviceActivity({
      deviceId: device._id.toString(),
      action: 'created',
      description: generateActionDescription('created', name),
      performedBy: decoded.id,
      newValues: {
        name,
        deviceType,
        location,
        status
      },
      request
    });

    // Fetch the created device with populated data
    const createdDevice = await Device.findById(device._id)
      .populate('location', 'name')
      .populate('school', 'name')
      .lean();

    // Transform the data
    const transformedDevice = {
      id: (createdDevice as any)._id.toString(),
      name: (createdDevice as any).name,
      deviceType: (createdDevice as any).deviceType,
      location: (createdDevice as any).location?._id?.toString() || '',
      locationName: (createdDevice as any).location?.name || 'Unknown Location',
      status: (createdDevice as any).status,
      school: (createdDevice as any).school?._id?.toString() || '',
      schoolName: (createdDevice as any).school?.name || 'Unknown School'
    };

    return NextResponse.json({
      message: 'Device created successfully',
      device: transformedDevice
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
