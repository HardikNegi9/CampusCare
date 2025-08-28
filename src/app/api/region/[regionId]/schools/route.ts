// /api/region/[regionId]/schools        -> GET (list schools), POST (create school)
// /api/region/[regionId]/schools/[id]  -> GET (one school), PUT (update), DELETE (remove)
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { School } from "@/models/School";
import { Region } from "@/models/Region";
import { verifyToken } from "@/lib/auth";

// GET /api/region/[regionId]/schools
export async function GET(req: Request, { params }: { params: Promise<{ regionId: string }> }) {
  await dbConnect();

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const { regionId } = await params;
  
  // Add debug logging
  console.log("RegionId received:", regionId);
  
  const schools = await School.find({ region: regionId }).lean();
  console.log("Schools found:", schools.length);
  
  // Transform the data to match frontend types
  const transformedSchools = schools.map((school: any) => ({
    id: school._id.toString(),
    name: school.name,
    address: school.address,
    region: school.region.toString(),
    createdAt: school.createdAt,
    updatedAt: school.updatedAt
  }));
  
  return NextResponse.json({ schools: transformedSchools }, { status: 200 });
}

// POST /api/region/[regionId]/schools (Admin only)
export async function POST(req: Request, { params }: { params: { regionId: string } }) {
  await dbConnect();

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Await params before accessing regionId
  const { regionId } = await params;
  // Ensure region exists
  const region = await Region.findById(regionId);
  if (!region) {
    return NextResponse.json({ message: "Region not found" }, { status: 404 });
  }

  const { name, address } = await req.json();
  const school = await School.create({
    name,
    address,
    region: regionId,
  });

  return NextResponse.json({ message: "School created", school }, { status: 201 });
}
