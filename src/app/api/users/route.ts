import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users - Get all users (admin only)
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

    // Check if user is admin
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Fetch all users with populated school data
    const users = await User.find({})
      .populate('affiliatedSchool', 'name')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Transform the data
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.name,
      email: user.email,
      role: user.role,
      affiliatedSchool: user.affiliatedSchool?._id?.toString(),
      schoolName: user.affiliatedSchool?.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return NextResponse.json({
      message: 'Users fetched successfully',
      users: transformedUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (admin only)
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

    // Check if user is admin
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { username, email, password, role, affiliatedSchool } = await request.json();

    // Validate required fields
    if (!username || !email || !password || !role) {
      return NextResponse.json({ message: 'Username, email, password, and role are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { name: username }]
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user data
    const userData: any = {
      name: username,
      email,
      passwordHash: hashedPassword,
      role
    };

    // Add affiliated school if provided and role is faculty
    if (affiliatedSchool && role === 'faculty') {
      userData.affiliatedSchool = affiliatedSchool;
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    // Populate the school data
    await newUser.populate('affiliatedSchool', 'name');

    // Return user data without password
    const responseUser = {
      id: newUser._id.toString(),
      username: newUser.name,
      email: newUser.email,
      role: newUser.role,
      affiliatedSchool: newUser.affiliatedSchool?._id?.toString(),
      schoolName: newUser.affiliatedSchool?.name,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    return NextResponse.json({
      message: 'User created successfully',
      user: responseUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
