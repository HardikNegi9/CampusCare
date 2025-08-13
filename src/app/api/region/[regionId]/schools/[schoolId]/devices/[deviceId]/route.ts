import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Device } from "@/models/Device";

export async function GET( req: NextRequest, { params }: { params: { deviceId: string } }) {
  await dbConnect();
  const { deviceId } = await params;

  const device = await Device.findById(deviceId).populate("location", "name");
  if (!device) {
    return NextResponse.json({ message: "Device not found" }, { status: 404 });
  }

  return NextResponse.json(device);
}

export async function PUT( req: NextRequest, { params }: { params: { deviceId: string } }) {
  await dbConnect();
  const { deviceId } = await params;
  const body = await req.json();

  const updated = await Device.findByIdAndUpdate(deviceId, body, { new: true });
  if (!updated) {
    return NextResponse.json({ message: "Device not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE( req: NextRequest, { params }: { params: { deviceId: string } }) {
  await dbConnect();
  const { deviceId } = await params;

  const deleted = await Device.findByIdAndDelete(deviceId);
  if (!deleted) {
    return NextResponse.json({ message: "Device not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Device deleted successfully" });
}
