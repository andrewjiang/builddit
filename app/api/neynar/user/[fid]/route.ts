import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/api/neynar';

export async function GET(
    request: Request,
    { params }: { params: { fid: string } }
) {
    try {
        const fid = parseInt(params.fid, 10);
        if (isNaN(fid)) {
            return NextResponse.json(
                { error: 'Invalid FID' },
                { status: 400 }
            );
        }

        const user = await neynarClient.fetchUserProfile(fid);
        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user from Neynar:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user from Neynar' },
            { status: 500 }
        );
    }
} 