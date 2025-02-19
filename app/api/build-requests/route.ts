import { NextResponse } from 'next/server';
import { BuildRequestSchema } from '@/lib/api/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get('cursor');
        const limit = parseInt(searchParams.get('limit') || '25', 10);
        const timeWindow = searchParams.get('timeWindow') as 'day' | 'week' | 'month' | null;

        console.log('Fetching casts with params:', {
            cursor,
            limit,
            timeWindow,
        });

        const url = `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=someone-build&with_recasts=true&with_replies=false&members_only=true&limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
        
        console.log('Fetching from URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-api-key': process.env.NEYNAR_API_KEY || '',
            },
        });

        if (!response.ok) {
            console.error('API Error:', {
                status: response.status,
                statusText: response.statusText,
                text: await response.text(),
            });
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw API Response:', JSON.stringify(data, null, 2));

        let buildRequests = [];
        
        for (const cast of data.casts || []) {
            try {
                const parsed = BuildRequestSchema.parse({
                    ...cast,
                });
                buildRequests.push(parsed);
            } catch (e) {
                console.error('Failed to parse cast:', cast, e);
            }
        }

        // Filter by time window if specified
        if (timeWindow) {
            const now = Date.now();
            const timeWindowMs = {
                day: 7 * 24 * 60 * 60 * 1000,     // 1 week for "day"
                week: 30 * 24 * 60 * 60 * 1000,   // 1 month for "week"
                month: 180 * 24 * 60 * 60 * 1000, // 6 months for "month"
            }[timeWindow];

            buildRequests = buildRequests.filter(
                (req) => {
                    const timestamp = new Date(req.timestamp).getTime();
                    return now - timestamp <= timeWindowMs;
                }
            );

            // Sort by engagement (likes + recasts) for time-windowed requests
            buildRequests.sort((a, b) => {
                const aScore = a.reactions.likes_count + a.reactions.recasts_count;
                const bScore = b.reactions.likes_count + b.reactions.recasts_count;
                return bScore - aScore;
            });

            // Limit results after filtering
            buildRequests = buildRequests.slice(0, limit);
        }

        return NextResponse.json({
            buildRequests,
            next: data.next?.cursor,
        });
    } catch (error) {
        console.error('Error fetching build requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch build requests', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 