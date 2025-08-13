import mongoose, { Schema, Document } from "mongoose";

// 1️⃣ Define what a Device looks like (TypeScript interface)
export interface IDevice extends Document {
  name: string; // e.g., CCTV-01, Printer-02
  deviceType: "cctv" | "printer" | "camera";
  location: mongoose.Types.ObjectId; // Reference to Location
  status: "active" | "inactive";
  school: mongoose.Types.ObjectId; // The school where the device belongs
}

// 2️⃣ Define the schema (how MongoDB will store it)
const deviceSchema = new Schema<IDevice>({
  name: { type: String, required: true },
  deviceType: {
    type: String,
    enum: ["cctv", "printer", "camera"],
    required: true,
  },
  location: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
});

// 3️⃣ Export model so we can use it in APIs
export const Device =
  mongoose.models.Device || mongoose.model<IDevice>("Device", deviceSchema);
