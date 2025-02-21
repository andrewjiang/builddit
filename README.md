# Builddit

A Reddit-like interface for the Farcaster `/someone-build` channel, where users can discover and claim build requests from the Farcaster community.

## Overview

Builddit provides a streamlined interface for browsing and interacting with build requests posted to Farcaster's `/someone-build` channel. Users can browse build requests without authentication, and Farcaster users can claim builds they've completed through Warpcast integration.

## Features

### Completed Features

- [x] Browse build requests from `/someone-build` channel
  - [x] View text posts with author information
  - [x] Sort by Newest and Top (Day, Week, Month, All)
  - [x] Real-time polling with graceful updates
  - [x] Search functionality
- [x] Authentication
  - [x] Sign in with Farcaster (Auth Kit integration)
  - [x] Public browsing without authentication
  - [x] Success state feedback
- [x] Image Handling
  - [x] Whitelisted domains support
  - [x] Safe image component
  - [x] Fallback for non-whitelisted sources
- [x] Data Management
  - [x] MongoDB integration
  - [x] Neynar API integration
  - [x] Efficient polling and caching
  - [x] User profile syncing
- [x] Build Claims
  - [x] Claims posted as quote casts
  - [x] Multiple claims per build request
  - [x] Automatic tagging of original poster

### In Progress

- [ ] Authentication Improvements
  - [x] Session persistence across refreshes
  - [x] Better error handling
  - [x] Automatic reconnection
  - [ ] Smooth sign-out flow
- [ ] Deployment & CI/CD
  - [ ] Setup Digital Ocean app platform
  - [ ] Configure custom domain and SSL
  - [ ] Setup Github Actions workflow
  - [ ] Add deployment documentation

### Backlog Features

- [ ] Advanced Sorting
  - [ ] Trending/Hot posts algorithm
  - [ ] Smart filtering
  - [ ] Advanced search options
- [ ] User Experience
  - [x] Loading states and animations
  - [x] Error boundaries and recovery
  - [x] Responsive design improvements
  - [ ] Smoother state transitions
- [ ] Social Features
  - [ ] Comment viewing/threading
  - [ ] User profiles and activity
  - [ ] Build request collections
- [ ] Platform Features
  - [ ] Token rewards system
  - [ ] Notifications system
  - [ ] Analytics dashboard

## Technical Architecture

### Tech Stack

- Frontend: Next.js 14 with TypeScript
- Backend: Node.js with TypeScript
- Database: MongoDB
  - Collections: BuildRequest, FarcasterUser, EngagementScore
- Authentication: Farcaster Auth Kit
- Hosting: Digital Ocean
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

### API Endpoints

#### Public Endpoints

- `GET /api/builds` - List build requests
  - Query params: sort (newest/top), page, limit
- `GET /api/builds/:id` - Get specific build request
- `GET /api/builds/:id/claims` - List claims for a build

#### Authenticated Endpoints

- `POST /api/builds/:id/claims` - Submit a new claim
- `GET /api/user/profile` - Get authenticated user profile

## Development Setup

[To be added: Setup instructions]

## Testing Strategy

### Unit Tests

- Components: React Testing Library
- API Routes: Jest
- Data Models: Jest
- Utility Functions: Jest

### Integration Tests

- API Integration
- Authentication Flow
- Build Claim Flow

### Mocking Strategy

- Farcaster API responses
- Authentication states
- Database operations

## Deployment

### Digital Ocean Setup

1. Create a new app on Digital Ocean App Platform
2. Configure environment variables:
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

### Domain Configuration

1. Register domain (if not already owned)
2. Configure DNS settings in Digital Ocean
3. Setup SSL certificate
4. Configure domain in app settings

### CI/CD Pipeline

1. Github Actions workflow:
   ```yaml
   - Build and test
   - Lint check
   - Type check
   - Deploy to staging
   - Deploy to production
   ```
2. Environment specific configurations
3. Automated deployment on main branch
4. Manual approval for production deployments

### Monitoring

1. Setup application monitoring
2. Configure error tracking
3. Setup performance monitoring
4. Configure alerts

## Current Sprint

