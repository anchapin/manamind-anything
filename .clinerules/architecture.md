# ManaMind Training System - Technical Architecture Overview

## System Architecture

The ManaMind Training System is a sophisticated web-based application that combines AI training dashboards with a central AI training engine that supports multiple training approaches including rule-based bots, neural networks, and external opponent integration.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ManaMind Training System                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Web App       │  │   Admin Tools   │  │
│  │   (React)       │  │   (CLI/Web)     │  │
│  │                 │  │                 │  │
│  │ • Dashboard     │  │ • System Admin  │  │
│  │ • Training UI   │  │ • User Management│  │
│  │ • Live Demo     │  │ • Notifications │  │ • Analytics     │  │
│  │ • Account Mgmt  │  │ • Sync Features │  │ • Monitoring    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│           │                     │                     │        │
│           └─────────────────────┼─────────────────────┘        │
│                                 │                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    API Layer                                 │  │
│  │                  (Hono Server)                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                 │                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                  AI Training Engine                       │  │
│  │                                                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  │   Simple Bot    │  │  Neural Network │  │   Forge Integ   │  │
│  │  │                 │  │                 │  │                 │  │
│  │  │ • Rule-based    │  │ • AlphaZero     │  │ • External MTG  │  │
│  │  │ • Decision AI   │  │ • Self-play     │  │ • Opponent Mgmt │  │
│  │  │ • Game Sim      │  │ • Model Training│  │ • Hybrid Train  │  │
│  │  │ • Demo Ready    │  │ • Performance   │  │ • Real-time     │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  │                                                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  │ Training Mgmt  │  │  Model Mgmt     │  │  Session Mgmt  │  │
│  │  │                 │  │                 │  │                 │  │
│  │  │ • Session Ctrl │  │ • Versioning    │  │ • State Track   │  │
│  │  │ • Progress     │  │ • Evaluation    │  │ • Metrics       │  │
│  │  │ • Metrics      │  │ • Deployment    │  │ • Recovery      │  │
│  │  │ • Optimization │  │ • Performance   │  │ • Logging       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                 │                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Data Layer                                │  │
│  │                 (PostgreSQL/Neon)                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Web Application Architecture

#### Frontend Structure
```
src/
├── app/                              # React Router v7 app structure
│   ├── api/                         # API routes (server-side)
│   │   ├── bot/                     # Bot-related APIs
│   │   │   └── simple/
│   │   │       └── route.js        # Simple bot API
│   │   ├── training/                # Training control APIs
│   │   │   ├── control/
│   │   │   │   └── route.js        # Training session control
│   │   │   ├── status/
│   │   │   │   └── route.js        # Training status API
│   │   │   └── optimization/
│   │   │       └── route.js        # Training optimization API
│   │   ├── models/                  # Model management APIs
│   │   │   └── neural/
│   │   │       └── route.js        # Neural model API
│   │   ├── forge/                   # Forge integration APIs
│   │   │   ├── integration/
│   │   │   │   └── route.js        # Forge integration API
│   │   │   ├── process/
│   │   │   │   └── route.js        # Forge process API
│   │   │   └── monitoring/
│   │   │       └── route.js        # Forge monitoring API
│   │   └── system/                  # System metrics APIs
│   │       └── metrics/
│   │           └── route.js        # System metrics API
│   ├── demo/                        # Live demo page
│   │   └── page.jsx                # Demo implementation
│   ├── neural-forge/               # Advanced training interface
│   │   └── page.jsx                # Neural Forge interface
│   ├── account/                    # User authentication
│   │   └── login/
│   │       └── page.jsx            # Login page
│   └── root.tsx                    # Root component
├── components/                      # React components
│   ├── dashboard/                  # Dashboard components
│   │   ├── TrainingDashboard.tsx   # Main training dashboard
│   │   ├── ModelManagement.tsx     # Model management UI
│   │   ├── ForgeManager.tsx        # Forge integration UI
│   │   ├── MetricsDisplay.tsx      # Metrics display components
│   │   └── TrainingControls.tsx    # Training control components
│   ├── ui/                         # Reusable UI components
│   │   ├── Card.tsx                # Card component
│   │   ├── Button.tsx              # Button component
│   │   ├── Chart.tsx               # Chart component
│   │   └── Modal.tsx               # Modal component
│   └── layout/                     # Layout components
│       ├── Header.tsx             # Header component
│       ├── Sidebar.tsx            # Sidebar component
│       └── Footer.tsx             # Footer component
└── utils/                          # Utility functions
    ├── formatDate.js              # Date formatting utilities
    ├── calculateMetrics.js        # Metrics calculation utilities
    └── apiHelpers.js              # API helper functions
```

