# Changelog

## [v1.0.0] - 2024-03-21

🎉 Initial Release of Builddit - A Reddit-like interface for Farcaster's /someone-build channel

### Features

#### Core Functionality
- 🏗️ Browse and discover build requests from /someone-build channel
- 🔄 Real-time polling with graceful updates (30-second intervals)
- 🔍 Search functionality across build requests
- 📊 Sort by Newest and Top (Day, Week, Month, All)
- ♾️ Infinite scroll for seamless browsing

#### Build Request Management
- 🛠️ "I Built This!" feature for claiming builds
- 💰 Bounty posting system with customizable:
  - Amount and currency (USDC, ETH, DEGEN)
  - Optional deadline (defaults to 2 weeks)
  - Additional description
- 🖼️ Rich media support with whitelisted image domains
- 🔗 Embedded content handling (links, images, nested casts)

#### Authentication & User Experience
- 🔐 Farcaster Auth Kit integration
- 👤 Public browsing without authentication
- ✨ Success state feedback
- 📱 Responsive design for mobile and desktop
- 🎨 Beautiful UI with purple gradient theme

#### Technical Infrastructure
- 📡 Hybrid data fetching with MongoDB and Neynar API
- 🔄 Automatic data synchronization
- 🚀 Vercel deployment
- 🗄️ MongoDB for data persistence
- 🔒 Secure environment configuration

### Tech Stack
- Frontend: Next.js 14, React 18, TailwindCSS
- Backend: Next.js API Routes, MongoDB
- Authentication: NextAuth.js, Farcaster Auth Kit
- API Integration: Neynar API

### Known Issues
- Sign-out flow requires page refresh
- Some image previews may not load correctly
- Sorting transitions could be smoother
- Mobile layout needs optimization

### Links
- Live Site: [https://someonebuild.fun](https://someonebuild.fun)
- GitHub Repository: [https://github.com/andrewjiang/builddit](https://github.com/andrewjiang/builddit)
- Farcaster Channel: [/someone-build](https://warpcast.com/~/channel/someone-build) 