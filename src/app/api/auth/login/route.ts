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

    // 🔍 DEBUG: Log the entered credentials
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email entered:", email);
    console.log("Password entered:", password);
    console.log("===================");

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found for email:", email);
      return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }

    console.log("✅ User found:", user.name, "- Role:", user.role);

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log("❌ Password mismatch for user:", email);
      return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }

    console.log("✅ Password correct for user:", email);

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
