import mongoose, { Schema, Document } from "mongoose";

// 1️⃣ Define what a Device Log looks like (TypeScript interface)
export interface IDeviceLog extends Document {
  device: mongoose.Types.ObjectId; // Reference to the device
  action: 'activated' | 'deactivated' | 'created' | 'updated' | 'deleted';
  description: string; // Description of what happened
  deactivationReason?: string; // Reason for deactivation (only for deactivated action)
  oldValues?: {
    status?: string;
    location?: mongoose.Types.ObjectId;
    deviceType?: string;
    name?: string;
  }; // Previous values before change
  newValues?: {
    status?: string;
    location?: mongoose.Types.ObjectId;
    deviceType?: string;
    name?: string;
  }; // New values after change
  performedBy: mongoose.Types.ObjectId; // User who performed the action
  timestamp: Date;
  ipAddress?: string; // IP address of the user
  userAgent?: string; // Browser/device info
}

// 2️⃣ Define the schema (how MongoDB will store it)
const deviceLogSchema = new Schema<IDeviceLog>({
  device: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  action: { 
    type: String, 
    required: true,
    enum: ['activated', 'deactivated', 'created', 'updated', 'deleted']
  },
  description: { type: String, required: true },
  deactivationReason: { type: String }, // Only used when action is 'deactivated'
  oldValues: {
    status: { type: String },
    location: { type: Schema.Types.ObjectId, ref: "Location" },
    deviceType: { type: String },
    name: { type: String }
  },
  newValues: {
    status: { type: String },
    location: { type: Schema.Types.ObjectId, ref: "Location" },
    deviceType: { type: String },
    name: { type: String }
  },
  performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// 3️⃣ Add indexes for better query performance
deviceLogSchema.index({ device: 1, timestamp: -1 });
deviceLogSchema.index({ performedBy: 1, timestamp: -1 });
deviceLogSchema.index({ action: 1, timestamp: -1 });

// 4️⃣ Export model so we can use it in APIs
export const DeviceLog = mongoose.models.DeviceLog || mongoose.model<IDeviceLog>("DeviceLog", deviceLogSchema);
