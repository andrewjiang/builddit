import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectToDatabase } from '../lib/db/connect.js';
import { BuildRequest } from '../lib/db/models/BuildRequest.js';
import { FarcasterUser } from '../lib/db/models/User.js';
import { neynarClient } from '../lib/api/neynar.js';
import { BuildRequestSchema } from '../lib/api/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') });

async function syncHistoricalBuilds() {
    try {
        // Verify required environment variables
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        if (!process.env.NEYNAR_API_KEY) {
            throw new Error('NEYNAR_API_KEY environment variable is required');
        }

        // Connect to MongoDB
        await connectToDatabase();
        console.log('Connected to MongoDB');

        const TARGET_COUNT = 5000; // Increased to 5000 posts
        let totalProcessed = 0;
        let totalUsers = 0;
        let cursor: string | undefined;

        while (totalProcessed < TARGET_COUNT) {
            console.log(`\nFetching batch starting at cursor: ${cursor || 'initial'}`);
            
            const response = await neynarClient.fetchBuildRequests(cursor, 100); // Max batch size
            if (!response.casts || response.casts.length === 0) {
                console.log('No more casts to process');
                break;
            }

            const userSet = new Set<number>();

            for (const cast of response.casts) {
                try {
                    // Parse and validate the cast
                    const parsed = BuildRequestSchema.parse(cast);

                    // Track unique users
                    userSet.add(parsed.author.fid);
                    totalUsers = userSet.size;

                    // Store author information
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

                    // Transform to our database model
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
                        parentHash: parsed.parent_hash || '',
                        mentions: parsed.mentioned_profiles
                            .filter((p: { username?: string }) => p.username)
                            .map((p: { username: string }) => p.username),
                        embeds: parsed.embeds.map((e: any) => ({
                            url: e.url,
                            cast_id: e.cast_id,
                            cast: e.cast && {
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
                            },
                            metadata: e.metadata,
                            type: e.cast_id ? 'cast' : 'url',
                        })),
                        lastUpdated: new Date(),
                    };

                    // Store in MongoDB
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

            // Update cursor for next batch
            cursor = response.next?.cursor;
            if (!cursor) {
                console.log('No more pages to fetch');
                break;
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\nSync completed!');
        console.log(`Total build requests processed: ${totalProcessed}`);
        console.log(`Total unique users: ${totalUsers}`);

    } catch (error) {
        console.error('Error syncing historical builds:', error);
        process.exit(1);
    }
    process.exit(0);
}

// Run the sync
syncHistoricalBuilds(); 