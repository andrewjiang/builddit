# Builddit

A Reddit-like interface for the Farcaster `/someone-build` channel, where users can discover and claim build requests from the Farcaster community.

## Overview

Builddit provides a streamlined interface for browsing and interacting with build requests posted to Farcaster's `/someone-build` channel. Users can browse build requests without authentication, and Farcaster users can claim builds they've completed through Warpcast integration.

## Features

### MVP Features
- [ ] Browse build requests from `/someone-build` channel
  - [ ] View text posts with author information
  - [ ] Sort by Newest and Top
  - [ ] Periodic polling for new posts (5-minute intervals)
- [ ] Authentication
  - [ ] Sign in with Farcaster (Auth Kit integration)
  - [ ] Public browsing without authentication
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
- Authentication: Farcaster Auth Kit
- Hosting: Digital Ocean
- Testing: Jest + React Testing Library

### Data Models

#### Build Request
```typescript
interface BuildRequest {
  id: string;                // Unique identifier
  castId: string;           // Original Farcaster cast ID
  author: {
    fid: string;            // Farcaster ID
    username: string;       // Farcaster username
  };
  content: string;          // Post content
  timestamp: Date;          // Creation timestamp
  claims: Claim[];          // Array of claims
  metrics: {
    likes: number;
    recasts: number;
  };
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
- [ ] Project setup
- [ ] Auth Kit integration
- [ ] Basic build request listing

### Completed
- [x] Initial project planning
- [x] Technical specification