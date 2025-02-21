import mongoose, { Schema, Document } from "mongoose";

export type TimeRange = "day" | "week" | "month" | "all";

export interface IEngagementScore extends Document {
  buildRequestHash: string;
  timeRange: TimeRange;
  score: number;
  periodStart: Date;
  periodEnd: Date;
  metrics: {
    likes: number;
    recasts: number;
    replies: number;
    watches: number;
  };
  lastCalculated: Date;
}

const EngagementScoreSchema = new Schema<IEngagementScore>(
  {
    buildRequestHash: { type: String, required: true },
    timeRange: {
      type: String,
      required: true,
      enum: ["day", "week", "month", "all"],
    },
    score: { type: Number, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    metrics: {
      likes: { type: Number, required: true },
      recasts: { type: Number, required: true },
      replies: { type: Number, required: true },
      watches: { type: Number, required: true },
    },
    lastCalculated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Indexes
EngagementScoreSchema.index(
  { buildRequestHash: 1, timeRange: 1 },
  { unique: true },
);
EngagementScoreSchema.index({ timeRange: 1, score: -1 });
EngagementScoreSchema.index({ periodStart: 1, periodEnd: 1 });
EngagementScoreSchema.index({ lastCalculated: 1 });

// Static methods
EngagementScoreSchema.statics.upsertScore = async function (
  buildRequestHash: string,
  timeRange: TimeRange,
  metrics: IEngagementScore["metrics"],
  periodStart: Date,
  periodEnd: Date,
) {
  // Calculate score - we can adjust this formula based on our needs
  const score =
    metrics.likes * 2 +
    metrics.recasts * 3 +
    metrics.replies +
    metrics.watches * 0.5;

  return this.findOneAndUpdate(
    { buildRequestHash, timeRange },
    {
      score,
      metrics,
      periodStart,
      periodEnd,
      lastCalculated: new Date(),
    },
    { upsert: true, new: true },
  );
};

EngagementScoreSchema.statics.getTopForPeriod = async function (
  timeRange: TimeRange,
  limit = 25,
) {
  return this.find({ timeRange })
    .sort({ score: -1 })
    .limit(limit)
    .populate("buildRequestHash");
};

export const EngagementScore =
  mongoose.models.EngagementScore ||
  mongoose.model<IEngagementScore>("EngagementScore", EngagementScoreSchema);
