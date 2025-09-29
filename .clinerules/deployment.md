# ManaMind Training System - Deployment and Operations Guide

## Deployment Overview

The ManaMind Training System consists of multiple components that need to be deployed and managed together. This guide covers the deployment process for the web application, mobile application, backend services, and infrastructure components.

### Deployment Components
- **Web Application**: React-based dashboard and UI
- **Mobile Application**: React Native companion app
- **Backend API**: Hono server with AI training capabilities
- **Database**: PostgreSQL/Neon database
- **AI Training Infrastructure**: Neural network training and Forge integration
- **Monitoring & Logging**: Observability stack

## Prerequisites

### Infrastructure Requirements
- **Domain Name**: Custom domain for web application
- **SSL Certificate**: HTTPS encryption for all services
- **Database**: PostgreSQL instance (Neon recommended)
- **Object Storage**: For model files and static assets
- **CDN**: Content delivery network for static assets
- **Monitoring**: Error tracking and monitoring services

### Tool Requirements
- **Node.js 18+**: Runtime environment
- **npm or yarn**: Package manager
- **Docker**: Containerization (optional)
- **Git**: Version control
- **Expo CLI**: Mobile app deployment
- **Vercel CLI**: Web app deployment (if using Vercel)

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
NEON_DATABASE_URL=postgresql://user:password@host:port/database

# Application Configuration
NODE_ENV=production
PORT=4000
APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com

# Authentication
JWT_SECRET=your-jwt-secret-key
BCRYPT_ROUNDS=12

# AI Training Configuration
AI_MODEL_STORAGE_PATH=/path/to/models
FORGE_INTEGRATION_ENABLED=true
TRAINING_MAX_MEMORY=4096 # MB

# External Services
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id

# Mobile App Configuration
EXPO_APPLE_APP_ID=com.yourcompany.manamind
EXPO_ANDROID_PACKAGE=com.yourcompany.manamind
```

## Web Application Deployment

### Build Process
```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm test

# Build for production
npm run build

# Preview build locally (optional)
npm run preview
```

### Deployment Options

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod

# Configure environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
# ... add other environment variables
```

#### Option 2: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
```

```bash
# Build Docker image
docker build -t manamind-web .

# Run container
docker run -p 4000:4000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e JWT_SECRET=$JWT_SECRET \
  manamind-web
