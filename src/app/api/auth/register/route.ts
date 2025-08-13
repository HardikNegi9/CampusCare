import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/models/User";

// POST /api/auth/register
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { name, email, password, role, affiliatedSchool } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      affiliatedSchool: role === "faculty" ? affiliatedSchool : undefined,
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
