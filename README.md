# UFOBeep.com - UFO Sighting Platform 🛸

A full-stack web platform for reporting, tracking, and discussing UFO sightings with real-time communication, interactive maps, and community features.

## 🚀 Features

### Core Functionality
- **Interactive Map**: Visualize UFO sightings with custom markers and geospatial clustering
- **Sighting Submission**: Submit detailed UFO reports with photos, videos, and location data
- **Real-time Chat**: Community discussions for each sighting with WebSocket support
- **Geolocation Services**: Location-based notifications for nearby sightings
- **Media Upload**: Camera integration for direct photo capture and file uploads
- **Anonymous Support**: Submit sightings without registration while supporting user accounts

### Administrative Features
- **Admin Dashboard**: Comprehensive platform management and analytics
- **Content Moderation**: Tools for verifying, hiding, and managing user-generated content
- **User Management**: Search, filter, and moderate user accounts
- **Spam Protection**: Rate limiting and content analysis without captchas
- **Audit Logging**: Complete tracking of all administrative actions

### Technical Features
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Real-time Updates**: Socket.IO for instant notifications and chat
- **Geospatial Queries**: PostGIS integration for proximity-based features
- **File Management**: Secure image and video upload system
- **Authentication**: JWT-based auth supporting both anonymous and registered users

## 🛠 Technology Stack

### Backend
- **Node.js** with **Express.js** and **TypeScript**
- **PostgreSQL** with **PostGIS** extension for geospatial data
- **Prisma ORM** for database management and migrations
- **Socket.IO** for real-time WebSocket communication
- **Redis** for caching and session management
- **JWT** for authentication and authorization
- **Multer** for file upload handling

### Frontend
- **React 18** with **TypeScript** and **Vite** build system
- **Tailwind CSS** with custom UFO-themed design system
- **React Router** for client-side routing
- **React Query** for API state management and caching
- **React Leaflet** for interactive maps with OpenStreetMap
- **Socket.IO Client** for real-time features

### DevOps & Deployment
- **Docker** and **Docker Compose** for containerization
- **Nginx** for reverse proxy and static file serving
- **PostgreSQL** with **PostGIS** for production database
- **Redis** for production caching
- Automated deployment scripts with health checks

## 📋 Prerequisites

