# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ufobeep.com is a full-stack web application for UFO sighting submissions with real-time features:
- Users can submit UFO sightings with images/webcam photos
- Interactive map displaying all sightings
- Real-time notifications for nearby sightings based on user location
- Chat rooms for each sighting for community discussion
- Admin dashboard for user metrics and content management
- No mandatory user registration for submissions
- Built-in spam protection without captcha

## Architecture

**Backend (Node.js)**
- RESTful API for sighting CRUD operations
- WebSocket/Socket.IO for real-time features (notifications, chat)
- Authentication middleware supporting anonymous submissions
- File upload handling for images
- Geospatial queries for proximity notifications
- Admin API endpoints for user/content management

**Frontend (Web Client)**
- Interactive map integration (likely Leaflet or Google Maps)
- Real-time WebSocket client for notifications and chat
- Camera/file upload components for media capture
- Responsive design for mobile and desktop
- Anonymous and authenticated user flows

**Database**
- Sighting submissions with geolocation data
- User profiles and location tracking for notifications
- Chat message storage per sighting
- Admin metrics and moderation logs
- Spatial indexing for efficient proximity queries

**Key Features Architecture**
- Geospatial proximity calculations for notifications
- Real-time chat rooms per sighting using WebSocket rooms
- Image upload and processing pipeline
- Spam detection without captcha (rate limiting, content analysis)
- Admin dashboard with user metrics and content moderation

## Development Commands

Since this is a new project, establish these standard commands in package.json:

**Development:**
```bash
npm run dev          # Start development servers (backend + frontend)
npm run dev:backend  # Start backend only
npm run dev:frontend # Start frontend only
```

**Building:**
```bash
npm run build        # Build for production
npm run build:backend # Build backend only
npm run build:frontend # Build frontend only
```

**Testing:**
```bash
npm test            # Run all tests
npm run test:backend # Backend tests only
npm run test:frontend # Frontend tests only
npm run test:watch  # Run tests in watch mode
```

**Quality:**
```bash
npm run lint        # Lint all code
npm run lint:fix    # Fix linting issues
npm run typecheck   # TypeScript type checking
```

**Database:**
```bash
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed development data
npm run db:reset    # Reset and reseed database
```

## Technology Stack Recommendations

**Backend:**
- Express.js with TypeScript for API server
- Socket.IO for WebSocket connections
- PostgreSQL with PostGIS extension for geospatial data
- Prisma or TypeORM for database ORM
- Multer for file uploads
- JWT for authentication tokens
- Rate limiting middleware for spam protection

**Frontend:**
- React or Vue.js for UI components
- Socket.IO client for real-time features
- Leaflet or Mapbox for interactive maps
- Camera API integration for webcam capture
- State management (Redux/Vuex or Context API)

**Infrastructure:**
- Docker for development environment
- Environment-based configuration (.env files)
- Structured logging for debugging real-time features

## Key Implementation Considerations

**Real-time Features:**
- Use WebSocket rooms for sighting-specific chats
- Implement user location tracking for proximity notifications
- Handle connection management for mobile users

**Geospatial Functionality:**
- Store sighting coordinates with proper spatial indexing
- Implement efficient proximity queries for notifications
- Consider map clustering for dense sighting areas

**Anonymous Submissions:**
- Track submissions by IP/session for spam protection
- Allow optional user registration for enhanced features
- Implement rate limiting per IP/session

**Admin Dashboard:**
- User activity metrics and sighting analytics
- Content moderation tools for inappropriate submissions
- Spam detection and user management interfaces

**Mobile Optimization:**
- Responsive map interface for mobile devices
- Camera integration for native photo capture
- Progressive Web App (PWA) considerations

## Database Schema Considerations

**Core Entities:**
- Sightings (id, coordinates, description, timestamp, media_urls, user_id?)
- Users (id, username?, email?, last_location, notification_preferences)
- ChatMessages (id, sighting_id, user_id?, message, timestamp)
- AdminActions (moderation logs, user management actions)

**Indexes:**
- Spatial index on sighting coordinates
- Timestamp indexes for recent sightings
- User location index for proximity queries

This architecture supports scalable real-time features while maintaining simplicity for anonymous submissions and effective spam prevention.