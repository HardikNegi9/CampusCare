import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Location } from "@/models/Location";

export async function GET(req: Request, { params }: { params: { locationId: string } }) {
  await dbConnect();
  const { locationId } = await params;
  const location = await Location.findById( locationId );
  if (!location) return NextResponse.json({ message: "Location not found" }, { status: 404 });
  return NextResponse.json(location);
}

export async function PUT(req: Request, { params }: { params: { locationId: string } }) {
  await dbConnect();
  const data = await req.json();
  const { locationId } = await params;
  const location = await Location.findByIdAndUpdate( locationId, data, { new: true });
  return NextResponse.json(location);
}

export async function DELETE(req: Request, { params }: { params: { locationId: string } }) {
  await dbConnect();
  const { locationId } = await params;
  await Location.findByIdAndDelete( locationId );
  return NextResponse.json({ message: "Location deleted" });
}
