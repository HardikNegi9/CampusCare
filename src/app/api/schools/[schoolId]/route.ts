import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { School } from '@/models/School';
import { Region } from '@/models/Region';
import { verifyToken } from '@/lib/auth';

// PUT /api/schools/[schoolId] - Update a school
export async function PUT(
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

    // Check if user has permission to update schools
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Only admins can update schools' }, { status: 403 });
    }

    const { schoolId } = await params;
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

    // Update school
    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      { name, description, address, region },
      { new: true }
    ).populate('region', 'name').lean();

    if (!updatedSchool) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    // Transform the data
    const transformedSchool = {
      id: (updatedSchool as any)._id.toString(),
      name: (updatedSchool as any).name,
      description: (updatedSchool as any).description,
      address: (updatedSchool as any).address,
      region: (updatedSchool as any).region._id.toString(),
      regionName: (updatedSchool as any).region.name,
      locationCount: 0
    };

    return NextResponse.json({
      message: 'School updated successfully',
      school: transformedSchool
    });

  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/schools/[schoolId] - Delete a school
export async function DELETE(
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

    // Check if user has permission to delete schools
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Only admins can delete schools' }, { status: 403 });
    }

    const { schoolId } = await params;

    // Delete school
    const deletedSchool = await School.findByIdAndDelete(schoolId);

    if (!deletedSchool) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'School deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
