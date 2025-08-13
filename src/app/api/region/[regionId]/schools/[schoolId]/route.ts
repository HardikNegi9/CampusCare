import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { School } from "@/models/School";
import { verifyToken } from "@/lib/auth";

// GET School Details
export async function GET(req: Request, { params }: { params: { regionId: string; schoolId: string } }) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Await params before accessing properties
    const { regionId, schoolId } = await params;
    const school = await School.findOne({ _id: schoolId, region: regionId });
    if (!school) {
      return NextResponse.json({ message: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ school }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// PUT Update School (Admin)
export async function PUT(req: Request, { params }: { params: { regionId: string; schoolId: string } }) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Await params before accessing properties
    const { regionId, schoolId } = await params;
    const { name, address } = await req.json();
    const updatedSchool = await School.findOneAndUpdate(
      { _id: schoolId, region: regionId },
      { name, address },
      { new: true }
    );

    if (!updatedSchool) {
      return NextResponse.json({ message: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "School updated", school: updatedSchool }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// DELETE School (Admin)
export async function DELETE(req: Request, { params }: { params: { regionId: string; schoolId: string } }) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Await params before accessing properties
    const { regionId, schoolId } = await params;
    const deletedSchool = await School.findOneAndDelete({ _id: schoolId, region: regionId });
    if (!deletedSchool) {
      return NextResponse.json({ message: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "School deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
