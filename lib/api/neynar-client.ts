// Client-side version of the Neynar client
class NeynarClient {
    private static instance: NeynarClient;
    private readonly baseUrl = 'https://api.neynar.com/v2/farcaster';

    private constructor() {}

    public static getInstance(): NeynarClient {
        if (!NeynarClient.instance) {
            NeynarClient.instance = new NeynarClient();
        }
        return NeynarClient.instance;
    }

    async fetchUserProfile(fid: number) {
        const response = await fetch(`/api/neynar/user/${fid}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        return response.json();
    }
}

export const neynarClient = NeynarClient.getInstance(); 