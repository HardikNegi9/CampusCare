// /api/region               -> GET (list all), POST (create)
// /api/region/[regionId]    -> GET (single region), PUT (update), DELETE (remove)
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Region } from "@/models/Region";
import { verifyToken } from "@/lib/auth";

// GET /api/region -> List all regions (any logged-in user)
export async function GET(req: Request) {
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

  const regions = await Region.find().lean();
  
  // Transform the data to match frontend types
  const transformedRegions = regions.map((region: any) => ({
    id: region._id.toString(),
    name: region.name,
    description: region.description,
    createdAt: region.createdAt,
    updatedAt: region.updatedAt
  }));
  
  return NextResponse.json({ regions: transformedRegions }, { status: 200 });
}

// POST /api/region -> Create region (Admin only)
export async function POST(req: Request) {
  await dbConnect();

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) { // Authorization: Bearer <your-jwt-token>
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  // Only admin can create regions
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await req.json();
  const region = await Region.create({ name, description });

  return NextResponse.json({ message: "Region created", region }, { status: 201 });
}