#### State Management
- **React Hooks**: Use built-in React hooks for local state
- **Context API**: For global state management (user auth, theme)
- **Custom Hooks**: For complex state logic and API integration
- **Server State**: API responses managed through React Query or custom hooks

#### Data Flow
```
User Action → React Component → Custom Hook → API Call → Server Response
     ↓                                                                      ↑
Component State ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 2. Web Application Architecture

#### React/React Router Structure
```
src/
├── app/                          # React Router app structure
│   ├── api/                      # API routes
│   ├── demo/                     # Demo page
│   ├── neural-forge/             # Neural forge interface
│   ├── account/                  # Account pages
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   └── dashboard/                # Dashboard components
└── utils/                        # Utility functions
├── components/                   # React Native components
│   ├── GameBoard.tsx            # Game board component
│   ├── TrainingProgress.tsx     # Training progress component
│   ├── MetricCard.tsx           # Metric card component
│   └── NavigationBar.tsx        # Navigation bar component
├── hooks/                       # Custom hooks
│   ├── useTraining.ts          # Training state hook
│   ├── useAuth.ts              # Authentication hook
│   └── useGame.ts              # Game state hook
├── utils/                       # Utility functions
│   ├── platform.ts             # Platform-specific utilities
│   ├── storage.ts              # Storage utilities
│   └── networking.ts           # Networking utilities
├── assets/                      # App assets
│   ├── images/                  # Image assets
│   ├── fonts/                   # Font assets
│   └── icons/                   # Icon assets
└── app.json                    # Expo app configuration
```

#### Native Module Integration
- **Expo Modules**: Use Expo modules for device features
- **Custom Native Modules**: For platform-specific functionality
- **React Native Bridges**: For communication between JS and native code


### 3. API Layer Architecture

#### Server Structure
```
src/app/api/                    # API routes directory
├── bot/                        # Bot-related endpoints
│   └── simple/
│       └── route.js            # Simple bot endpoint
├── training/                   # Training management endpoints
│   ├── control/
│   │   └── route.js            # Training control endpoint
│   ├── status/
│   │   └── route.js            # Training status endpoint
│   └── optimization/
│       └── route.js            # Training optimization endpoint
├── models/                     # Model management endpoints
│   └── neural/
│       └── route.js            # Neural model endpoint
├── forge/                      # Forge integration endpoints
│   ├── integration/
│   │   └── route.js            # Forge integration endpoint
│   ├── process/
│   │   └── route.js            # Forge process endpoint
│   └── monitoring/
│       └── route.js            # Forge monitoring endpoint
└── system/                     # System endpoints
    └── metrics/
        └── route.js            # System metrics endpoint
```

#### API Design Patterns
- **RESTful Architecture**: Follow REST conventions
- **Resource-Based Endpoints**: Organize around resources
- **Consistent Response Format**: Standardized API responses
- **Error Handling**: Comprehensive error responses
- **Authentication**: JWT-based authentication
- **Rate Limiting**: Prevent abuse with rate limiting

#### Request/Response Flow
```
Client Request → API Route → Business Logic → Database → Response
     ↓                ↓              ↓           ↓          ↓
Authentication → Validation → Processing → Query → JSON Response
```

### 4. AI Training Engine Architecture

#### Core Components
```
AI Training Engine/
├── Simple Bot System/          # Rule-based AI
│   ├── Decision Logic/         # Decision-making algorithms
│   ├── Game State Management/  # Game state tracking
│   └── Simulation Engine/     # Game simulation
├── Neural Network System/      # Neural network AI
│   ├── Model Architecture/     # Network structure
│   ├── Training Loop/          # Training algorithms
│   ├── Model Evaluation/      # Performance evaluation
│   └── Model Management/       # Versioning and deployment
├── Forge Integration/          # External opponent integration
│   ├── Process Management/     # Forge process control
│   ├── Communication Layer/   # Forge communication
│   ├── State Synchronization/  # Game state sync
│   └── Performance Monitoring/ # Forge performance tracking
└── Training Management/        # Training coordination
    ├── Session Management/     # Training session control
    ├── Progress Tracking/     # Training progress monitoring
    ├── Metrics Collection/     # Performance metrics
    └── Optimization Engine/    # Training optimization
