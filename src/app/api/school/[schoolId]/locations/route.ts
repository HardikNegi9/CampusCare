import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Location } from '@/models/Location';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
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

    const { schoolId } = await params;

    // Fetch locations for this school
    const locations = await Location.find({ school: schoolId }).lean();

    // Transform the data to match frontend types
    const transformedLocations = locations.map((location: any) => ({
      id: location._id.toString(),
      name: location.name,
      floor: location.floor,
      building: location.building,
      school: location.school.toString()
    }));

    return NextResponse.json({ locations: transformedLocations }, { status: 200 });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
