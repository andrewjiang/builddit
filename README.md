# Builddit

A Reddit-like interface for the Farcaster `/someone-build` channel, where users can discover and claim build requests from the Farcaster community.

## Overview

Builddit provides a streamlined interface for browsing and interacting with build requests posted to Farcaster's `/someone-build` channel. Users can browse build requests without authentication, and Farcaster users can claim builds they've completed through Warpcast integration.

## Features

### Core Features

- Browse build requests from `/someone-build` channel
  - View text posts with author information
  - Sort by Newest and Top (Day, Week, Month, All)
  - Real-time polling with graceful updates
  - Search functionality
- Authentication
  - Sign in with Farcaster (Auth Kit integration)
  - Public browsing without authentication
  - Success state feedback
- Image Handling
  - Whitelisted domains support
  - Safe image component
  - Fallback for non-whitelisted sources
- Data Management
  - MongoDB integration
  - Neynar API integration

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: NextAuth.js, Farcaster Auth Kit
- **APIs**: Neynar API for Farcaster integration
- **Deployment**: Vercel

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/andrewjiang/builddit.git
   cd builddit
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   # Neynar API Configuration
   NEYNAR_API_KEY=your_api_key
   NEYNAR_CLIENT_ID=your_client_id
   NEYNAR_CHANNEL_ID=someone-build

   # MongoDB
   MONGODB_URI=your_mongodb_uri

   # Next-Auth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret

   # Farcaster Auth Configuration
   NEXT_PUBLIC_RELAY_URL=https://relay.farcaster.xyz
   NEXT_PUBLIC_RPC_URL=https://mainnet.optimism.io
   NEXT_PUBLIC_DOMAIN=localhost:3000
   NEXT_PUBLIC_SIWE_URI=http://localhost:3000/login
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

The project is deployed on Vercel. To deploy your own instance:

1. Fork the repository
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `NEYNAR_API_KEY`
   - `NEYNAR_CLIENT_ID`
   - `NEYNAR_CHANNEL_ID`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_RELAY_URL`
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_DOMAIN`
   - `NEXT_PUBLIC_SIWE_URI`
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License

## Links

- Live Site: [https://someonebuild.fun](https://someonebuild.fun)
- GitHub Repository: [https://github.com/andrewjiang/builddit](https://github.com/andrewjiang/builddit)
- Farcaster Channel: [/someone-build](https://warpcast.com/~/channel/someone-build)

## Technical Architecture

### Tech Stack

- Frontend: Next.js 14 with TypeScript
- Backend: Node.js with TypeScript
- Database: MongoDB
  - Collections: BuildRequest, FarcasterUser, EngagementScore
- Authentication: Farcaster Auth Kit
- Testing: Jest + React Testing Library

### Data Models

#### FarcasterUser

```typescript
interface FarcasterUser {
  fid: number; // Farcaster ID
  username: string; // Farcaster username
  displayName: string; // Display name
  pfp: {
    url: string; // Profile picture URL
    verified: boolean; // Profile picture verification status
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
```

#### Build Request

```typescript
interface BuildRequest {
  hash: string; // Unique identifier (Farcaster cast hash)
  text: string; // Post content
  timestamp: string; // Creation timestamp
  author: {
    fid: number; // Farcaster ID
    username: string; // Farcaster username
    display_name: string; // Display name
    pfp_url: string; // Profile picture URL
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
    likes: Array<{ fid: number; fname?: string }>;
    recasts: Array<{ fid: number; fname?: string }>;
  };
  replies: {
    count: number;
  };
  embeds: Array<{
    url?: string;
    cast_id?: {
      fid: number;
      hash: string;
    };
    cast?: EmbeddedCast;
    metadata?: {
      html?: {
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: Array<{
          url: string;
          width?: string;
          height?: string;
        }>;
      };
    };
  }>;
}
```

#### Claim

```typescript
interface Claim {
  id: string; // Unique identifier
  castId: string; // Farcaster quote cast ID
  buildRequestId: string; // Reference to original build request
  author: {
    fid: string; // Farcaster ID
    username: string; // Farcaster username
  };
  description: string; // Build description
  url: string; // Project URL
  timestamp: Date; // Claim timestamp
}
```

### Data Synchronization Architecture

The application uses a hybrid data fetching approach to balance performance and data freshness:

#### Frontend Polling

- The frontend polls every 30 seconds for new content
- Each poll first attempts to fetch from MongoDB for performance
- Falls back to Neynar API if MongoDB query fails or returns no results
- New posts are merged at the top during polling
- Additional posts are appended at the bottom during infinite scroll

#### Database Updates

1. **Primary Path (MongoDB)**
   - Most reads hit MongoDB first for better performance
   - Stores complete build request data including:
     - Cast metadata (text, timestamp, author)
     - Engagement metrics (likes, recasts, replies)
     - Embedded content and metadata
     - Claims and build status

2. **Fallback Path (Neynar API)**
   - Used when MongoDB fails or returns no results
   - Automatically updates MongoDB with new data
   - Updates both user information and build requests
   - Uses upsert operations to ensure data consistency

### Known Limitations

- Frontend polling might miss updates if MongoDB always returns results
- Engagement metrics might be stale between polls
- No real-time updates for likes/recasts

### Future Improvements

- [ ] Add timestamp checks to force Neynar refresh for stale data
- [ ] Implement background job for periodic Neynar sync
- [ ] Add Neynar webhook support for real-time updates
- [ ] Add Redis caching layer for high-traffic queries

## Recent Updates

- Added bounty posting feature
- Fixed authentication persistence
- Added loading states and animations
- Improved error handling and recovery
- Enhanced responsive design
- Implemented proper FID handling during sign-in
- Added whitelisted image domains
- Implemented silent polling with graceful updates
- Enhanced auth feedback with success states
- Improved sorting functionality
- Added search capabilities

## Known Issues

- Sign-out flow requires page refresh
- Some image previews may not load correctly
- Sorting transitions could be smoother
- Mobile layout needs optimization

## Upcoming Tasks

- [ ] Add timestamp checks to force Neynar refresh for stale data
- [ ] Implement background job for periodic Neynar sync
- [ ] Add Neynar webhook support for real-time updates
- [ ] Add Redis caching layer for high-traffic queries
- [ ] Fix sign-out flow
- [ ] Enhance sorting transitions
