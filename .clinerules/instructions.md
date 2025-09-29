# ManaMind Training System - Cline Instructions

## Project Overview

**ManaMind Training System** is a sophisticated Magic: The Gathering (MTG) AI training platform that combines neural networks, rule-based bots, and real-time simulation. This project features a web application with a strong focus on AI development and training.

### Quick Identity
- **Project Name**: ManaMind Training System
- **Primary Focus**: MTG AI training and real-time simulation
- **Key Components**: Web dashboard, AI training system, Forge integration
- **Tech Stack**: React 18, React Router v7, TypeScript, Expo/React Native, Hono server

### Core Features
- **AI Training**: Neural networks, rule-based bots, hybrid training approaches
- **Real-time Dashboard**: Live training metrics, performance visualization
- **Cross-platform**: Web application with React Native Web support
- **Forge Integration**: Training against real MTG opponents
- **Live Demo**: Working bot vs bot simulations with database storage

## Quick Start for AI Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (for web development)
- Database access (PostgreSQL/Neon)

### Initial Setup
```bash
# Install web app dependencies
npm install

# Install web app dependencies
cd createxyz-project/_/apps/web && npm install

# Start development servers
npm run dev                    # Web app (port 4000)
cd createxyz-project/_/apps/web && expo start     # Web app
```

### Key AI Development Files
```
src/app/api/bot/simple/route.js          # Rule-based bot implementation
src/app/api/training/                    # Training control and status
src/app/api/models/neural/route.js       # Neural model management
src/app/api/forge/                       # Forge integration
src/components/dashboard/TrainingDashboard.tsx  # Training UI
src/components/dashboard/ModelManagement.tsx     # Model management
src/components/dashboard/ForgeManager.tsx       # Forge control
```

## Development Commands

### Web Application
```bash
npm run dev          # Start development server (port 4000)
npm run typecheck    # TypeScript type checking
```

### Web Application
```bash
cd createxyz-project/_/apps/web
expo start           # Start Expo development server
expo build:web       # Build for web
```

### Testing
```bash
npm test             # Run Vitest tests
npm run test:ui      # Run tests with UI (if configured)
```

## Project Structure Highlights

```
├── src/                              # Web application source
│   ├── app/                         # React Router v7 app structure
│   │   ├── api/                     # API routes
│   │   │   ├── bot/                 # Bot-related APIs
│   │   │   ├── training/            # Training control APIs
│   │   │   ├── models/              # Model management APIs
│   │   │   ├── forge/               # Forge integration APIs
│   │   │   └── system/              # System metrics APIs
│   │   ├── demo/                    # Live demo page
│   │   ├── neural-forge/            # Advanced training interface
│   │   └── account/                 # User authentication
│   ├── components/                  # React components
│   │   └── dashboard/               # Dashboard components
│   └── utils/                       # Utility functions
├── createxyz-project/               # Web application
│   └── _/apps/web/                   # Expo React app
├── plugins/                         # Vite build plugins
└── test/                            # Test files
```

## AI Training Focus Areas

### 1. Simple Bot Development
- **Location**: `src/app/api/bot/simple/route.js`
- **Purpose**: Rule-based MTG bot for proof-of-concept and testing
- **Key Features**: Turn-based decision making, game state management, simulation

### 2. Neural Network Training
- **Location**: `src/app/api/training/`, `src/app/api/models/`
- **Purpose**: AlphaZero-style self-play training system
- **Key Features**: Model training, performance tracking, session management

### 3. Forge Integration
- **Location**: `src/app/api/forge/`, `src/components/dashboard/ForgeManager.tsx`
- **Purpose**: Integration with external MTG opponents for realistic training
- **Key Features**: Real-time game control, opponent management, hybrid training

### 4. Training Dashboard
- **Location**: `src/components/dashboard/TrainingDashboard.tsx`
- **Purpose**: Real-time visualization of training progress and metrics
- **Key Features**: Live metrics, performance charts, session controls

## Development Workflow

### Adding New AI Features
1. **Bot Development**: Start with simple bot logic, test with demo page
2. **API Integration**: Create or modify API routes in `src/app/api/`
3. **UI Components**: Update or create dashboard components
4. **Testing**: Write unit tests for AI logic, integration tests for APIs
5. **Documentation**: Update relevant documentation files

### Database Operations
- **Schema**: Games, training sessions, models, metrics
- **Migrations**: Handle schema changes carefully
- **Performance**: Optimize queries for training data

### Code Standards
- **TypeScript**: Use strict typing for all AI-related code
- **Components**: Follow React patterns with proper TypeScript interfaces
- **APIs**: RESTful design with consistent error handling
- **Testing**: Maintain test coverage for AI logic and critical paths

## Common Issues and Solutions

### Development Server Issues
- **Port conflicts**: Ensure port 4000 is available for web app
- **Hot reload**: Vite HMR may need manual restart for some changes
- **Mobile app**: Clear Expo cache if build issues occur

### AI Training Issues
- **Training sessions**: Monitor logs for session management problems
- **Model performance**: Check training metrics and data quality
- **Forge integration**: Verify external connections and game state

### Database Issues
- **Connection**: Verify database configuration and connectivity
- **Performance**: Optimize queries for large training datasets
- **Schema**: Handle migrations carefully to avoid data loss

## Next Steps

For detailed AI training development guidance, see:
- **`.clinerules/ai-training-focus.md`** - Comprehensive AI training development guide
- **`.clinerules/development.md`** - General development workflow
- **`.clinerules/architecture.md`** - Technical architecture overview
- **`.clinerules/deployment.md`** - Deployment and operations guide

This project is AI-training focused, so prioritize understanding the AI components and their interactions when making changes or adding features.
