import mongoose, { InferSchemaType, Model } from "mongoose";

const trackingConfigSchema = new mongoose.Schema(
  {
    metricName: { type: String, trim: true, default: "" },
    unit: { type: String, trim: true, default: "" },
    targetValue: { type: Number },
  },
  { _id: false },
);

const taskSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    durationMinutes: { type: Number, required: true, min: 1, default: 30 },
    isRecurring: { type: Boolean, required: true, default: false },
    rruleString: { type: String, trim: true, default: "" },
    intradayTimes: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator(times: string[]) {
          return times.every((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time));
        },
        message: "intradayTimes must contain HH:mm values",
      },
    },
    oneTimeDate: { type: String, trim: true, default: null },
    isTracked: { type: Boolean, required: true, default: false },
    trackingConfig: { type: trackingConfigSchema, default: undefined },
    color: { type: String, trim: true, default: "#2563eb" },
  },
  { timestamps: true },
);

export type Task = InferSchemaType<typeof taskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type TaskPlain = Omit<Task, "_id"> & {
  _id: string;
};

export const TaskModel =
  (mongoose.models.Task as Model<Task>) ||
  mongoose.model<Task>("Task", taskSchema);
