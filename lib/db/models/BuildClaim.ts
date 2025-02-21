import mongoose, { Schema, Document } from 'mongoose';

export interface IBuildClaim extends Document {
    castHash: string;           // The claim cast's hash
    buildRequestHash: string;   // Original build request hash
    type: 'reply' | 'quote';   // Type of interaction
    author: {
        fid: number;
        username: string;
        displayName: string;
        pfpUrl?: string;
    };
    text: string;              // Cast content
    publishedAt: Date;
    engagement: {              // Same engagement metrics as build requests
        likes: number;
        recasts: number;
        replies: number;
    };
    isTagged: boolean;         // Whether it tags @ibuiltit
    isHighlighted: boolean;    // Whether OP has highlighted this (for future use)
    lastUpdated: Date;
}

const BuildClaimSchema = new Schema<IBuildClaim>(
    {
        castHash: { type: String, required: true, unique: true },
        buildRequestHash: { type: String, required: true },
        type: { type: String, required: true, enum: ['reply', 'quote'] },
        author: {
            fid: { type: Number, required: true },
            username: { type: String, required: true },
            displayName: { type: String, required: true },
            pfpUrl: String,
        },
        text: { type: String, required: true },
        publishedAt: { type: Date, required: true },
        engagement: {
            likes: { type: Number, default: 0 },
            recasts: { type: Number, default: 0 },
            replies: { type: Number, default: 0 },
        },
        isTagged: { type: Boolean, default: false },
        isHighlighted: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
BuildClaimSchema.index({ buildRequestHash: 1, publishedAt: -1 });
BuildClaimSchema.index({ buildRequestHash: 1, 'engagement.likes': -1 });
BuildClaimSchema.index({ buildRequestHash: 1, 'engagement.recasts': -1 });
BuildClaimSchema.index({ buildRequestHash: 1, isTagged: 1 });
BuildClaimSchema.index({ 'author.fid': 1 });
BuildClaimSchema.index({ lastUpdated: -1 });

// Compound index for sorting claims
BuildClaimSchema.index({ 
    buildRequestHash: 1, 
    isTagged: -1, 
    'engagement.likes': -1, 
    'engagement.recasts': -1,
    publishedAt: -1 
});

// Static methods
BuildClaimSchema.statics.upsertClaim = async function(claimData: Partial<IBuildClaim>) {
    const { castHash, ...rest } = claimData;
    if (!castHash) throw new Error('Cast hash is required for claim upsert');

    return this.findOneAndUpdate(
        { castHash },
        { ...rest, lastUpdated: new Date() },
        { upsert: true, new: true }
    );
};

// Helper to calculate engagement score (same as build requests)
BuildClaimSchema.methods.getEngagementScore = function(): number {
    return this.engagement.likes + (this.engagement.recasts * 2);
};

export const BuildClaim = mongoose.models.BuildClaim || 
    mongoose.model<IBuildClaim>('BuildClaim', BuildClaimSchema); 