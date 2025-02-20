# Builddit

A Reddit-like interface for the Farcaster `/someone-build` channel, where users can discover and claim build requests from the Farcaster community.

## Overview

Builddit provides a streamlined interface for browsing and interacting with build requests posted to Farcaster's `/someone-build` channel. Users can browse build requests without authentication, and Farcaster users can claim builds they've completed through Warpcast integration.

## Features

### MVP Features
- [x] Browse build requests from `/someone-build` channel
  - [x] View text posts with author information
  - [x] Sort by Newest and Top
  - [x] Periodic polling for new posts (5-minute intervals)
- [x] Authentication
  - [x] Sign in with Farcaster (Auth Kit integration)
  - [x] Public browsing without authentication
- [ ] Build Claims
  - [ ] Authenticated users can claim builds
  - [ ] Claims posted as quote casts on Farcaster
  - [ ] Multiple claims per build request
  - [ ] Automatic tagging of original poster (@ok)

### Backlog Features
- [ ] Advanced Sorting
  - [ ] Trending/Hot posts
  - [ ] Smart filtering
  - [ ] Search functionality
- [ ] Token Rewards System
- [ ] Real-time updates
- [ ] Comment viewing/threading
- [ ] Notifications system

## Technical Architecture

### Tech Stack
- Frontend: Next.js with TypeScript
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
  fid: number;              // Farcaster ID
  username: string;         // Farcaster username
  displayName: string;      // Display name
  pfp: {
    url: string;           // Profile picture URL
    verified: boolean;     // Profile picture verification status
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
  hash: string;              // Unique identifier (Farcaster cast hash)
  text: string;             // Post content
  timestamp: string;        // Creation timestamp
  author: {
    fid: number;           // Farcaster ID
    username: string;      // Farcaster username
    display_name: string;  // Display name
    pfp_url: string;      // Profile picture URL
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
  id: string;              // Unique identifier
  castId: string;          // Farcaster quote cast ID
  buildRequestId: string;  // Reference to original build request
  author: {
    fid: string;          // Farcaster ID
    username: string;     // Farcaster username
  };
  description: string;     // Build description
  url: string;            // Project URL
  timestamp: Date;        // Claim timestamp
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

[To be added: Deployment instructions]

## Contributing

[To be added: Contribution guidelines]

## Progress Tracking

### Current Sprint
- [x] Project setup
- [x] Auth Kit integration
- [x] Basic build request listing
- [x] Zod schema validation
- [x] Neynar API integration
- [ ] Build claims implementation

### Completed
- [x] Initial project planning
- [x] Technical specification
- [x] Authentication flow
- [x] Data fetching and caching
- [x] Real-time polling
- [x] Error handling and validation

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
- [x] Implement user data storage
  - [x] Store Farcaster user profiles
  - [x] Update user data during build request syncs
  - [x] Track user engagement metrics
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