import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Location } from '@/models/Location';
import { School } from '@/models/School';
import { verifyToken } from '@/lib/auth';

// GET /api/locations - Get all locations
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

    // Fetch locations with school information
    const locations = await Location.find({})
      .populate('school', 'name')
      .lean();

    // Transform the data
    const transformedLocations = locations.map((location: any) => ({
      id: location._id.toString(),
      name: location.name,
      description: location.description,
      school: location.school._id.toString(),
      schoolName: location.school.name
    }));

    return NextResponse.json({
      message: 'Locations fetched successfully',
      locations: transformedLocations
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create a new location
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

    // Check if user has permission to create locations
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Only admins can create locations' }, { status: 403 });
    }

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

    // Create location
    const location = new Location({
      name,
      description,
      school
    });

    await location.save();

    // Fetch the created location with school info
    const createdLocation = await Location.findById(location._id)
      .populate('school', 'name')
      .lean();

    // Transform the data
    const transformedLocation = {
      id: (createdLocation as any)._id.toString(),
      name: (createdLocation as any).name,
      description: (createdLocation as any).description,
      school: (createdLocation as any).school._id.toString(),
      schoolName: (createdLocation as any).school.name
    };

    return NextResponse.json({
      message: 'Location created successfully',
      location: transformedLocation
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
