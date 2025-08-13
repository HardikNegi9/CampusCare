import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/models/User";
import { generateToken } from "@/lib/auth";

// POST /api/auth/login
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }

    // Create JWT token
    const token = generateToken({ id: user._id.toString(), role: user.role });

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
