import mongoose, { Schema, Document } from "mongoose";

export interface IFarcasterUser extends Document {
  fid: number;
  username: string;
  displayName: string;
  pfp: {
    url: string;
    verified: boolean;
  };
  profile: {
    bio: {
      text: string;
      mentioned_profiles: string[];
    };
    location: string;
  };
  followerCount: number;
  followingCount: number;
  activeStatus: string;
  lastUpdated: Date;
}

const FarcasterUserSchema = new Schema<IFarcasterUser>(
  {
    fid: { type: Number, required: true, unique: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    pfp: {
      url: { type: String, required: true },
      verified: { type: Boolean, required: true },
    },
    profile: {
      bio: {
        text: { type: String, default: "" },
        mentioned_profiles: [{ type: String }],
      },
      location: { type: String, default: "" },
    },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    activeStatus: { type: String, default: "active" },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Indexes
FarcasterUserSchema.index({ username: 1 });
FarcasterUserSchema.index({ lastUpdated: 1 });

// Static methods
FarcasterUserSchema.statics.upsertUser = async function (
  userData: Partial<IFarcasterUser>,
) {
  const { fid, ...rest } = userData;
  if (!fid) throw new Error("FID is required for user upsert");

  return this.findOneAndUpdate(
    { fid },
    { ...rest, lastUpdated: new Date() },
    { upsert: true, new: true },
  );
};

export const FarcasterUser =
  mongoose.models.FarcasterUser ||
  mongoose.model<IFarcasterUser>("FarcasterUser", FarcasterUserSchema);
