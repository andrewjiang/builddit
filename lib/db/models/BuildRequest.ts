import mongoose, { Schema, Document } from 'mongoose';
import { IFarcasterUser } from './User';

export interface IBuildRequest extends Document {
  hash: string;
  text: string;
  publishedAt: Date;
  author: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
  };
  engagement: {
    likes: number;
    recasts: number;
    replies: number;
    watches: number;
  };
  parentHash?: string;
  mentions: string[];
  embeds: Array<{
    url?: string;
    cast_id?: {
      fid: number;
      hash: string;
    };
    cast?: {
      author: {
        fid: number;
        username: string;
        displayName?: string;
        pfpUrl?: string;
      };
      text: string;
      hash: string;
      timestamp: string;
      embeds?: Array<{
        url?: string;
        cast_id?: {
          fid: number;
          hash: string;
        };
        cast?: any;
      }>;
    };
    metadata?: {
      html?: {
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: Array<{
          url: string;
          width?: string;
          height?: string;
        }>;
      };
    };
    type: string;
  }>;
  lastUpdated: Date;
}

const BuildRequestSchema = new Schema<IBuildRequest>(
  {
    hash: { type: String, required: true, unique: true },
    text: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    author: {
      fid: { type: Number, required: true, ref: 'FarcasterUser' },
      username: { type: String, required: true },
      displayName: { type: String, required: true },
      pfpUrl: { type: String, required: false, default: '' },
    },
    engagement: {
      likes: { type: Number, default: 0 },
      recasts: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
      watches: { type: Number, default: 0 },
    },
    parentHash: { type: String },
    mentions: [{ type: String }],
    embeds: [{
      url: { type: String },
      cast_id: {
        fid: { type: Number },
        hash: { type: String }
      },
      cast: {
        author: {
          fid: { type: Number },
          username: { type: String },
          displayName: { type: String },
          pfpUrl: { type: String }
        },
        text: { type: String },
        hash: { type: String },
        timestamp: { type: String },
        embeds: [{
          url: { type: String },
          cast_id: {
            fid: { type: Number },
            hash: { type: String }
          },
          cast: { type: Schema.Types.Mixed }
        }]
      },
      metadata: {
        html: {
          ogTitle: { type: String },
          ogDescription: { type: String },
          ogImage: [{
            url: { type: String },
            width: { type: String },
            height: { type: String }
          }]
        }
      },
      type: { type: String }
    }],
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
BuildRequestSchema.index({ 'author.fid': 1 });
BuildRequestSchema.index({ publishedAt: -1 });
BuildRequestSchema.index({ lastUpdated: -1 });
BuildRequestSchema.index({ 'engagement.likes': -1 });
BuildRequestSchema.index({ 'engagement.recasts': -1 });

// Compound indexes for sorting by engagement and time
BuildRequestSchema.index({ 'engagement.likes': -1, publishedAt: -1 });
BuildRequestSchema.index({ 'engagement.recasts': -1, publishedAt: -1 });

// Static methods
BuildRequestSchema.statics.upsertBuildRequest = async function (buildRequestData: Partial<IBuildRequest>) {
  const { hash, ...rest } = buildRequestData;
  if (!hash) throw new Error('Hash is required for build request upsert');

  return this.findOneAndUpdate(
    { hash },
    { ...rest, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
};

BuildRequestSchema.statics.getLatest = async function (limit = 25) {
  return this.find()
    .sort({ publishedAt: -1 })
    .limit(limit);
};

BuildRequestSchema.statics.getTop = async function (
  timeRange: { start: Date; end: Date },
  limit = 25
) {
  return this.find({
    publishedAt: { $gte: timeRange.start, $lte: timeRange.end },
  })
    .sort({ 'engagement.likes': -1, publishedAt: -1 })
    .limit(limit);
};

export const BuildRequest = mongoose.models.BuildRequest || 
  mongoose.model<IBuildRequest>('BuildRequest', BuildRequestSchema); 