import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { FarcasterUser } from '@/lib/db/models/User';

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

        await connectToDatabase();
        const user = await FarcasterUser.findOne({ fid });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
} 