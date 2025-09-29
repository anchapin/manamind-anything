# ManaMind Training System - Development Workflow

## Development Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Database access (PostgreSQL/Neon)

### Initial Setup
```bash
# Clone and install dependencies
git clone <repository-url>
cd manamind-training-system
npm install

# Install web app dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development Servers
```bash
# Web application (port 4000)
npm run dev

# Type checking
npm run typecheck

# Testing
npm test
```

## Project Structure Overview

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
├── plugins/                         # Vite build plugins
├── test/                            # Test files
└── .clinerules/                      # Development documentation
```

## Daily Development Commands

### Common Commands
```bash
# Start development
npm run dev                    # Web app

# Code quality
npm run typecheck            # TypeScript checking
npm run lint                 # ESLint (if configured)
npm run format               # Prettier (if configured)

# Testing
npm test                     # Run all tests
npm run test:watch           # Watch mode for tests
npm run test:coverage        # Test coverage report

# Building
npm run build                # Production build
npm run preview              # Preview production build
```

### Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/ai-training-enhancement

# 2. Make changes and test
npm run dev
npm test

# 3. Commit changes
git add .
git commit -m "feat: enhance AI training performance"

# 4. Push and create PR
git push origin feature/ai-training-enhancement
```

## Key Development Areas

### 1. AI Training Development
**Focus Area**: Primary development priority

**Key Files**:
- `src/app/api/bot/simple/route.js` - Rule-based bot
- `src/app/api/training/` - Training control and status
- `src/app/api/models/` - Model management
- `src/app/api/forge/` - Forge integration
- `src/components/dashboard/TrainingDashboard.tsx` - Training UI

**Development Process**:
1. **Design AI feature**: Define requirements and architecture
2. **Implement logic**: Write bot/training code with TypeScript
3. **Create API endpoints**: Add necessary API routes
4. **Build UI components**: Update dashboard with new features
5. **Test thoroughly**: Unit tests, integration tests, AI performance tests
6. **Documentation**: Update relevant documentation files

**Testing Focus**:
- AI decision logic accuracy
- Training session management
- Model performance and convergence
- Forge integration reliability

### 2. Web Application Development
**Focus Area**: Dashboard and user interface

**Key Files**:
- `src/components/dashboard/` - Dashboard components
- `src/app/demo/page.jsx` - Live demo page
- `src/app/neural-forge/page.jsx` - Advanced training interface
- `src/app/account/` - User authentication and profile

**Development Process**:
1. **Component design**: Plan component structure and props
2. **Implementation**: Write React components with TypeScript
3. **Styling**: Apply Tailwind CSS classes and custom styles
4. **State management**: Use React hooks for state and effects
5. **API integration**: Connect to backend APIs
6. **Testing**: Component tests, accessibility tests

**Testing Focus**:
- Component rendering and functionality
- User interactions and state management
- API integration and error handling
- Responsive design and accessibility

### 3. Web Application Development
**Focus Area**: React web app

**Key Files**:
- `src/` - Web app source
- `src/app/` - React Router app structure

**Development Process**:
1. **Feature planning**: Define web-specific features
2. **Implementation**: Write React components
3. **Integration**: Use web features and APIs
4. **Testing**: Device testing, emulator testing
5. **Build**: Create production builds for iOS and Android

**Testing Focus**:
- Device compatibility and performance
- Native feature integration
- User experience and interface design
- Cross-platform consistency

### 4. API Development
**Focus Area**: Backend API endpoints and business logic

**Key Files**:
- `src/app/api/` - API route organization
- `src/app/api/utils/sql.js` - Database utilities
- `src/app/api/utils/` - API utilities and helpers

**Development Process**:
1. **API design**: Define endpoints, request/response formats
2. **Implementation**: Write API route handlers
3. **Database integration**: Connect to database, write queries
4. **Error handling**: Implement proper error responses
5. **Testing**: Integration tests, API endpoint tests
6. **Documentation**: Update API documentation

**Testing Focus**:
- Endpoint functionality and response formats
- Database operations and data integrity
- Error handling and edge cases
- Authentication and authorization

## Testing Guidelines

### Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and component interactions
- **E2E Tests**: Test complete user flows (if implemented)
- **AI Testing**: Test AI logic, training performance, and model accuracy

### Test Structure
```
test/
├── components/           # React component tests
├── api/                 # API endpoint tests
├── utils/               # Utility function tests
├── ai/                  # AI-specific tests
└── e2e/                 # End-to-end tests (if implemented)
```

### Writing Tests
```javascript
// Example unit test for AI component
import { SimpleBot } from '@/app/api/bot/simple/route';

