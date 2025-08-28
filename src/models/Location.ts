import mongoose, { Schema, Document } from "mongoose";

// 1️⃣ Define what a Location looks like (TypeScript interface)
export interface ILocation extends Document {
  name: string; // e.g., Lab 1, Office Room 2
  description?: string; // Optional description of the location
  floor?: number;
  building?: string;
  school: mongoose.Types.ObjectId; // The school where the location belongs
}

// 2️⃣ Define the schema (how MongoDB will store it)
const locationSchema = new Schema<ILocation>({
  name: { type: String, required: true },
  description: { type: String }, // Optional description field
  floor: { type: Number },
  building: { type: String },
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
});

// 3️⃣ Export model so we can use it in APIs
export const Location = mongoose.models.Location || mongoose.model<ILocation>("Location", locationSchema);