```

#### AI Decision Flow
```
Game State → State Analysis → Decision Engine → Action Selection → Execution
     ↓              ↓               ↓               ↓           ↓
Input Data → Feature Extraction → Policy/Value → Action Choice → Game Update
```

#### Training Pipeline
```
Data Collection → Preprocessing → Model Training → Evaluation → Deployment
        ↓                ↓               ↓              ↓            ↓
Game Results → Feature Engineering → Parameter Updates → Metrics → Model Version
```

### 5. Data Layer Architecture

#### Database Schema
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Training sessions table
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_type VARCHAR(50) NOT NULL, -- 'neural', 'forge', 'hybrid'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'error'
    config JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES training_sessions(id),
    game_type VARCHAR(50) NOT NULL, -- 'bot_vs_bot', 'ai_vs_forge', 'ai_vs_ai'
    player1_type VARCHAR(50) NOT NULL,
    player2_type VARCHAR(50) NOT NULL,
    player1_deck VARCHAR(100),
    player2_deck VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    winner VARCHAR(50), -- 'player1', 'player2', 'draw'
    turn_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    player1_life INTEGER,
    player2_life INTEGER,
    game_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Neural models table
CREATE TABLE neural_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    architecture JSONB,
    training_config JSONB,
    performance_metrics JSONB,
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'training', -- 'training', 'trained', 'deployed', 'archived'
    training_games INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 4),
    loss DECIMAL(10, 6),
    accuracy DECIMAL(5, 4),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Forge games table
CREATE TABLE forge_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    forge_process_id VARCHAR(100),
    opponent_name VARCHAR(255),
    opponent_difficulty VARCHAR(50),
    game_format VARCHAR(50),
    connection_status VARCHAR(50), -- 'connecting', 'connected', 'disconnected', 'error'
    last_heartbeat TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System metrics table
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL, -- 'cpu', 'memory', 'disk', 'network'
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(15, 6) NOT NULL,
    unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Training metrics table
CREATE TABLE training_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES training_sessions(id),
    metric_name VARCHAR(100) NOT NULL, -- 'games_per_hour', 'win_rate', 'loss', 'accuracy'
    value DECIMAL(15, 6) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);
```

#### Data Access Patterns
- **Repository Pattern**: Abstract database access
- **Query Builders**: Dynamic query construction
- **Connection Pooling**: Efficient database connection management
- **Transaction Management**: Ensure data consistency
- **Caching Layer**: Improve performance with caching

#### Data Flow
```
Application → Repository → Query Builder → Database → Result
     ↓            ↓              ↓            ↓         ↓
Business Logic → Data Access → SQL Query → Execution → Mapped Objects
```

## Technology Stack

### Frontend Technologies
- **React 18**: UI library with modern features
- **React Router v7**: Client-side routing with data loading
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **React Query**: Server state management
- **Zustand**: Lightweight state management

### Web Technologies
- **Expo**: React development platform
- **React Native Web**: Cross-platform web development
- **Expo Router**: File-based routing for React
- **React Native Elements**: UI component library
- **AsyncStorage**: Local storage solution
- **Push Notifications**: Expo push notifications

### Backend Technologies
- **Hono**: Fast web framework for Edge/Node.js
- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe backend development
- **PostgreSQL**: Primary database
- **Neon**: Serverless PostgreSQL
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

### AI/ML Technologies
- **TensorFlow.js**: Machine learning in JavaScript
- **Neural Networks**: Deep learning models
- **AlphaZero Algorithm**: Self-play reinforcement learning
- **MCTS**: Monte Carlo Tree Search
- **Model Optimization**: Pruning, quantization, caching

### DevOps Technologies
- **Docker**: Containerization
- **GitHub Actions**: CI/CD pipeline
- **Vercel**: Web application deployment
- **PostgreSQL**: Database hosting
- **Cloudflare**: CDN and security

## Integration Patterns


### 2. AI System Integration
```
Simple Bot ←→ Training Engine ←→ Neural Network ←→ Forge Integration
     ↓              ↓              ↓              ↓
Game Rules → Session Mgmt → Model Training → External Opponents
```

