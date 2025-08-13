import mongoose, { Schema, Document } from "mongoose";

export interface ISchool extends Document {
  name: string;
  address: string;
  region: mongoose.Types.ObjectId; // reference to Region
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    region: { type: Schema.Types.ObjectId, ref: "Region", required: true },
  },
  { timestamps: true }
);

export const School = mongoose.models.School || mongoose.model<ISchool>("School", SchoolSchema);
