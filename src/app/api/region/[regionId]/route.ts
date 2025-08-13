import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Region } from "@/models/Region";
import { verifyToken } from "@/lib/auth";

// GET /api/region/[regionId]
export async function GET(req: Request, { params }: { params: { regionId: string } }) {
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

  // Await params before accessing regionId
  const { regionId } = await params;
  const region = await Region.findById(regionId);
  if (!region) {
    return NextResponse.json({ message: "Region not found" }, { status: 404 });
  }

  return NextResponse.json({ region }, { status: 200 });
}

// PUT /api/region/[regionId] -> Update region (Admin only)
export async function PUT(req: Request, { params }: { params: { regionId: string } }) {
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
  const { name, description } = await req.json();
  const updatedRegion = await Region.findByIdAndUpdate(
    regionId,
    { name, description },
    { new: true }
  );

  return NextResponse.json({ message: "Region updated", region: updatedRegion }, { status: 200 });
}

// DELETE /api/region/[regionId] -> Delete region (Admin only)
export async function DELETE(req: Request, { params }: { params: { regionId: string } }) {
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
  await Region.findByIdAndDelete(regionId);

  return NextResponse.json({ message: "Region deleted" }, { status: 200 });
}
