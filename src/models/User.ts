import mongoose, { Schema, Document } from "mongoose";

// 1️⃣ Define what a User looks like (TypeScript interface)
export interface IUser extends Document { // extends Document → makes sure MongoDB functions (.save(), .find()) work with this type.
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "engineer" | "faculty";
  affiliatedSchool?: mongoose.Types.ObjectId; // Only for faculty
}

// 2️⃣ Define the schema (how MongoDB will store it)
const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "engineer", "faculty"], required: true },
  affiliatedSchool: { type: Schema.Types.ObjectId, ref: "School" }, // links to a school
});

// 3️⃣ Export model so we can use it in APIs
export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