- [ ] Setup Digital Ocean deployment
- [ ] Configure domain and SSL
- [ ] Implement CI/CD pipeline
- [ ] Add monitoring and alerts
- [ ] Enhance sorting transitions
- [ ] Fix sign-out flow
- [ ] Add admin controls for polling

## Contributing

[To be added: Contribution guidelines]

## Progress Tracking

### Current Sprint

- [ ] Setup Digital Ocean deployment
- [ ] Configure domain and SSL
- [ ] Implement CI/CD pipeline
- [ ] Add monitoring and alerts
- [ ] Enhance sorting transitions
- [ ] Fix sign-out flow
- [ ] Add admin controls for polling

### Completed

- [x] Initial project planning
- [x] Technical specification
- [x] Authentication flow
- [x] Data fetching and caching
- [x] Real-time polling
- [x] Error handling and validation
- [x] Authentication persistence
- [x] Loading states
- [x] Responsive design
- [x] FID handling

## Recent Updates

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

### Data Synchronization & Polling

- [x] Fix Neynar API client method names to match SDK v2.13.1
  - [x] Add type definitions for Neynar SDK methods
  - [x] Implement rate limiting and error handling
  - [x] Add data transformation layer
- [x] Set up automatic polling service startup with app
  - [x] Create app initialization hook
  - [x] Add graceful shutdown handling
  - [x] Implement health checks
- [x] Add monitoring and logging for polling service
  - [x] Track successful/failed API calls
  - [x] Monitor rate limits
  - [x] Log sync statistics
  - [x] Set up error alerting
- [ ] Create admin API endpoints for polling control
  - [ ] Start/stop polling
  - [ ] Adjust polling interval
  - [ ] Force immediate sync
  - [ ] View sync status and metrics

### Caching Improvements

- [x] Implement in-memory caching with node-cache
  - [x] Add cache service singleton
  - [x] Set up TTL for different data types
  - [x] Add cache invalidation
- [ ] Add Redis for distributed caching
  - [ ] Set up Redis connection
  - [ ] Migrate from node-cache
  - [ ] Add cache replication
- [ ] Add cache warming on app startup
- [ ] Implement advanced cache strategies
  - [ ] Stale-while-revalidate
  - [ ] Cache prefetching
  - [ ] Cache versioning

### Database Optimization

- [x] Set up MongoDB schemas and indexes
  - [x] FarcasterUser model with FID indexing
  - [x] BuildRequest model with compound indexes
  - [x] EngagementScore model for analytics
- [ ] Add database connection pooling
- [ ] Implement query optimization
  - [ ] Add query analysis
  - [ ] Optimize index usage
  - [ ] Implement data aggregation
- [ ] Set up database monitoring
  - [ ] Monitor query performance
  - [ ] Track connection pool usage
  - [ ] Set up slow query logging

### Monitoring & Logging

- [ ] Set up structured logging
  - [ ] Add request/response logging
  - [ ] Implement error tracking
  - [ ] Add performance metrics
- [ ] Create monitoring dashboard
  - [ ] API endpoint metrics
  - [ ] Cache performance
  - [ ] Database metrics
  - [ ] System health

### Authentication Implementation Details

The project uses a combination of Farcaster Auth Kit and Next-Auth to provide a seamless authentication experience:

1. **Farcaster Auth Kit**: Handles the initial Farcaster authentication flow

   - User signs in with their Farcaster account
   - Provides access to Farcaster-specific user data
   - Manages the connection to Farcaster's authentication system

2. **Next-Auth Integration**: Manages session persistence

   - JWT-based session storage
   - 7-day session duration
   - Secure credential handling
   - Automatic token refresh

3. **State Synchronization**:

   - Farcaster Auth Kit state is synchronized with Next-Auth
   - User data is stored in both systems
   - Seamless state recovery on page refresh

4. **Implementation Files**:
   - `app/api/auth/[...nextauth]/route.ts`: Next-Auth configuration and API routes
   - `components/Providers.tsx`: Auth providers setup
   - `components/AuthButton.tsx`: Authentication UI and state management
   - `types/next-auth.d.ts`: TypeScript definitions for auth types
