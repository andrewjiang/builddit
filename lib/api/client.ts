import { BuildRequest } from './types';
import { SortOption } from '@/components/FilterBar';

export async function fetchBuildRequests(
    options: {
        cursor?: string;
        limit?: number;
        sort?: SortOption;
        search?: string;
    } = {}
): Promise<{ buildRequests: BuildRequest[]; next?: string }> {
    try {
        const { cursor, limit = 25, sort = 'top_day', search } = options;
        const params = new URLSearchParams();
        
        if (cursor) params.set('cursor', cursor);
        if (limit) params.set('limit', limit.toString());
        if (sort) params.set('sort', sort);
        if (search) params.set('search', search);

        const response = await fetch(`/api/build-requests?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch build requests');
        }

        const data = await response.json();
        
        // Transform the response to ensure embedded casts are properly included
        const buildRequests = data.buildRequests.map((request: BuildRequest) => ({
            ...request,
            embeds: request.embeds.map(embed => ({
                ...embed,
                // If this is a cast embed, ensure we include all the cast data
                ...(embed.cast_id && embed.cast ? {
                    type: 'cast',
                    cast_id: embed.cast_id,
                    cast: {
                        ...embed.cast,
                        author: {
                            ...embed.cast.author,
                            // Ensure we have all required user fields
                            object: embed.cast.author.object || 'user_dehydrated',
                        },
                    },
                } : embed.url ? {
                    type: 'url',
                    url: embed.url,
                    metadata: embed.metadata,
                } : {}),
            })),
        }));

        return {
            buildRequests,
            next: data.next,
        };
    } catch (error) {
        console.error('Error fetching build requests:', error);
        throw error;
    }
}

export async function fetchBuildRequestClaims(
    hash: string
): Promise<any[]> {
    try {
        const response = await fetch(`/api/build-requests/${hash}/claims`);
        if (!response.ok) {
            throw new Error('Failed to fetch build request claims');
        }

        const data = await response.json();
        return data.claims;
    } catch (error) {
        console.error('Error fetching build request claims:', error);
        throw error;
    }
}

export async function fetchTopBuildRequests(
    timeWindow: 'day' | 'week' | 'month' = 'week',
    limit: number = 25
): Promise<BuildRequest[]> {
    try {
        const params = new URLSearchParams({
            timeWindow,
            limit: limit.toString(),
        });

        const response = await fetch(`/api/build-requests?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch top build requests');
        }

        const { buildRequests } = await response.json();
        
        // Sort by engagement (likes_count + recasts_count)
        return buildRequests
            .sort((a: BuildRequest, b: BuildRequest) => {
                const aScore = a.reactions.likes_count + a.reactions.recasts_count;
                const bScore = b.reactions.likes_count + b.reactions.recasts_count;
                return bScore - aScore;
            })
            .slice(0, limit);
    } catch (error) {
        console.error('Error fetching top build requests:', error);
        throw error;
    }
} 