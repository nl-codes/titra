import mongoose, { InferSchemaType, Model } from "mongoose";

export type TaskLogStatus = "completed" | "skipped" | "rescheduled";

const taskLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, trim: true },
    scheduledDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    scheduledTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    status: {
      type: String,
      enum: ["completed", "skipped", "rescheduled"],
      required: true,
    },
    loggedValue: { type: mongoose.Schema.Types.Mixed },
    notes: { type: String, trim: true, default: "" },
    completedAt: { type: Date },
    rescheduledDate: {
      type: String,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    rescheduledTime: {
      type: String,
      trim: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
  },
  { timestamps: true },
);

taskLogSchema.index({ userId: 1, scheduledDate: 1 });
taskLogSchema.index(
  { taskId: 1, scheduledDate: 1, scheduledTime: 1 },
  { unique: true },
);

export type TaskLog = InferSchemaType<typeof taskLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TaskLogModel =
  (mongoose.models.TaskLog as Model<TaskLog>) ||
  mongoose.model<TaskLog>("TaskLog", taskLogSchema);
