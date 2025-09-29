# ManaMind Training System

A sophisticated Magic: The Gathering (MTG) AI training platform that combines neural networks, rule-based bots, and real-time simulation. This system features both web and mobile applications with a strong focus on AI development and training.

## 🚀 Quick Start

Choose your preferred setup method:

- **[Option 1: Regular Local Setup](#option-1-regular-local-setup)** - Run natively on your machine
- **[Option 2: Docker Compose Setup](#option-2-docker-compose-setup)** - Containerized deployment

## 📋 Project Overview

### Key Features
- **AI Training System**: Neural networks, rule-based bots, and hybrid training approaches
- **Real-time Dashboard**: Live training metrics, performance visualization, and session controls
- **Cross-platform**: Web application + React Native mobile companion app
- **Forge Integration**: Training against real MTG opponents for realistic scenarios
- **Live Demo**: Working bot vs bot simulations with database storage
- **Model Management**: Neural network versioning, evaluation, and deployment

### Tech Stack
- **Frontend**: React 18, React Router v7, TypeScript, Tailwind CSS
- **Backend**: Hono server, Node.js, PostgreSQL/Neon
- **Mobile**: Expo React Native, TypeScript
- **AI/ML**: TensorFlow.js, Neural Networks, AlphaZero algorithm
- **Build Tools**: Vite, Expo CLI, Docker

## 🛠️ Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm** or **yarn**: Package manager
- **Git**: Version control
- **Database**: PostgreSQL instance or Neon account

### Optional Tools
- **Docker**: For containerized setup (Option 2)
- **Docker Compose**: For multi-container orchestration
- **Expo CLI**: For mobile app development
- **PostgreSQL**: Local database development

## ⚙️ Option 1: Regular Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/anchapin/manamind-anything.git
cd manamind-anything
```

### 2. Install Dependencies

#### Web Application
```bash
# Install root dependencies
npm install

# Verify installation
npm run typecheck  # Should complete without errors
```

#### Mobile Application
```bash
# Navigate to mobile app directory
cd createxyz-project/_/apps/mobile

# Install mobile dependencies
npm install

# Apply patches (required for Expo compatibility)
npm run postinstall

# Navigate back to project root
cd ../../..
```

### 3. Environment Configuration

Create environment files for both applications:

#### Web Application (.env)
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
```

Required environment variables:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/manamind
NEON_DATABASE_URL=postgresql://username:password@localhost:5432/manamind

# Application Configuration
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000
API_URL=http://localhost:4000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
BCRYPT_ROUNDS=12

# AI Training Configuration
AI_MODEL_STORAGE_PATH=./storage/models
FORGE_INTEGRATION_ENABLED=true
TRAINING_MAX_MEMORY=4096

# External Services (Optional)
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

#### Mobile Application (createxyz-project/_/apps/mobile/.env)
```bash
# Create mobile environment file
touch createxyz-project/_/apps/mobile/.env

# Add mobile-specific configuration
```

Mobile environment variables:
```env
# Expo Configuration
EXPO_APPLE_APP_ID=com.yourcompany.manamind
EXPO_ANDROID_PACKAGE=com.yourcompany.manamind

# API Configuration
API_URL=http://localhost:4000
```

### 4. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (if not already installed)
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS (with Homebrew):
brew install postgresql

# Windows: Download from https://www.postgresql.org/download/

# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql    # macOS

# Create database and user
sudo -u postgres psql
CREATE DATABASE manamind;
CREATE USER manamind_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE manamind TO manamind_user;
\q

# Update your .env file with the database connection string
```

#### Option B: Neon (Serverless PostgreSQL)
```bash
# Sign up at https://neon.tech/
# Create a new project
# Copy the connection string to your .env file
```

### 5. Run Database Migrations

The application uses automatic schema creation, but you can verify the database connection:

```bash
# Test database connection
node -e "
import('./src/app/api/utils/sql.js').then(({ default: sql }) => {
  sql\`SELECT version()\`.then(result => {
    console.log('Database connected successfully:', result[0]);
    process.exit(0);
  }).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
});
"
```

### 6. Start the Applications

#### Web Application
```bash
# Start the development server
npm run dev

# The web application will be available at:
# http://localhost:4000
```

#### Mobile Application
```bash
# Navigate to mobile app directory
cd createxyz-project/_/apps/mobile

# Start Expo development server
expo start

# Choose your preferred platform:
# - Press 'a' to open on Android emulator/device
# - Press 'i' to open on iOS simulator
# - Press 'w' to open in web browser
# - Scan QR code with Expo Go app on mobile device
```

### 7. Verify the Setup

1. **Web Application**: Open http://localhost:4000 in your browser
2. **Mobile Application**: Open Expo Go and scan the QR code, or use emulator/simulator
3. **Demo Page**: Visit http://localhost:4000/demo to test the AI bot functionality
4. **API Endpoints**: Test API endpoints at http://localhost:4000/api

## 🐳 Option 2: Docker Compose Setup

### 1. Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: To clone the repository

### 2. Clone the Repository

```bash
git clone https://github.com/anchapin/manamind-anything.git
cd manamind-anything
```

### 3. Create Docker Compose File

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: manamind-postgres
    environment:
      POSTGRES_DB: manamind
      POSTGRES_USER: manamind_user
      POSTGRES_PASSWORD: manamind_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - manamind-network

  # Redis (for caching and sessions)
  redis:
    image: redis:7-alpine
    container_name: manamind-redis
    ports:
      - "6379:6379"
    networks:
      - manamind-network

  # Web Application
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: manamind-web
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://manamind_user:manamind_password@postgres:5432/manamind
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key-here
    depends_on:
      - postgres
      - redis
    networks:
      - manamind-network
    volumes:
      - .:/app
      - /app/node_modules
      - ./storage/models:/app/storage/models

  # Mobile Development Server (Optional)
  mobile:
    build:
      context: createxyz-project/_/apps/mobile
      dockerfile: Dockerfile
    container_name: manamind-mobile
    ports:
      - "8081:8081"  # Expo Metro bundler
    environment:
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
      - API_URL=http://web:4000
    depends_on:
      - web
    networks:
      - manamind-network
    volumes:
      - ./createxyz-project/_/apps/mobile:/app
      - /app/node_modules

volumes:
  postgres_data:

networks:
  manamind-network:
    driver: bridge
```

### 4. Create Dockerfile for Web Application

Create `Dockerfile` in the project root:

```dockerfile
# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create storage directory for AI models
RUN mkdir -p storage/models

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "dev"]
```

### 5. Create Dockerfile for Mobile Application

Create `createxyz-project/_/apps/mobile/Dockerfile`:

```dockerfile
# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Apply patches
RUN npm run postinstall

# Copy source code
COPY . .

# Expose port for Expo Metro bundler
EXPOSE 8081

# Start Expo development server
CMD ["expo", "start"]
```

### 6. Create .env.docker File

```bash
# Create Docker environment file
touch .env.docker
```

Add to `.env.docker`:
```env
# Database Configuration
DATABASE_URL=postgresql://manamind_user:manamind_password@postgres:5432/manamind
REDIS_URL=redis://redis:6379

# Application Configuration
NODE_ENV=development
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-here

# AI Training Configuration
AI_MODEL_STORAGE_PATH=/app/storage/models
FORGE_INTEGRATION_ENABLED=true
TRAINING_MAX_MEMORY=4096
```

### 7. Build and Run Containers

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 8. Access the Applications

- **Web Application**: http://localhost:4000
- **Mobile Development**: http://localhost:8081 (Expo Metro bundler)
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 9. View Container Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f web
docker-compose logs -f mobile
docker-compose logs -f postgres
```

### 10. Stop the Containers

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🔧 Development Workflow

### Available Scripts

#### Web Application
```bash
npm run dev          # Start development server (port 4000)
npm run typecheck    # TypeScript type checking
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests (if configured)
```

#### Mobile Application
```bash
cd createxyz-project/_/apps/mobile

expo start           # Start Expo development server
expo build:android   # Build Android APK
expo build:ios       # Build iOS IPA
expo publish         # Publish to Expo
```

### Testing the AI Bot

1. **Via Demo Page**: Visit http://localhost:4000/demo
2. **Via API**: Use the following curl command:

```bash
curl -X POST http://localhost:4000/api/bot/simple \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_decision",
    "config": {
      "life": 18,
      "mana": 4,
      "cardsInHand": 5,
      "turn": 4,
      "opponentLife": 15,
      "opponentCreatures": 1
    }
  }'
```

### Database Operations

```bash
# Access PostgreSQL container (Docker setup)
docker-compose exec postgres psql -U manamind_user -d manamind

# Access local PostgreSQL (regular setup)
psql -h localhost -U manamind_user -d manamind

# View tables
\dt

# View recent games
SELECT * FROM games ORDER BY created_at DESC LIMIT 10;
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check if port 4000 is in use
netstat -an | grep 4000  # Linux/macOS
netstat -ano | findstr :4000  # Windows

# Kill process using the port
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

#### Database Connection Issues
```bash
# Test database connection
node -e "
import('./src/app/api/utils/sql.js').then(({ default: sql }) => {
  sql\`SELECT NOW()\`.then(result => {
    console.log('Database time:', result[0]);
    process.exit(0);
  }).catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
});
"
```

#### Docker Issues
```bash
# Clean up Docker system
docker system prune -a

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -aq)
```

#### Mobile App Issues
```bash
# Clear Expo cache
expo start --clear

# Reset Metro bundler
expo start --reset

# Check Expo CLI version
expo --version
```

#### Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For mobile app
cd createxyz-project/_/apps/mobile
rm -rf node_modules package-lock.json
npm install
npm run postinstall
```

### Performance Issues

#### High Memory Usage
- Reduce `TRAINING_MAX_MEMORY` in environment variables
- Monitor AI training sessions
- Use Docker resource limits

#### Slow Development Server
- Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096" npm run dev`
- Use Vite's optimize dependencies feature
- Disable unnecessary extensions in IDE

## 📁 Project Structure

```
├── src/                              # Web application source
│   ├── app/                         # React Router v7 app structure
│   │   ├── api/                     # API routes
│   │   ├── demo/                    # Live demo page
│   │   ├── neural-forge/            # Advanced training interface
│   │   └── account/                 # User authentication
│   ├── components/                  # React components
│   │   └── dashboard/               # Dashboard components
│   └── utils/                       # Utility functions
├── createxyz-project/               # Mobile application
│   └── _/apps/mobile/                # Expo React Native app
├── plugins/                         # Vite build plugins
├── test/                            # Test files
├── .clinerules/                      # Development documentation
├── docker-compose.yml              # Docker Compose configuration
├── Dockerfile                       # Web application Dockerfile
├── package.json                     # Web application dependencies
└── README.md                        # This file
```

### Key API Endpoints

- **Bot API**: `/api/bot/simple` - Rule-based bot decisions
- **Training API**: `/api/training/control` - Training session management
- **Models API**: `/api/models/neural` - Neural model management
- **Forge API**: `/api/forge/*` - External opponent integration
- **System API**: `/api/system/*` - System metrics and health

## 🧪 Testing and Verification

### Health Check Endpoints

```bash
# Web application health
curl http://localhost:4000/api/system/health

# System metrics
curl http://localhost:4000/api/system/metrics

# Bot decision test
curl -X POST http://localhost:4000/api/bot/simple \
  -H "Content-Type: application/json" \
  -d '{"action": "get_decision", "config": {"life": 20, "mana": 5}}'
```

### Demo Verification

1. Open http://localhost:4000/demo
2. Click "Simulate Game" to test AI bot functionality
3. Verify that game results are stored and displayed
4. Check system metrics in real-time
5. Test bot decision making with different game states

## 📚 Additional Resources

### Documentation
- **[Development Guide](.clinerules/development.md)** - Development workflow and practices
- **[Architecture Overview](.clinerules/architecture.md)** - Technical architecture details
- **[AI Training Focus](.clinerules/ai-training-focus.md)** - AI development guide
- **[Deployment Guide](.clinerules/deployment.md)** - Production deployment instructions

### Community and Support
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and API reference
- **Demo**: Live demonstration of AI capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Team** for the excellent React framework and ecosystem
- **Expo Team** for the amazing React Native development platform
- **Neon** for the serverless PostgreSQL solution
- **TensorFlow.js** for bringing machine learning to the browser

---

**Note**: This is a sophisticated AI training system. Ensure you have adequate system resources (RAM, CPU) for optimal performance, especially when running AI training sessions.
