import mongoose, { Schema, Document } from "mongoose";

// 1️⃣ Define what a Region looks like
export interface IRegion extends Document {
  name: string;                // Region name (e.g., "North Zone")
  description?: string;        // Optional details
}

// 2️⃣ Create the schema
const regionSchema = new Schema<IRegion>({
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

// 3️⃣ Export model
export const Region = mongoose.models.Region || mongoose.model<IRegion>("Region", regionSchema);