describe('SimpleBot', () => {
  test('should make correct land play decision', () => {
    const bot = new SimpleBot();
    bot.mana = 5;
    
    const decisions = bot.makeDecision(20, 0);
    const landDecision = decisions.find(d => d.action === 'play_land');
    
    expect(landDecision.priority).toBe(0.9);
  });
});

// Example API test
import { createTestGame } from '@/test/utils/api';

describe('Training API', () => {
  test('should start training session', async () => {
    const response = await fetch('/api/training/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        config: createTestConfig()
      })
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test SimpleBot.test.js

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Code Standards

### TypeScript Guidelines
- **Strict Typing**: Use strict TypeScript for all files
- **Interfaces**: Define interfaces for all component props and API responses
- **Type Safety**: Avoid `any` type, use specific types
- **Null Safety**: Use proper null checking and optional chaining

```typescript
// Good example
interface TrainingMetrics {
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  gamesCompleted: number;
  winRate: number;
}

const TrainingDashboard: React.FC<{ metrics: TrainingMetrics }> = ({ metrics }) => {
  return (
    <div className="training-dashboard">
      <h2>Session {metrics.sessionId}</h2>
      <p>Status: {metrics.status}</p>
      <p>Win Rate: {(metrics.winRate * 100).toFixed(1)}%</p>
    </div>
  );
};
```

### React Component Guidelines
- **Functional Components**: Use functional components with hooks
- **Props Interface**: Define interface for component props
- **Default Props**: Use default values when appropriate
- **Component Composition**: Break down complex components into smaller ones

```typescript
interface CardProps {
  title: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<CardProps> = ({ 
  title, 
  value, 
  trend = 'stable', 
  icon 
}) => {
  return (
    <div className="metric-card">
      {icon && <div className="metric-icon">{icon}</div>}
      <h3 className="metric-title">{title}</h3>
      <div className="metric-value">{value}</div>
      <div className={`metric-trend trend-${trend}`} />
    </div>
  );
};
```

### API Development Guidelines
- **RESTful Design**: Follow REST conventions for API design
- **Error Handling**: Implement consistent error responses
- **Validation**: Validate input data and sanitize outputs
- **Documentation**: Include JSDoc comments for API endpoints

```javascript
/**
 * POST /api/training/control
 * Control training sessions (start, pause, resume, stop)
 * 
 * @param {Object} request - HTTP request object
 * @param {Object} request.body - Request body
 * @param {string} request.body.action - Action to perform
 * @param {Object} request.body.config - Training configuration
 * @returns {Promise<Response>} JSON response with session data
 */
export async function POST(request) {
  try {
    const { action, config } = await request.json();
    
    // Validate input
    if (!action || !['start', 'pause', 'resume', 'stop'].includes(action)) {
      return Response.json(
        { error: 'Invalid action' }, 
        { status: 400 }
      );
    }
    
    // Process request
    const result = await handleTrainingAction(action, config);
    
    return Response.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Training control error:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### File Organization Standards
- **Component Files**: Use PascalCase for component files (`TrainingDashboard.tsx`)
- **Utility Files**: Use camelCase for utility files (`formatDate.js`)
- **API Routes**: Use lowercase for API route files (`training/control.js`)
- **Test Files**: Use `.test.js` or `.spec.js` suffix for test files

## Git Workflow

### Branching Strategy
```bash
main                    # Production branch
├── develop            # Development branch
├── feature/           # Feature branches
│   ├── feature/ai-enhancement
│   ├── feature/dashboard-redesign
├── hotfix/            # Hotfix branches
│   └── hotfix/critical-bug-fix
└── release/           # Release branches
    └── release/v1.2.0
```

### Commit Message Convention
```bash
# Format: <type>(<scope>): <description>
# 
# Types:
#   feat:     New feature
#   fix:      Bug fix
#   docs:     Documentation changes
#   style:    Code style changes
#   refactor: Code refactoring
#   test:     Test changes
#   chore:    Build process or auxiliary tool changes
#
# Examples:
feat(ai): add neural network training support
fix(api): handle training session timeout errors
docs(readme): update installation instructions
style(component): improve dashboard styling
test(ai): add unit tests for bot decision logic
```

### Pull Request Process
1. **Create feature branch** from `develop`
2. **Implement changes** with proper testing
3. **Update documentation** if needed
4. **Create pull request** to `develop` branch
5. **Code review** by team members
6. **Address feedback** and make necessary changes
7. **Merge** to `develop` branch
8. **Deploy** to staging environment for testing
9. **Create release** branch from `develop`
10. **Merge** to `main` for production deployment

## Common Development Tasks

### Adding New API Endpoint
```bash
# 1. Create API route file
touch src/app/api/new-feature/route.js

# 2. Implement endpoint logic
# Edit src/app/api/new-feature/route.js

# 3. Add tests
touch test/api/new-feature.test.js

# 4. Update API documentation
# Edit relevant documentation files

# 5. Test implementation
npm test
npm run dev
```

### Creating New Dashboard Component
```bash
# 1. Create component file
touch src/components/dashboard/NewComponent.tsx

# 2. Implement component with TypeScript
# Edit src/components/dashboard/NewComponent.tsx

# 3. Add styles with Tailwind CSS
# Use existing design system classes

# 4. Add component tests
touch test/components/NewComponent.test.js

# 5. Integrate component into dashboard
# Edit src/components/dashboard/TrainingDashboard.tsx

# 6. Test implementation
npm test
npm run dev
```

### Adding New AI Training Feature
```bash
# 1. Design AI architecture
# Review existing AI components and patterns

# 2. Implement AI logic
# Edit relevant files in src/app/api/bot/, src/app/api/training/, etc.

# 3. Create or update API endpoints
# Edit relevant API route files

# 4. Update dashboard UI
# Edit relevant dashboard components

# 5. Add comprehensive tests
# Edit or create test files in test/ai/

# 6. Update AI documentation
# Edit .clinerules/ai-training-focus.md

# 7. Test implementation
npm test
npm run dev
```

### Web App Development
```bash
# 1. Ensure you're in project root
cd .

# 2. Create new screen or component
touch app/screens/NewScreen.tsx

# 3. Implement web feature
# Edit app/screens/NewScreen.tsx

# 4. Add navigation
# Edit app/_layout.tsx or relevant navigation files

# 5. Test on device/emulator
expo start

# 6. Build for testing
expo build:android
# or
expo build:ios
```

## Performance Considerations

### Web Application Performance
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Optimize images and use modern formats
- **Bundle Analysis**: Monitor bundle size and dependencies
- **Caching**: Implement appropriate caching strategies

### AI Training Performance
- **Batch Processing**: Use efficient batch processing for training
- **Memory Management**: Monitor and optimize memory usage
- **GPU Utilization**: Leverage GPU acceleration for neural networks
- **Parallel Processing**: Use worker threads for parallel computation

### Web App Performance
- **Bundle Size**: Keep web bundle size minimal
- **Rendering Optimization**: Use virtualization and other performance optimizations
- **Code Splitting**: Use dynamic imports for efficient loading
- **Memory Management**: Monitor and manage web memory usage

## Debugging Tips

### Web Application Debugging
- **Browser DevTools**: Use Chrome DevTools for debugging
- **React Developer Tools**: Install React DevTools extension
- **Console Logging**: Use console.log for debugging (remove in production)
- **Network Tab**: Monitor API calls and responses

### AI Training Debugging
- **Training Logs**: Monitor training progress and metrics
- **Model Inspection**: Examine model weights and gradients
- **Performance Monitoring**: Track training speed and resource usage
- **Error Analysis**: Analyze training errors and convergence issues


## Deployment Preparation

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Performance tests passed
- [ ] Security audit completed
- [ ] Dependencies updated and secure
- [ ] Environment variables configured
- [ ] Database migrations prepared

### Build Process
```bash
# Build web application
npm run build

# Run final tests
npm test
```

### Deployment Steps
1. **Prepare environment**: Configure production environment
2. **Deploy backend**: Deploy API and backend services
3. **Deploy web app**: Deploy to production web hosting
4. **Run migrations**: Execute database migrations
5. **Monitor deployment**: Check for issues and performance
6. **Rollback plan**: Prepare rollback strategy if needed

## Resources and References

### Documentation
- **Main Instructions**: `.clinerules/instructions.md`
- **AI Training Focus**: `.clinerules/ai-training-focus.md`
- **Architecture Overview**: `.clinerules/architecture.md`
- **Deployment Guide**: `.clinerules/deployment.md`

### Tools and Utilities
- **React Documentation**: https://react.dev/
- **React Router v7**: https://reactrouter.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **Expo Documentation**: https://docs.expo.dev/

### Team Communication
- **Issue Tracking**: Use GitHub Issues for bug reports and feature requests
- **Code Reviews**: Use GitHub Pull Requests for code review
- **Documentation**: Keep documentation updated with code changes
- **Knowledge Sharing**: Share learnings and best practices with team

This development workflow provides a comprehensive guide for working on the ManaMind Training System. For detailed AI training development guidance, refer to the specialized documentation in `.clinerules/ai-training-focus.md`.
