import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/users/[id] - Update user (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is admin
    const currentUser = await User.findById(decoded.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { id } = params;
    const updateData = await request.json();

    // Find user to update
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prepare update object
    const updates: any = {};

    // Update basic fields
    if (updateData.username) updates.name = updateData.username;
    if (updateData.email) updates.email = updateData.email;
    if (updateData.role) updates.role = updateData.role;
    
    // Handle affiliated school
    if (updateData.hasOwnProperty('affiliatedSchool')) {
      updates.affiliatedSchool = updateData.affiliatedSchool || null;
    }

    // Handle password update
    if (updateData.password) {
      updates.passwordHash = await bcrypt.hash(updateData.password, 12);
    }

    // Check for duplicate username/email (excluding current user)
    if (updates.name || updates.email) {
      const duplicateQuery: any = { _id: { $ne: id } };
      const orConditions = [];
      
      if (updates.name) orConditions.push({ name: updates.name });
      if (updates.email) orConditions.push({ email: updates.email });
      
      duplicateQuery.$or = orConditions;
      
      const duplicateUser = await User.findOne(duplicateQuery);
      if (duplicateUser) {
        const field = duplicateUser.name === updates.name ? 'Username' : 'Email';
        return NextResponse.json({ message: `${field} already exists` }, { status: 400 });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('affiliatedSchool', 'name');

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Return updated user data without password
    const responseUser = {
      id: updatedUser._id.toString(),
      username: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      affiliatedSchool: updatedUser.affiliatedSchool?._id?.toString(),
      schoolName: updatedUser.affiliatedSchool?.name,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({
      message: 'User updated successfully',
      user: responseUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is admin
    const currentUser = await User.findById(decoded.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (currentUser._id.toString() === id) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      user: {
        id: deletedUser._id.toString(),
        username: deletedUser.username,
        email: deletedUser.email
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
