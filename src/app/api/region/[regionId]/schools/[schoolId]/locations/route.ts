import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Location } from "@/models/Location";
import { Device } from "@/models/Device";
import { School } from "@/models/School";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request,{ params }: { params: { regionId: string; schoolId: string } }) {
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

    const { schoolId, regionId } = await params;

    // ✅ Validate that school belongs to the specified region
    const school = await School.findOne({ _id: schoolId, region: regionId });
    if (!school) {
      return NextResponse.json(
        { message: "School not found in this region" }, 
        { status: 404 }
      );
    }

    // ✅ Get all locations for this school
    const locations = await Location.find({ school: schoolId });

    // ✅ Get devices for grouping
    const devices = await Device.find({ school: schoolId })
      .populate("location", "name"); // Only populate location

    // ✅ Group devices by type → location
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
    console.error("Error fetching locations/devices:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}




export async function POST(req: Request, { params }: { params: { schoolId: string } }) {
  await dbConnect();
  const data = await req.json();

  const { schoolId } = await params

  const location = new Location({
    ...data,
    school: schoolId,
  });

  await location.save();
  return NextResponse.json({ message: "Location created", location }, { status: 201 });
}
