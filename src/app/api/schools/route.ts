import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { School } from '@/models/School';
import { Region } from '@/models/Region';
import { verifyToken } from '@/lib/auth';

// GET /api/schools - Get all schools
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

    // Fetch schools with region information
    const schools = await School.find({})
      .populate('region', 'name')
      .lean();

    // Transform the data
    const transformedSchools = schools.map((school: any) => ({
      id: school._id.toString(),
      name: school.name,
      description: school.description,
      address: school.address,
      region: school.region._id.toString(),
      regionName: school.region.name,
      locationCount: 0 // We'll calculate this later if needed
    }));

    return NextResponse.json({
      message: 'Schools fetched successfully',
      schools: transformedSchools
    });

  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/schools - Create a new school
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

    // Check if user has permission to create schools
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Only admins can create schools' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, address, region } = body;

    // Validate required fields
    if (!name || !region) {
      return NextResponse.json({ message: 'Name and region are required' }, { status: 400 });
    }

    // Check if region exists
    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return NextResponse.json({ message: 'Region not found' }, { status: 404 });
    }

    // Create school
    const school = new School({
      name,
      description,
      address,
      region
    });

    await school.save();

    // Fetch the created school with region info
    const createdSchool = await School.findById(school._id)
      .populate('region', 'name')
      .lean();

    // Transform the data
    const transformedSchool = {
      id: (createdSchool as any)._id.toString(),
      name: (createdSchool as any).name,
      description: (createdSchool as any).description,
      address: (createdSchool as any).address,
      region: (createdSchool as any).region._id.toString(),
      regionName: (createdSchool as any).region.name,
      locationCount: 0
    };

    return NextResponse.json({
      message: 'School created successfully',
      school: transformedSchool
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
