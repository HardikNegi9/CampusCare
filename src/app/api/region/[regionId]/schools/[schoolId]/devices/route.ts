import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Device } from "@/models/Device";
import { Location } from "@/models/Location";
import { verifyToken } from "@/lib/auth";

export async function GET( req: NextRequest, { params }: { params: { regionId: string; schoolId: string } }) {
  try {
    await dbConnect();
    
    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    
    const { schoolId, regionId } = await params;

    // Get all locations for this school
    const locations = await Location.find({ school: schoolId });

    // Fetch devices with location details
    const devices = await Device.find({ school: schoolId })
      .populate("location", "name")
      .lean();

    // Group devices by type → location
    const grouped: Record<string, Record<string, any[]>> = {};

    devices.forEach(device => {
      const typeName = device.deviceType || "Unknown";
      const locationName = device.location?.name || "Unknown Location";

      if (!grouped[typeName]) grouped[typeName] = {};
      if (!grouped[typeName][locationName]) grouped[typeName][locationName] = [];

      grouped[typeName][locationName].push(device);
    });

    return NextResponse.json(
      { locations, groupedByDeviceType: grouped },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

export async function POST( req: NextRequest, { params }: { params: { regionId: string; schoolId: string } }) {
  try {
    await dbConnect();
    
    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    
    const { schoolId } = await params;
    const body = await req.json();

    const device = await Device.create({
      name: body.name,
      deviceType: body.deviceType,
      location: body.location,
      status: body.status || "active",
      school: schoolId,
    });

    return NextResponse.json({ message: "Device created", device }, { status: 201 });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }

}