```

#### Option 3: Traditional Server
```bash
# Upload build files to server
scp -r dist/* user@server:/path/to/web/app

# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js
```

### Post-Deployment Checks
- [ ] Web application loads correctly
- [ ] All pages are accessible
- [ ] API endpoints are responding
- [ ] Authentication is working
- [ ] Static assets are loading
- [ ] SSL certificate is valid
- [ ] Performance is acceptable

## Mobile Application Deployment

### Build Process
```bash
# Navigate to mobile app directory
cd createxyz-project/_/apps/mobile

# Install dependencies
npm install

# Run tests (if applicable)
npm test

# Build for development testing
expo start

# Build for production
expo build:android  # or expo build:ios
```

### Deployment Options

#### Option 1: Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to app stores
eas submit --platform all
```

#### Option 2: Manual Build
```bash
# Build Android APK
expo build:android -t apk

# Build iOS IPA
expo build:ios -t archive

# Download builds from Expo dashboard
# Submit to app stores manually
```

### App Store Configuration

#### Google Play Store
1. **Create Developer Account**: https://play.google.com/console
2. **Create Application**: Set up app listing and details
3. **Configure Signing**: Set up app signing keys
4. **Upload APK/AAB**: Upload built Android package
5. **Complete Store Listing**: Add screenshots, descriptions, etc.
6. **Submit for Review**: Wait for Google approval

#### Apple App Store
1. **Apple Developer Program**: https://developer.apple.com/programs/
2. **Create App ID**: Register bundle identifier
3. **Configure Certificates**: Create distribution certificates
4. **Create App Store Connect**: Set up app in App Store Connect
5. **Upload IPA**: Use Xcode or Application Loader
6. **Complete Store Listing**: Add metadata and screenshots
7. **Submit for Review**: Wait for Apple approval

### Post-Deployment Checks
- [ ] Mobile app installs correctly
- [ ] All features are working
- [ ] API integration is functional
- [ ] Push notifications are working
- [ ] Offline functionality is working
- [ ] Performance is acceptable on target devices
- [ ] App store approval is obtained

## Backend API Deployment

### Build Process
```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm test

# Build for production (if applicable)
npm run build
```

### Deployment Options

#### Option 1: Serverless Deployment
```bash
# Deploy to Vercel (if using Vercel functions)
vercel --prod

# Deploy to AWS Lambda
# Use AWS CLI or serverless framework
```

#### Option 2: Container Deployment
```dockerfile
# Dockerfile for API
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
```

```bash
# Build and deploy
docker build -t manamind-api .
docker run -p 4000:4000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e JWT_SECRET=$JWT_SECRET \
  manamind-api
```

#### Option 3: Traditional Server
```bash
# Upload files to server
rsync -avz ./ user@server:/path/to/api/

# Install dependencies on server
npm install --production

# Start with PM2
pm2 start ecosystem.config.js
```

### Database Migration
```bash
# Run database migrations
npm run migrate

# Seed initial data (if needed)
npm run seed
```

### Post-Deployment Checks
- [ ] API endpoints are responding
- [ ] Database connections are working
- [ ] Authentication is functional
- [ ] AI training endpoints are working
- [ ] Forge integration is functional
- [ ] Performance is acceptable
- [ ] Error handling is working correctly

## Database Deployment

### PostgreSQL Setup

#### Option 1: Neon (Serverless)
```bash
# Create Neon account and database
# Get connection string from Neon dashboard

# Set environment variable
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run migrations
npm run migrate
```

#### Option 2: Self-Hosted PostgreSQL
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Initialize database
sudo -u postgres initdb -D /var/lib/postgresql/data

# Start PostgreSQL service
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE manamind;
CREATE USER manamind_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE manamind TO manamind_user;
\q

# Run migrations
npm run migrate
```

### Database Configuration
```sql
-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for performance
CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_games_session_id ON games(session_id);
CREATE INDEX idx_neural_models_name ON neural_models(name);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp);
```

### Backup and Recovery
```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/manamind_$DATE.sql
gzip /backups/manamind_$DATE.sql
```

### Post-Deployment Checks
- [ ] Database is accessible
- [ ] All tables are created correctly
- [ ] Indexes are created
- [ ] Sample data can be inserted
- [ ] Queries are performing well
- [ ] Backup process is working
- [ ] Connection pooling is configured

## AI Training Infrastructure Deployment

### Model Storage Setup
```bash
# Create model storage directory
mkdir -p /storage/models

# Set permissions
chmod 755 /storage/models

# Configure environment variable
export AI_MODEL_STORAGE_PATH="/storage/models"
```

### Forge Integration Setup
```bash
# Install Forge (if using local Forge)
# Follow Forge installation instructions

# Configure Forge integration
export FORGE_PATH="/path/to/forge"
export FORGE_CONFIG_PATH="/path/to/forge/config"
```

### GPU Setup (Optional)
```bash
# Install NVIDIA drivers (if using GPU)
sudo apt-get install nvidia-driver-470

# Install CUDA toolkit
sudo apt-get install cuda-toolkit-11-4

# Verify GPU setup
nvidia-smi
```

### Post-Deployment Checks
- [ ] Model storage is accessible
- [ ] Forge integration is working
- [ ] GPU acceleration is available (if configured)
- [ ] Training jobs can be started
- [ ] Model files can be saved and loaded
- [ ] Performance is acceptable
- [ ] Resource usage is within limits

## Monitoring and Logging Deployment

### Error Tracking (Sentry)
```bash
# Install Sentry SDK
npm install @sentry/node @sentry/react

# Configure Sentry
// In your application entry point
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Application Monitoring
```bash
# Install monitoring agent (e.g., Datadog, New Relic)
npm install dd-trace

# Configure monitoring
require('dd-trace').init({
  service: 'manamind-training-system',
  env: process.env.NODE_ENV,
});
```

### Logging Setup
```javascript
// Configure structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.File({ filename: 'errors.log', level: 'error' }),
  ],
});
```

### Health Checks
```javascript
// Health check endpoint
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    database: await checkDatabase(),
    forge: await checkForgeIntegration(),
    storage: await checkStorage(),
  };
  
  return Response.json(health);
}
```

### Post-Deployment Checks
- [ ] Error tracking is receiving errors
- [ ] Monitoring data is being collected
- [ ] Logs are being written and rotated
- [ ] Health checks are accessible
- [ ] Alerts are configured and working
- [ ] Dashboard is showing metrics
- [ ] Performance is being tracked

## Security Deployment

### SSL/TLS Configuration
```bash
# Install Certbot for Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Security Headers
```javascript
// Configure security headers in your application
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  })
);
```

### Post-Deployment Checks
- [ ] SSL certificate is valid and not expired
- [ ] HTTPS is working correctly
- [ ] Security headers are set
- [ ] Firewall rules are active
- [ ] No security vulnerabilities are detected
- [ ] Authentication is secure
- [ ] Data encryption is working

## Performance Optimization Deployment

### CDN Configuration
```bash
# Configure Cloudflare CDN
# 1. Add domain to Cloudflare
# 2. Configure DNS settings
# 3. Enable caching and optimization
# 4. Configure SSL/TLS
```

### Database Optimization
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_games_created_at ON games(created_at);
CREATE INDEX CONCURRENTLY idx_training_metrics_timestamp ON training_metrics(timestamp);

-- Update PostgreSQL configuration
ALTER SYSTEM SET shared_preload_extensions = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

### Application Performance
```javascript
// Configure caching
import { cache } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### Post-Deployment Checks
- [ ] CDN is caching static assets
- [ ] Database queries are optimized
- [ ] Application response times are acceptable
- [ ] Memory usage is within limits
- [ ] CPU usage is within limits
- [ ] Page load times are acceptable
- [ ] AI training performance is optimized

## Disaster Recovery Deployment

### Backup Strategy
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/database_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/database_$DATE.sql

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/database_$DATE.sql.gz s3://your-backup-bucket/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Recovery Procedures
```bash
# Database recovery
gunzip /backups/database_20231201_120000.sql.gz
psql $DATABASE_URL < /backups/database_20231201_120000.sql

# Application recovery
# 1. Restore from backup
# 2. Run migrations
# 3. Restart services
# 4. Verify functionality
```

### High Availability Setup
```bash
# Load balancer configuration
# Use Nginx or cloud load balancer

# Database replication
# Set up PostgreSQL streaming replication

# Application redundancy
# Deploy multiple instances behind load balancer
```

### Post-Deployment Checks
- [ ] Backups are being created regularly
- [ ] Backup files can be restored
- [ ] Recovery procedures are documented
- [ ] High availability is working
- [ ] Failover procedures are tested
- [ ] Data integrity is maintained
- [ ] Recovery time objectives are met

## Deployment Checklist

### Pre-Deployment
- [ ] All tests are passing
- [ ] Code review is completed
- [ ] Documentation is updated
- [ ] Environment variables are configured
- [ ] SSL certificates are obtained
- [ ] Database migrations are prepared
- [ ] Backup is created
- [ ] Deployment window is scheduled

### Deployment
- [ ] Web application is deployed
- [ ] Mobile application is built and submitted
- [ ] Backend API is deployed
- [ ] Database migrations are run
- [ ] AI training infrastructure is set up
- [ ] Monitoring and logging are configured
- [ ] Security measures are implemented
- [ ] Performance optimizations are applied

### Post-Deployment
- [ ] All components are accessible
- [ ] Authentication is working
- [ ] API endpoints are responding
- [ ] Database connections are working
- [ ] AI training is functional
- [ ] Mobile app is working
- [ ] Monitoring data is being collected
- [ ] Performance is acceptable
- [ ] Security measures are working
- [ ] Backups are being created

### Monitoring
- [ ] Set up alerting for critical issues
- [ ] Configure dashboard for key metrics
- [ ] Set up log aggregation and analysis
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure security monitoring
- [ ] Set up automated health checks

## Troubleshooting Common Issues

### Web Application Issues
- **404 Errors**: Check routing configuration and build output
- **API Connection Issues**: Verify API URL and CORS settings
- **Static Asset Issues**: Check CDN configuration and file paths
- **Performance Issues**: Review bundle size and optimize assets

### Mobile Application Issues
- **Build Failures**: Check dependencies and Expo configuration
- **Store Rejection**: Review app store guidelines and fix issues
- **API Integration**: Verify API endpoints and authentication
- **Performance Issues**: Optimize bundle size and native modules

### Backend API Issues
- **Database Connection**: Verify connection string and credentials
- **Authentication Issues**: Check JWT configuration and secret
- **Performance Issues**: Optimize queries and add caching
- **AI Training Issues**: Verify GPU setup and model storage

### Database Issues
- **Connection Refused**: Check database service and firewall
- **Migration Failures**: Review migration files and database state
- **Performance Issues**: Add indexes and optimize queries
- **Storage Issues**: Monitor disk usage and clean up old data

### Infrastructure Issues
- **Server Overload**: Monitor resource usage and scale up
- **Network Issues**: Check firewall and network configuration
- **SSL Issues**: Verify certificate configuration and renewal
- **Monitoring Issues**: Check agent configuration and data collection

## Maintenance Procedures

### Regular Maintenance Tasks
- **Daily**: Monitor system health and performance
- **Weekly**: Review logs and address issues
- **Monthly**: Apply security updates and patches
- **Quarterly**: Review and optimize performance
- **Annually**: Review architecture and plan upgrades

### Update Procedures
```bash
# Update dependencies
npm update

# Run tests
npm test

# Deploy updates
npm run build
# ... deploy according to your deployment method
```

### Scaling Procedures
- **Vertical Scaling**: Increase server resources
- **Horizontal Scaling**: Add more instances
- **Database Scaling**: Add read replicas or sharding
- **CDN Scaling**: Configure additional edge locations

This deployment guide provides comprehensive instructions for deploying and maintaining the ManaMind Training System. For detailed development guidance, refer to the specialized documentation files in the `.clinerules/` directory.
