import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Location } from '@/models/Location';
import { School } from '@/models/School';
import { verifyToken } from '@/lib/auth';

// GET /api/locations/[locationId] - Get a specific location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
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

    const { locationId } = await params;

    // Fetch location with school information
    const location = await Location.findById(locationId)
      .populate('school', 'name')
      .lean();

    if (!location) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    // Transform the data
    const transformedLocation = {
      id: (location as any)._id.toString(),
      name: (location as any).name,
      description: (location as any).description,
      school: (location as any).school?._id?.toString() || '',
      schoolName: (location as any).school?.name || 'Unknown School'
    };

    return NextResponse.json({
      message: 'Location fetched successfully',
      location: transformedLocation
    });

  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/locations/[locationId] - Update a location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
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

    // Check if user has permission to update locations
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Only admins can update locations' }, { status: 403 });
    }

    const { locationId } = await params;
    const body = await request.json();
    const { name, description, school } = body;

    // Validate required fields
    if (!name || !school) {
      return NextResponse.json({ message: 'Name and school are required' }, { status: 400 });
    }

    // Check if school exists
    const schoolExists = await School.findById(school);
    if (!schoolExists) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    // Update location
    const updatedLocation = await Location.findByIdAndUpdate(
      locationId,
      { name, description, school },
      { new: true }
    ).populate('school', 'name').lean();

    if (!updatedLocation) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    // Transform the data
    const transformedLocation = {
      id: (updatedLocation as any)._id.toString(),
      name: (updatedLocation as any).name,
      description: (updatedLocation as any).description,
      school: (updatedLocation as any).school?._id?.toString() || '',
      schoolName: (updatedLocation as any).school?.name || 'Unknown School'
    };

    return NextResponse.json({
      message: 'Location updated successfully',
      location: transformedLocation
    });

  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[locationId] - Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
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

    // Check if user has permission to delete locations
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Only admins can delete locations' }, { status: 403 });
    }

    const { locationId } = await params;

    // Check if location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    // Delete location
    await Location.findByIdAndDelete(locationId);

    return NextResponse.json({
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