- **Docker** (version 20.0 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Node.js** (version 18 or higher) - for local development
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ufobeep
```

### 2. Environment Setup
The deployment script will create a default `.env` file on first run. Update these values:

```bash
# Database Configuration
POSTGRES_DB=ufobeep
POSTGRES_USER=ufobeep_user
POSTGRES_PASSWORD=your_secure_password

# Application Secrets (CHANGE THESE!)
JWT_SECRET=your_super_secure_jwt_secret
ADMIN_PASSWORD=your_admin_password

# Optional: Google Maps API for enhanced geolocation
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Deploy the Platform
```bash
# Make the deployment script executable
chmod +x deploy.sh

# Start the platform (creates .env file if missing)
./deploy.sh start

# Or perform a fresh deployment
./deploy.sh fresh
```

### 4. Access the Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Admin Dashboard**: http://localhost:3000/admin

## 🔧 Deployment Commands

The `deploy.sh` script provides comprehensive deployment management:

```bash
# Production Deployment
./deploy.sh start          # Start all services in production mode
./deploy.sh status         # Check service status
./deploy.sh health         # Comprehensive health check

# Development Mode
./deploy.sh dev            # Start in development mode with hot reloading

# Management
./deploy.sh stop           # Stop all services
./deploy.sh restart        # Restart all services
./deploy.sh fresh          # Fresh deployment (removes data)

# Maintenance
./deploy.sh logs           # View logs
./deploy.sh logs backend   # View specific service logs
./deploy.sh backup         # Create database backup
./deploy.sh migrate        # Run database migrations
./deploy.sh build          # Build application
./deploy.sh help           # Show help
```

## 🏗 Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/Nginx) │◄──►│ (Node.js/Express)│◄──►│ (PostgreSQL)   │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Cache)       │
                       │   Port: 6379    │
                       └─────────────────┘
```

### Database Schema
- **Users**: Authentication and profile data
- **Sightings**: UFO report data with geospatial coordinates
- **ChatMessages**: Real-time chat for each sighting
- **AdminActions**: Audit log for administrative activities
- **UserSessions**: Session tracking for anonymous users

### API Endpoints
- `GET /api/sightings` - Retrieve sightings with geospatial filtering
- `POST /api/sightings` - Submit new UFO sighting
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/admin/stats` - Admin dashboard statistics
- `POST /api/upload` - File upload for media
- **Socket.IO Events**: Real-time chat and notifications

## 🔒 Security Features

- **Authentication**: JWT-based with support for anonymous users
- **Input Validation**: Comprehensive server-side validation
- **Rate Limiting**: API endpoint protection against abuse
- **File Upload Security**: Type validation and size limits
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CORS Configuration**: Proper cross-origin request handling

## 🌐 Production Deployment

### Environment Variables
Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
# Edit .env with your actual values
```

Ensure these are properly configured in production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-production-jwt-secret
ADMIN_PASSWORD=secure-admin-password
POSTGRES_PASSWORD=secure-database-password
```

### SSL/HTTPS Setup
For production deployments, configure SSL certificates:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update nginx configuration with SSL settings
3. Redirect HTTP to HTTPS

### Monitoring and Logging
- Application logs are stored in `./logs/` directory
- Database and Redis have persistent storage volumes
- Health checks are configured for all services
- Nginx access logs for traffic monitoring

## 🧪 Development

### Local Development Setup
```bash
# Backend development
npm install
npm run dev

# Frontend development (in separate terminal)
cd frontend
npm install
npm run dev
```

### Database Management
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed

# View database
npx prisma studio
```

### Testing
```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend
npm test
```

## 📊 Admin Dashboard

The admin interface provides:

1. **Dashboard**: Platform statistics and metrics
2. **User Management**: Search, filter, and moderate users
3. **Sighting Management**: Verify and moderate UFO reports
4. **Reported Content**: Handle community-flagged content
5. **Action Log**: Audit trail of all admin activities

Access the admin dashboard at `/admin` with admin credentials.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Sightings API
```typescript
// GET /api/sightings
interface SightingQuery {
  latitude?: number;
  longitude?: number;
  radius?: number;
  verified?: boolean;
  recent?: boolean;
  page?: number;
  limit?: number;
}

// POST /api/sightings
interface SightingSubmission {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  sightingDate: string;
  witnesses: number;
  duration?: number;
  weather?: string;
  visibility?: string;
}
```

### WebSocket Events
```typescript
// Chat events
socket.emit('join-sighting', { sightingId: string })
socket.emit('send-message', { sightingId: string, message: string })
socket.on('new-message', (message: ChatMessage) => void)

// Notification events
socket.emit('location-update', { latitude: number, longitude: number })
socket.on('nearby-sighting', (sighting: Sighting) => void)
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
./deploy.sh stop
./deploy.sh start
```

**Database connection issues:**
```bash
./deploy.sh logs postgres
./deploy.sh restart
```

**Frontend build errors:**
```bash
./deploy.sh build
./deploy.sh logs frontend
```

**Permission denied errors:**
```bash
chmod +x deploy.sh
sudo chown -R $USER:$USER ./
```

### Health Checks
All services include health checks accessible via:
- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000/health
- Database: Automatic via Docker health checks

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review service logs using `./deploy.sh logs`
3. Ensure all environment variables are properly configured
4. Verify Docker and Docker Compose are up to date

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenStreetMap for map data
- PostGIS for geospatial database capabilities  
- The UFO community for inspiration and requirements
- All contributors who help make this platform better

---

**Happy UFO hunting! 🛸👽**