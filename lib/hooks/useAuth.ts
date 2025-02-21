import { useProfile } from '@farcaster/auth-kit';
import { useEffect } from 'react';
import { neynarClient } from '@/lib/api/neynar-client';

interface Profile {
    fid: number;
    username: string;
    displayName?: string;
    pfp?: {
        url: string;
        verified: boolean;
    };
}

interface ProfileState {
    isAuthenticated: boolean;
    profile: Profile | null;
}

export function useAuth() {
    const { isAuthenticated, profile } = useProfile() as ProfileState;

    useEffect(() => {
        const syncUserData = async () => {
            if (isAuthenticated && profile?.fid) {
                try {
                    // Fetch complete user data from Neynar
                    const neynarUser = await neynarClient.fetchUserProfile(profile.fid);
                    
                    // Store the user data in our database
                    await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fid: neynarUser.fid,
                            username: neynarUser.username,
                            displayName: neynarUser.display_name || neynarUser.username,
                            pfpUrl: neynarUser.pfp_url || '',
                        }),
                    });
                } catch (error) {
                    console.error('Error syncing user data:', error);
                }
            }
        };

        syncUserData();
    }, [isAuthenticated, profile?.fid]);

    return { isAuthenticated, profile };
} 