### 3. Data Integration
```
Frontend ←→ API Layer ←→ Business Logic ←→ Database
    ↓          ↓              ↓              ↓
Components → Endpoints → Services → Repositories → Tables
```

### 4. Third-Party Integration
```
Application ←→ Integration Layer ←→ External Services
     ↓                ↓                 ↓
UI Components → API Adapters → Forge, Analytics, Auth, etc.
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: User permissions based on roles
- **Session Management**: Secure session handling
- **Password Security**: bcrypt hashing with salt

### Data Security
- **Encryption**: Data encryption at rest and in transit
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content sanitization and CSP headers

### API Security
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-origin resource sharing configuration
- **HTTPS**: TLS encryption for all communications
- **API Keys**: Secure API key management

### Infrastructure Security
- **Environment Variables**: Secure configuration management
- **Secrets Management**: Secure storage of sensitive data
- **Network Security**: Firewall and VPC configuration
- **Monitoring**: Security event monitoring and alerting

## Performance Architecture

### Frontend Performance
- **Code Splitting**: Dynamic imports for large components
- **Lazy Loading**: Load components on demand
- **Image Optimization**: Optimized images and modern formats
- **Caching**: Browser and CDN caching strategies
- **Bundle Analysis**: Monitor and optimize bundle size

### Backend Performance
- **Database Optimization**: Query optimization and indexing
- **Connection Pooling**: Efficient database connection management
- **Caching**: Redis or in-memory caching
- **Load Balancing**: Distribute traffic across servers
- **CDN**: Content delivery network for static assets

### AI Training Performance
- **GPU Acceleration**: Leverage GPU for neural network training
- **Batch Processing**: Efficient batch processing for training
- **Parallel Processing**: Multi-threaded training and inference
- **Model Optimization**: Pruning, quantization, and caching
- **Memory Management**: Efficient memory usage and garbage collection

### Web Performance
- **Bundle Optimization**: Keep web bundle size minimal
- **Rendering Optimization**: Use virtualization and performance optimizations
- **Code Splitting**: Efficient loading of components
- **Memory Management**: Monitor and optimize web memory usage

## Monitoring & Observability

### Application Monitoring
- **Error Tracking**: Sentry or similar error tracking
- **Performance Monitoring**: Real user monitoring (RUM)
- **User Analytics**: User behavior and feature usage
- **Health Checks**: Application health monitoring

### System Monitoring
- **Resource Usage**: CPU, memory, disk, network monitoring
- **Database Performance**: Query performance and connection monitoring
- **API Performance**: Response times and error rates
- **Infrastructure Health**: Server and service health monitoring

### AI Training Monitoring
- **Training Metrics**: Loss, accuracy, win rate tracking
- **Model Performance**: Inference speed and accuracy monitoring
- **Resource Usage**: GPU, CPU, memory usage during training
- **Convergence Monitoring**: Training convergence and stability

### Logging & Tracing
- **Structured Logging**: JSON-formatted logs with consistent structure
- **Distributed Tracing**: Request tracing across services
- **Log Aggregation**: Centralized log collection and analysis
- **Alerting**: Automated alerts for critical issues

## Scalability Architecture

### Horizontal Scaling
- **Microservices**: Service decomposition for independent scaling
- **Load Balancing**: Distribute traffic across multiple instances
- **Database Scaling**: Read replicas and sharding
- **Caching Layer**: Distributed caching for improved performance

### Vertical Scaling
- **Resource Allocation**: Dynamic resource allocation based on demand
- **Performance Optimization**: Code and query optimization
- **Infrastructure Upgrades**: Server and infrastructure upgrades
- **Database Optimization**: Database performance tuning

### AI Training Scalability
- **Distributed Training**: Multi-node training for large models
- **Model Parallelism**: Distribute model across multiple devices
- **Data Parallelism**: Process data in parallel across multiple workers
- **Batch Processing**: Efficient batch processing for large datasets

### Web App Scalability
- **Cloud Infrastructure**: Scalable cloud infrastructure for web backend
- **Offline Support**: Offline functionality with sync capabilities
- **Push Notifications**: Scalable push notification infrastructure
- **Content Delivery**: CDN for web app assets and updates

This architecture overview provides a comprehensive understanding of the ManaMind Training System's technical structure. For detailed development guidance, refer to the specialized documentation files in the `.clinerules/` directory.
