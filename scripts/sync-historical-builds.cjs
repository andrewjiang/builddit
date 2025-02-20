const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const { z } = require('zod');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
}

// Neynar API key
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
if (!NEYNAR_API_KEY) {
    throw new Error('NEYNAR_API_KEY environment variable is required');
}

// Schema definitions
const UserSchema = z.object({
    fid: z.number(),
    username: z.string().optional(),
    display_name: z.string().optional(),
    pfp_url: z.string().optional(),
});

const ReactionsSchema = z.object({
    likes_count: z.number(),
    recasts_count: z.number(),
    likes: z.array(z.object({ fid: z.number(), fname: z.string().optional() })).optional(),
    recasts: z.array(z.object({ fid: z.number(), fname: z.string().optional() })).optional(),
});

const EmbeddedCastSchema = z.lazy(() => z.object({
    author: UserSchema.nullable().optional(),
    text: z.string().optional(),
    hash: z.string().optional(),
    timestamp: z.string().optional(),
    embeds: z.array(z.object({
        url: z.string().optional(),
        cast_id: z.object({
            fid: z.number(),
            hash: z.string(),
        }).optional(),
        cast: z.lazy(() => EmbeddedCastSchema.optional().nullable()),
        metadata: z.object({
            html: z.object({
                ogTitle: z.string().optional(),
                ogDescription: z.string().optional(),
                ogImage: z.array(z.object({
                    url: z.string(),
                    width: z.string().optional(),
                    height: z.string().optional(),
                })).optional(),
            }).optional(),
        }).optional(),
    })).optional(),
}));

const BuildRequestSchema = z.object({
    hash: z.string(),
    text: z.string(),
    timestamp: z.string(),
    author: UserSchema,
    reactions: ReactionsSchema,
    replies: z.object({ count: z.number() }),
    mentioned_profiles: z.array(UserSchema).optional(),
    embeds: z.array(z.object({
        url: z.string().optional(),
        cast_id: z.object({
            fid: z.number(),
            hash: z.string(),
        }).optional(),
        cast: EmbeddedCastSchema.optional(),
        metadata: z.object({
            html: z.object({
                ogTitle: z.string().optional(),
                ogDescription: z.string().optional(),
                ogImage: z.array(z.object({
                    url: z.string(),
                    width: z.string().optional(),
                    height: z.string().optional(),
                })).optional(),
            }).optional(),
        }).optional(),
    })).optional().default([]),
});

// MongoDB schemas
const BuildRequestMongoSchema = new mongoose.Schema({
    hash: { type: String, required: true, unique: true },
    text: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    author: {
        fid: { type: Number, required: true },
        username: { type: String, required: true },
        displayName: { type: String, required: true },
        pfpUrl: { type: String },
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
            hash: { type: String },
        },
        cast: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        metadata: {
            html: {
                ogTitle: { type: String },
                ogDescription: { type: String },
                ogImage: [{
                    url: { type: String },
                    width: { type: String },
                    height: { type: String },
                }],
            },
        },
        type: { type: String },
    }],
    lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const FarcasterUserMongoSchema = new mongoose.Schema({
    fid: { type: Number, required: true, unique: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    pfp: {
        url: { type: String },
        verified: { type: Boolean, default: true },
    },
    lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

// Models
const BuildRequest = mongoose.models.BuildRequest || mongoose.model('BuildRequest', BuildRequestMongoSchema);
const FarcasterUser = mongoose.models.FarcasterUser || mongoose.model('FarcasterUser', FarcasterUserMongoSchema);

// Neynar client
class NeynarClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async fetchBuildRequests(cursor, limit = 100) {
        const url = `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=someone-build&with_recasts=true&with_replies=false&members_only=true&limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-API-Key': this.apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Neynar API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return {
            casts: data.casts,
            next: data.next,
        };
    }
}

const neynarClient = new NeynarClient(NEYNAR_API_KEY);

async function syncHistoricalBuilds() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const TARGET_COUNT = 5000;
        let totalProcessed = 0;
        let totalUsers = 0;
        let cursor;

        while (totalProcessed < TARGET_COUNT) {
            console.log(`\nFetching batch starting at cursor: ${cursor || 'initial'}`);
            
            const response = await neynarClient.fetchBuildRequests(cursor);
            if (!response.casts || response.casts.length === 0) {
                console.log('No more casts to process');
                break;
            }

            const userSet = new Set();

            for (const cast of response.casts) {
                try {
                    const parsed = BuildRequestSchema.parse(cast);

                    userSet.add(parsed.author.fid);
                    totalUsers = userSet.size;

                    if (parsed.author.username && parsed.author.display_name) {
                        await FarcasterUser.findOneAndUpdate(
                            { fid: parsed.author.fid },
                            {
                                fid: parsed.author.fid,
                                username: parsed.author.username,
                                displayName: parsed.author.display_name,
                                pfp: {
                                    url: parsed.author.pfp_url || '',
                                    verified: true,
                                },
                                lastUpdated: new Date(),
                            },
                            { upsert: true }
                        );
                    }

                    const buildRequest = {
                        hash: parsed.hash,
                        text: parsed.text,
                        publishedAt: new Date(parsed.timestamp),
                        author: {
                            fid: parsed.author.fid,
                            username: parsed.author.username,
                            displayName: parsed.author.display_name,
                            pfpUrl: parsed.author.pfp_url || '',
                        },
                        engagement: {
                            likes: parsed.reactions.likes_count,
                            recasts: parsed.reactions.recasts_count,
                            replies: parsed.replies.count,
                            watches: 0,
                        },
                        parentHash: '',
                        mentions: parsed.mentioned_profiles
                            .filter(p => p.username)
                            .map(p => p.username),
                        embeds: parsed.embeds.map(e => ({
                            url: e.url,
                            cast_id: e.cast_id,
                            cast: e.cast && e.cast.author ? {
                                author: {
                                    fid: e.cast.author.fid,
                                    username: e.cast.author.username,
                                    displayName: e.cast.author.display_name,
                                    pfpUrl: e.cast.author.pfp_url,
                                },
                                text: e.cast.text,
                                hash: e.cast.hash,
                                timestamp: e.cast.timestamp,
                                embeds: e.cast.embeds,
                            } : null,
                            metadata: e.metadata,
                            type: e.cast_id ? 'cast' : 'url',
                        })),
                        lastUpdated: new Date(),
                    };

                    await BuildRequest.findOneAndUpdate(
                        { hash: buildRequest.hash },
                        buildRequest,
                        { upsert: true }
                    );

                    totalProcessed++;
                    if (totalProcessed % 10 === 0) {
                        console.log(`Processed ${totalProcessed} build requests (${totalUsers} unique users)`);
                    }

                } catch (e) {
                    console.error('Failed to process cast:', e);
                }
            }

            cursor = response.next?.cursor;
            if (!cursor) {
                console.log('No more pages to fetch');
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\nSync completed!');
        console.log(`Total build requests processed: ${totalProcessed}`);
        console.log(`Total unique users: ${totalUsers}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error syncing historical builds:', error);
        process.exit(1);
    }
}

syncHistoricalBuilds(); 