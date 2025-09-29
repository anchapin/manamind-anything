# ManaMind Training System - AI Training Development Focus

## AI System Architecture Overview

The ManaMind Training System implements a sophisticated multi-layered AI architecture designed specifically for Magic: The Gathering. The system combines rule-based bots, neural networks, and external opponent integration to create a comprehensive training environment.

### Core AI Components

#### 1. Simple Rule-Based Bot System
**Location**: `src/app/api/bot/simple/route.js`

**Purpose**: Provides a foundational MTG AI for proof-of-concept, testing, and demonstration. This bot implements basic MTG rules and decision-making logic.

**Architecture**:
```javascript
class SimpleBot {
  constructor(life = 20) {
    this.life = life;
    this.mana = 0;
    this.cardsInHand = 7;
    this.creatures = [];
    this.spells = [];
    this.turn = 0;
  }
}
```

**Key Decision-Making Process**:
- **Priority-based decisions**: Each action has a priority score (0.0-1.0)
- **Resource management**: Mana, cards, and creature considerations
- **Game state evaluation**: Life totals, board state, turn progression
- **Strategic layers**: Early game (creatures), mid game (attacks), late game (finishers)

**Decision Categories**:
1. **Land Management**: Always play land if mana < 10
2. **Creature Development**: Cast creatures early game (turns 1-4)
3. **Combat Strategy**: Attack with available creatures
4. **Direct Damage**: Use burn spells when opponent is low (≤6 life)
5. **Removal**: Handle opponent's creatures
6. **Counterspells**: Defensive measures when behind

**Development Guidelines**:
- **Adding new strategies**: Extend the `makeDecision()` method with new decision objects
- **Balancing**: Adjust priority values to ensure balanced play
- **Testing**: Use the demo page to test individual decisions
- **Performance**: Bot should make decisions in <100ms for real-time play

#### 2. Neural Network Training System
**Locations**: 
- Training control: `src/app/api/training/`
- Model management: `src/app/api/models/neural/route.js`
- Training execution: `src/app/api/neural/runner/route.js`

**Purpose**: Implements AlphaZero-style self-play training for developing sophisticated MTG AI models.

**Architecture Overview**:
```
Input State → Neural Network → Policy (Move Probabilities) → Value (Win Probability)
     ↓                                                           ↓
Game Simulator → Move Execution → New State → Reward → Training Update
```

**Key Components**:

**A. State Representation**
```javascript
interface GameState {
  // Player state
  playerLife: number;
  playerMana: number;
  playerCardsInHand: number;
  playerCreatures: Creature[];
  playerGraveyard: Card[];
  
  // Opponent state
  opponentLife: number;
  opponentMana: number;
  opponentCardsInHand: number;
  opponentCreatures: Creature[];
  
  // Game state
  turn: number;
  phase: 'main' | 'combat' | 'end';
  stack: Card[];
  battlefield: Permanent[];
}
```

**B. Neural Network Architecture**
```javascript
interface NeuralModel {
  // Input layers
  stateEncoder: DenseLayer;        // Encodes game state
  actionEncoder: DenseLayer;       // Encodes available actions
  
  // Core processing
  residualBlocks: ResidualBlock[]; // Deep residual processing
  
  // Output heads
  policyHead: DenseLayer;         // Move probability distribution
  valueHead: DenseLayer;          // Win probability estimation
}
```

**C. Training Loop Implementation**
```javascript
async function trainingLoop(model, config) {
  for (let episode = 0; episode < config.episodes; episode++) {
    // Self-play
    const gameData = await selfPlayGame(model);
    
    // Generate training examples
    const examples = generateTrainingExamples(gameData);
    
    // Update neural network
    await updateModel(model, examples);
    
    // Evaluate performance
    const metrics = await evaluateModel(model);
    
    // Save checkpoint if improved
    if (metrics.winRate > bestWinRate) {
      await saveModelCheckpoint(model, metrics);
    }
  }
}
```

**Development Guidelines**:

**Model Architecture Changes**:
- **New layers**: Modify the model definition in `src/app/api/models/neural/route.js`
- **Input features**: Update state encoding to include new game aspects
- **Output heads**: Add new output heads for different decision types
- **Testing**: Validate model changes with unit tests before training

**Training Configuration**:
```javascript
interface TrainingConfig {
  // Model parameters
  learningRate: number;           // 0.001 - 0.1
  batchSize: number;               // 32 - 256
  mctsSimulations: number;        // 50 - 1000
  
  // Training parameters
  targetGames: number;            // 1000 - 1000000
  explorationRate: number;        // 0.1 - 0.5
  temperature: number;            // 0.5 - 2.0
  
  // Performance targets
  targetWinRate: number;          // 0.5 - 0.8
  convergenceThreshold: number;  // 0.001 - 0.01
}
```

**Performance Optimization**:
- **Batch processing**: Use large batches for GPU efficiency
- **Memory management**: Clear gradients and intermediate states
- **Parallel training**: Utilize multiple workers for self-play
- **Checkpoint management**: Save model state regularly

#### 3. Forge Integration System
**Locations**: 
- API endpoints: `src/app/api/forge/`
- UI components: `src/components/dashboard/ForgeManager.tsx`
- Process control: `src/app/api/forge/process/route.js`

**Purpose**: Integrates with external MTG opponents (Forge) to provide realistic training scenarios and hybrid training approaches.

**Architecture**:
```
Training System → Forge API → Forge Process → Game Results → Training Data
     ↓                                                    ↑
Neural Network ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

**Key Components**:

**A. Forge Process Management**
```javascript
interface ForgeGame {
  gameId: string;
  players: {
    ai: 'neural_model_v1';
    opponent: 'forge_ai_medium';
  };
  state: {
    turn: number;
    player1Life: number;
    player2Life: number;
    phase: string;
    stack: Card[];
  };
  status: 'active' | 'completed' | 'error';
}
```

**B. Integration API**
```javascript
// Start Forge game
POST /api/forge/integration
{
  action: 'start_game',
  config: {
    opponentDifficulty: 'medium',
    gameFormat: 'standard',
    timeLimit: 300000
  }
}

// Monitor game progress
GET /api/forge/process/{gameId}

// Get game results
POST /api/forge/integration
{
  action: 'get_results',
  gameId: string
}
```

**C. Hybrid Training Coordination**
```javascript
interface HybridTrainingConfig {
  // Training distribution
  neuralGames: number;           // Games against self
  forgeGames: number;            // Games against Forge
  alternateEvery: number;        // Switch training type every N games
  
  // Forge-specific settings
  opponentDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  gameFormat: 'standard' | 'modern' | 'legacy';
  
  // Performance weighting
  forgeWeight: number;           // Weight of Forge games in training
  neuralWeight: number;          // Weight of neural games in training
}
```

**Development Guidelines**:

**Forge Connection Management**:
- **Process spawning**: Use child processes for Forge instances
- **Communication**: Implement message passing between training system and Forge
- **Error handling**: Handle Forge crashes and timeouts gracefully
- **Resource cleanup**: Ensure proper process termination

**Game State Synchronization**:
```javascript
// Map Forge game state to internal format
function mapForgeState(forgeState) {
  return {
    playerLife: forgeState.player1.life,
    opponentLife: forgeState.player2.life,
    turn: forgeState.turn,
    phase: mapPhase(forgeState.phase),
    // ... additional state mapping
  };
}
```

**Performance Monitoring**:
- **Latency tracking**: Monitor Forge response times
- **Success rates**: Track game completion rates
- **Error analysis**: Categorize and log Forge-related errors
- **Resource usage**: Monitor CPU and memory usage of Forge processes

#### 4. Training Dashboard System
**Location**: `src/components/dashboard/TrainingDashboard.tsx`

**Purpose**: Provides real-time visualization and control of AI training processes.

**Architecture**:
```
Training Data → WebSocket → Dashboard UI → User Actions → Training Control
     ↓                                                               ↑
Database ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

**Key Components**:

**A. Real-time Metrics Display**
```typescript
interface TrainingMetrics {
  // Session metrics
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  startTime: Date;
  duration: number;
  
  // Performance metrics
  gamesCompleted: number;
  winRate: number;
  gamesPerHour: number;
  averageMoveTime: number;
  
  // Model metrics
  currentModel: string;
  modelVersion: string;
  loss: number;
  accuracy: number;
  
  // Resource metrics
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
}
```

**B. Training Control Interface**
```typescript
interface TrainingControls {
  // Session control
  startTraining: (config: TrainingConfig) => Promise<void>;
  pauseTraining: () => Promise<void>;
  resumeTraining: () => Promise<void>;
  stopTraining: () => Promise<void>;
  
  // Mode switching
  switchMode: (newMode: TrainingMode) => Promise<void>;
  
  // Configuration
  updateConfig: (config: Partial<TrainingConfig>) => Promise<void>;
}
```

**C. Visualization Components**
```typescript
// Performance charts
interface PerformanceChart {
  type: 'line' | 'bar' | 'area';
  data: MetricPoint[];
  xAxis: 'time' | 'games';
  yAxis: 'winRate' | 'loss' | 'accuracy';
  
  // Real-time updates
  updateInterval: number;  // milliseconds
  maxDataPoints: number;   // maximum points to display
}
```

**Development Guidelines**:

**Real-time Data Updates**:
- **WebSocket connection**: Maintain persistent connection for live updates
- **Data throttling**: Limit update frequency to prevent UI overload
- **Error handling**: Handle connection drops and reconnection
- **Performance**: Optimize rendering for smooth 60fps updates

**User Experience**:
- **Responsive design**: Ensure dashboard works on all screen sizes
- **Intuitive controls**: Make training controls easy to understand and use
- **Visual feedback**: Provide clear indicators for training status
- **Accessibility**: Ensure dashboard is accessible to all users

## AI Development Workflows

### 1. Adding New Bot Strategies

**Step 1: Strategy Design**
```javascript
// Define new decision type
const newStrategy = {
  action: 'new_strategy_name',
  priority: 0.7,  // Adjust based on power level
  cost: 2,        // Mana cost
  description: 'Strategic description',
  
  // Conditions for using this strategy
  conditions: {
    minTurn: 3,
    maxTurn: 10,
    minMana: 2,
    opponentLifeThreshold: 15,
    // ... additional conditions
  },
  
  // Execution logic
  execute: (gameState) => {
    // Implement strategy logic
    return {
      damage: 0,
      target: 'opponent',
      effect: 'strategic_effect'
    };
  }
};
```

**Step 2: Integration into Simple Bot**
```javascript
// Add to makeDecision method in SimpleBot
makeDecision(opponentLife, opponentCreatures = 0) {
  const decisions = [];
  
  // ... existing decisions
  
  // Add new strategy
  if (this.meetsConditions(newStrategy.conditions)) {
    decisions.push(newStrategy);
  }
  
  // ... rest of decision logic
}
```

**Step 3: Testing**
```javascript
// Unit test for new strategy
describe('New Strategy', () => {
  test('should execute when conditions are met', () => {
    const bot = new SimpleBot();
    const gameState = createTestGameState({
      turn: 5,
      mana: 3,
      opponentLife: 12
    });
    
    const decisions = bot.makeDecision(gameState.opponentLife, gameState.opponentCreatures);
    const newDecision = decisions.find(d => d.action === 'new_strategy_name');
    
    expect(newDecision).toBeDefined();
    expect(newDecision.priority).toBeGreaterThan(0.5);
  });
});
```

**Step 4: Demo Integration**
```javascript
// Add to demo page for testing
const testNewStrategy = async () => {
  const response = await fetch('/api/bot/simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_decision',
      config: {
        life: 18,
        mana: 4,
        cardsInHand: 5,
        turn: 5,
        opponentLife: 15,
        opponentCreatures: 1
      }
    })
  });
  
  const data = await response.json();
  // Verify new strategy appears in decisions
  console.log('New strategy decision:', data.decisions.find(d => d.action === 'new_strategy_name'));
};
```

### 2. Modifying Neural Network Architecture

**Step 1: Architecture Design**
```javascript
// Define new architecture in model management
const newArchitecture = {
  inputSize: 256,  // State representation size
  layers: [
    {
      type: 'dense',
      units: 512,
      activation: 'relu',
      dropout: 0.2
    },
    {
      type: 'residual',
      blocks: 6,
      units: 256,
      activation: 'relu'
    },
    {
      type: 'attention',
      heads: 8,
      keySize: 32
    }
  ],
  outputs: {
    policy: {
      type: 'dense',
      units: 100,  // Action space size
      activation: 'softmax'
    },
    value: {
      type: 'dense',
      units: 1,
      activation: 'tanh'
    }
  }
};
```

**Step 2: Implementation**
```javascript
// Update model creation in neural route
export async function POST(request) {
  const { action, architecture } = await request.json();
  
  switch (action) {
    case 'create_model':
      const model = await createNeuralModel(architecture);
      await saveModel(model);
      return Response.json({ success: true, modelId: model.id });
      
    case 'update_architecture':
      const existingModel = await loadModel(architecture.modelId);
      const updatedModel = await updateModelArchitecture(existingModel, architecture);
      await saveModel(updatedModel);
      return Response.json({ success: true, modelId: updatedModel.id });
  }
}
```

**Step 3: Training Integration**
```javascript
// Update training loop to use new architecture
async function trainWithNewArchitecture(config) {
  const model = await loadModel(config.modelId);
  
  // Verify architecture compatibility
  if (!isArchitectureCompatible(model, config)) {
    throw new Error('Model architecture incompatible with training config');
  }
  
  // Initialize training with new architecture
  const trainer = new NeuralTrainer(model, config);
  await trainer.initialize();
  
  // Run training
  const results = await trainer.train();
  
  return results;
}
```

**Step 4: Performance Validation**
```javascript
// Benchmark new architecture
async function benchmarkArchitecture(architecture) {
  const testConfig = {
    episodes: 100,
    batchSize: 32,
    evaluationInterval: 10
  };
  
  const results = await trainWithNewArchitecture({
    ...testConfig,
    architecture
  });
  
  return {
    winRate: results.winRate,
    loss: results.finalLoss,
    trainingTime: results.duration,
    convergenceRate: results.convergenceRate
  };
}
```

### 3. Implementing Hybrid Training

**Step 1: Configuration Design**
```javascript
interface HybridTrainingConfig {
  // Training distribution
  neuralGames: number;
  forgeGames: number;
  alternateEvery: number;
  
  // Mode-specific settings
  neuralConfig: {
    learningRate: number;
    batchSize: number;
    mctsSimulations: number;
  };
  
  forgeConfig: {
    opponentDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
    gameFormat: 'standard' | 'modern' | 'legacy';
    timeLimit: number;
  };
  
  // Performance weighting
  forgeWeight: number;
  neuralWeight: number;
  
  // Convergence criteria
  targetWinRate: number;
  maxGames: number;
}
```

**Step 2: Training Coordinator Implementation**
```javascript
class HybridTrainingCoordinator {
  constructor(config) {
    this.config = config;
    this.neuralTrainer = new NeuralTrainer(config.neuralConfig);
    this.forgeManager = new ForgeManager(config.forgeConfig);
    this.currentMode = 'neural';
    this.gamesPlayed = 0;
  }
  
  async startTraining() {
    while (this.gamesPlayed < this.config.maxGames) {
      // Determine training mode for this batch
      const mode = this.determineTrainingMode();
      
      // Execute training batch
      const results = await this.executeTrainingBatch(mode);
      
      // Update model with results
      await this.updateModel(results);
      
      // Check convergence
      if (await this.checkConvergence()) {
        break;
      }
    }
  }
  
  determineTrainingMode() {
    if (this.gamesPlayed % this.config.alternateEvery === 0) {
      this.currentMode = this.currentMode === 'neural' ? 'forge' : 'neural';
    }
    return this.currentMode;
  }
  
  async executeTrainingBatch(mode) {
    if (mode === 'neural') {
      return await this.neuralTrainer.trainBatch(this.config.neuralGames);
    } else {
      return await this.forgeManager.playGames(this.config.forgeGames);
    }
  }
  
  async updateModel(results) {
    // Weight results based on training mode
    const weightedResults = this.weightResults(results);
    
    // Update neural network with weighted results
    await this.neuralTrainer.update(weightedResults);
    
    this.gamesPlayed += results.totalGames;
  }
  
  weightResults(results) {
    const weight = results.mode === 'neural' ? 
      this.config.neuralWeight : this.config.forgeWeight;
    
    return {
      ...results,
      games: results.games.map(game => ({
        ...game,
        weight: weight
      }))
    };
  }
}
```

**Step 3: Integration with Training System**
```javascript
// Update training control API
export async function POST(request) {
  const { action, config } = await request.json();
  
  switch (action) {
    case 'start_hybrid_training':
      const coordinator = new HybridTrainingCoordinator(config);
      const sessionId = await coordinator.startTraining();
      return Response.json({ success: true, sessionId });
      
    case 'get_hybrid_status':
      const status = await getHybridTrainingStatus(config.sessionId);
      return Response.json(status);
  }
}
```

**Step 4: Performance Monitoring**
```javascript
// Monitor hybrid training performance
async function monitorHybridTraining(sessionId) {
  const metrics = await getTrainingMetrics(sessionId);
  
  return {
    // Overall performance
    totalGames: metrics.totalGames,
    overallWinRate: metrics.overallWinRate,
    
    // Mode-specific performance
    neuralWinRate: metrics.neuralWinRate,
    forgeWinRate: metrics.forgeWinRate,
    
    // Training efficiency
    gamesPerHour: metrics.gamesPerHour,
    convergenceRate: metrics.convergenceRate,
    
    // Resource usage
    cpuUsage: metrics.cpuUsage,
    memoryUsage: metrics.memoryUsage
  };
}
```

## AI Testing Strategies

### 1. Unit Testing for AI Components

**Bot Logic Testing**:
```javascript
describe('SimpleBot Decision Making', () => {
  test('should prioritize land play when mana < 10', () => {
    const bot = new SimpleBot();
    bot.mana = 5;
    
    const decisions = bot.makeDecision(20, 0);
    const landDecision = decisions.find(d => d.action === 'play_land');
    
    expect(landDecision.priority).toBe(0.9);
  });
  
  test('should cast creatures early game', () => {
    const bot = new SimpleBot();
    bot.turn = 3;
    bot.mana = 2;
    bot.cardsInHand = 5;
    
    const decisions = bot.makeDecision(20, 0);
    const creatureDecision = decisions.find(d => d.action === 'cast_creature');
    
    expect(creatureDecision.priority).toBe(0.8);
  });
});
```

**Neural Network Testing**:
```javascript
describe('Neural Network Model', () => {
  test('should produce valid policy and value outputs', () => {
    const model = createTestModel();
    const gameState = createTestGameState();
    
    const outputs = model.predict(gameState);
    
    expect(outputs.policy).toHaveLength(100);  // Action space size
    expect(outputs.policy.every(p => p >= 0 && p <= 1)).toBe(true);
    expect(outputs.value).toBeGreaterThanOrEqual(-1);
    expect(outputs.value).toBeLessThanOrEqual(1);
  });
  
  test('should update weights during training', async () => {
    const model = createTestModel();
    const initialWeights = model.getWeights();
    
    await model.trainBatch([createTrainingExample()]);
    
    const updatedWeights = model.getWeights();
    expect(updatedWeights).not.toEqual(initialWeights);
  });
});
```

### 2. Integration Testing

**API Integration Testing**:
```javascript
describe('Training API Integration', () => {
  test('should start and monitor training session', async () => {
    // Start training
    const startResponse = await fetch('/api/training/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        config: createTestConfig()
      })
    });
    
    expect(startResponse.ok).toBe(true);
    const { sessionId } = await startResponse.json();
    
    // Monitor training
    const statusResponse = await fetch('/api/training/status');
    expect(statusResponse.ok).toBe(true);
    const status = await statusResponse.json();
    
    expect(status.session.id).toBe(sessionId);
    expect(status.session.status).toBe('running');
  });
});
```

**Forge Integration Testing**:
```javascript
describe('Forge Integration', () => {
  test('should start and complete Forge game', async () => {
    // Start Forge game
    const startResponse = await fetch('/api/forge/integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start_game',
        config: {
          opponentDifficulty: 'medium',
          gameFormat: 'standard'
        }
      })
    });
    
    expect(startResponse.ok).toBe(true);
    const { gameId } = await startResponse.json();
    
    // Wait for game completion
    await waitForGameCompletion(gameId);
    
    // Get results
    const resultsResponse = await fetch('/api/forge/integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_results',
        gameId
      })
    });
    
    expect(resultsResponse.ok).toBe(true);
    const results = await resultsResponse.json();
    
    expect(results.status).toBe('completed');
    expect(results.winner).toBeDefined();
  });
});
```

### 3. Performance Testing

**Training Performance Testing**:
```javascript
describe('Training Performance', () => {
  test('should achieve target games per hour', async () => {
    const config = {
      targetGames: 1000,
      maxDuration: 3600000,  // 1 hour
      targetGamesPerHour: 500
    };
    
    const startTime = Date.now();
    await runTrainingSession(config);
    const duration = Date.now() - startTime;
    
    const gamesPerHour = (config.targetGames / duration) * 3600000;
    expect(gamesPerHour).toBeGreaterThan(config.targetGamesPerHour);
  });
  
  test('should maintain memory usage below threshold', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    await runTrainingSession(createLargeConfig());
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(1024 * 1024 * 1024);  // 1GB
  });
});
```

## AI Debugging Strategies

### 1. Common Issues and Solutions

**Training Convergence Issues**:
```javascript
// Symptom: Loss not decreasing or fluctuating wildly
async function diagnoseConvergenceIssues(sessionId) {
  const metrics = await getTrainingMetrics(sessionId);
  
  // Check learning rate
  if (metrics.lossHistory.length > 10) {
    const recentLoss = metrics.lossHistory.slice(-10);
    const lossVariance = calculateVariance(recentLoss);
    
    if (lossVariance > 0.1) {
      console.log('High loss variance detected - consider reducing learning rate');
      return {
        issue: 'high_loss_variance',
        suggestion: 'Reduce learning rate by factor of 10'
      };
    }
  }
  
  // Check for exploding gradients
  if (metrics.maxGradient > 1.0) {
    console.log('Exploding gradients detected - implement gradient clipping');
    return {
      issue: 'exploding_gradients',
      suggestion: 'Add gradient clipping with max_norm=1.0'
    };
  }
  
  return { issue: 'unknown', suggestion: 'Review training data quality' };
}
```

**Forge Connection Issues**:
```javascript
// Symptom: Forge games failing to start or complete
async function diagnoseForgeIssues(gameId) {
  const gameData = await getForgeGameData(gameId);
  
  // Check process status
  if (gameData.processStatus === 'terminated') {
    console.log('Forge process terminated unexpectedly');
    return {
      issue: 'process_termination',
      suggestion: 'Check Forge logs and restart process'
    };
  }
  
  // Check communication timeout
  if (gameData.lastResponse > Date.now() - 30000) {
    console.log('Forge communication timeout');
    return {
      issue: 'communication_timeout',
      suggestion: 'Increase timeout or check network connectivity'
    };
  }
  
  return { issue: 'unknown', suggestion: 'Review Forge configuration' };
}
```

### 2. Logging and Monitoring

**Structured Logging for AI Components**:
```javascript
class AILogger {
  constructor(component) {
    this.component = component;
    this.logs = [];
  }
  
  logDecision(gameState, decision, confidence) {
    const logEntry = {
      timestamp: Date.now(),
      component: this.component,
      type: 'decision',
      gameState: sanitizeGameState(gameState),
      decision: decision,
      confidence: confidence,
      metadata: {
        turn: gameState.turn,
        phase: gameState.phase,
        availableMana: gameState.playerMana
      }
    };
    
    this.logs.push(logEntry);
    console.log(`[${this.component}] Decision: ${decision.action} (confidence: ${confidence})`);
  }
  
  logTrainingProgress(metrics) {
    const logEntry = {
      timestamp: Date.now(),
      component: this.component,
      type: 'training_progress',
      metrics: metrics,
      metadata: {
        sessionId: metrics.sessionId,
        gamesCompleted: metrics.gamesCompleted,
        currentLoss: metrics.currentLoss
      }
    };
    
    this.logs.push(logEntry);
    console.log(`[${this.component}] Training: ${metrics.gamesCompleted} games, loss: ${metrics.currentLoss}`);
  }
  
  logError(error, context) {
    const logEntry = {
      timestamp: Date.now(),
      component: this.component,
      type: 'error',
      error: error.message,
      stack: error.stack,
      context: context
    };
    
    this.logs.push(logEntry);
    console.error(`[${this.component}] Error: ${error.message}`, context);
  }
}
```

**Performance Monitoring**:
```javascript
class AIPerformanceMonitor {
  constructor() {
    this.metrics = {
      decisionTimes: [],
      trainingSpeeds: [],
      memoryUsage: [],
      errorRates: []
    };
  }
  
  trackDecisionTime(decisionTime) {
    this.metrics.decisionTimes.push({
      timestamp: Date.now(),
      value: decisionTime
    });
    
    // Keep only recent measurements
    if (this.metrics.decisionTimes.length > 1000) {
      this.metrics.decisionTimes = this.metrics.decisionTimes.slice(-500);
    }
  }
  
  trackTrainingSpeed(gamesPerHour) {
    this.metrics.trainingSpeeds.push({
      timestamp: Date.now(),
      value: gamesPerHour
    });
  }
  
  getPerformanceReport() {
    return {
      decisionTime: {
        average: calculateAverage(this.metrics.decisionTimes.map(m => m.value)),
        p95: calculatePercentile(this.metrics.decisionTimes.map(m => m.value), 95),
        p99: calculatePercentile(this.metrics.decisionTimes.map(m => m.value), 99)
      },
      trainingSpeed: {
        average: calculateAverage(this.metrics.trainingSpeeds.map(m => m.value)),
        trend: calculateTrend(this.metrics.trainingSpeeds.map(m => m.value))
      },
      memoryUsage: {
        current: process.memoryUsage().heapUsed,
        peak: Math.max(...this.metrics.memoryUsage.map(m => m.value))
      },
      errorRate: {
        recent: calculateErrorRate(this.metrics.errorRates.slice(-100))
      }
    };
  }
}
```

### 3. Debugging Tools

**Interactive Debugging Interface**:
```javascript
// Add to development API
export async function POST(request) {
  const { action, debugData } = await request.json();
  
  switch (action) {
    case 'debug_bot_decision':
      const bot = new SimpleBot();
      Object.assign(bot, debugData.gameState);
      
      const decisions = bot.makeDecision(
        debugData.opponentLife,
        debugData.opponentCreatures
      );
      
      return Response.json({
        gameState: debugData.gameState,
        decisions: decisions,
        decisionProcess: bot.getDecisionProcess()  // Internal decision logic
      });
      
    case 'debug_neural_prediction':
      const model = await loadModel(debugData.modelId);
      const prediction = model.predict(debugData.gameState);
      
      return Response.json({
        gameState: debugData.gameState,
        prediction: prediction,
        attentionWeights: model.getAttentionWeights(),
        activationPatterns: model.getActivationPatterns()
      });
      
    case 'debug_forge_game':
      const forgeGame = await getForgeGameData(debugData.gameId);
      return Response.json({
        gameState: forgeGame.state,
        processStatus: forgeGame.processStatus,
        communicationLog: forgeGame.communicationLog,
        errorLog: forgeGame.errorLog
      });
  }
}
```

## AI Performance Optimization

### 1. Training Speed Optimization

**Batch Processing Optimization**:
```javascript
class OptimizedTrainingBatch {
  constructor(batchSize, prefetchSize = 2) {
    this.batchSize = batchSize;
    this.prefetchSize = prefetchSize;
    this.currentBatch = [];
    this.prefetchedBatches = [];
    this.isProcessing = false;
  }
  
  async addGame(gameData) {
    this.currentBatch.push(gameData);
    
    if (this.currentBatch.length >= this.batchSize) {
      await this.processBatch();
    }
    
    // Prefetch next batches
    if (this.prefetchedBatches.length < this.prefetchSize) {
      this.prefetchNextBatch();
    }
  }
  
  async processBatch() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const batch = this.currentBatch;
    this.currentBatch = [];
    
    try {
      // Process batch in parallel
      const processedData = await Promise.all(
        batch.map(game => this.processGame(game))
      );
      
      // Update model with batch
      await this.updateModel(processedData);
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  async prefetchNextBatch() {
    const nextBatch = await this.generateNextBatch();
    this.prefetchedBatches.push(nextBatch);
  }
}
```

**Memory Management**:
```javascript
class MemoryOptimizedTrainer {
  constructor(config) {
    this.config = config;
    this.memoryBudget = config.memoryBudget || 1024 * 1024 * 1024;  // 1GB
    this.currentMemory = 0;
    this.cache = new LRUCache(1000);  // Cache recent computations
  }
  
  async trainBatch(games) {
    // Estimate memory usage
    const estimatedMemory = this.estimateMemoryUsage(games);
    
    if (estimatedMemory > this.memoryBudget) {
      // Process in smaller chunks
      const chunks = this.splitIntoMemorySafeChunks(games);
      for (const chunk of chunks) {
        await this.processChunk(chunk);
        this.clearMemory();
      }
    } else {
      await this.processChunk(games);
    }
  }
  
  estimateMemoryUsage(games) {
    // Estimate based on game state size and model parameters
    const gameStateSize = 1000;  // bytes per game state
    const modelSize = this.config.modelSize || 100 * 1024 * 1024;  // 100MB
    const batchSize = games.length;
    
    return (gameStateSize * batchSize) + modelSize;
  }
  
  clearMemory() {
    // Clear intermediate caches
    this.cache.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}
```

### 2. Model Optimization

**Model Pruning**:
```javascript
async function pruneModel(model, pruningConfig) {
  const { targetSparsity, method = 'magnitude' } = pruningConfig;
  
  // Calculate importance scores for each parameter
  const importanceScores = await calculateParameterImportance(model);
  
  // Determine pruning threshold
  const threshold = calculatePruningThreshold(importanceScores, targetSparsity);
  
  // Apply pruning mask
  const prunedModel = applyPruningMask(model, importanceScores, threshold);
  
  // Fine-tune pruned model
  const fineTunedModel = await fineTuneModel(prunedModel, {
    epochs: 10,
    learningRate: 0.0001
  });
  
  return fineTunedModel;
}
```

**Quantization**:
```javascript
async function quantizeModel(model, quantizationConfig) {
  const { precision = 'int8', calibrationData } = quantizationConfig;
  
  // Calibrate quantization parameters
  const calibrationStats = await calculateCalibrationStats(
    model, 
    calibrationData
  );
  
  // Apply quantization
  const quantizedModel = applyQuantization(
    model, 
    calibrationStats, 
    precision
  );
  
  // Verify quantization accuracy
  const accuracyLoss = await measureQuantizationAccuracy(
    model,
    quantizedModel,
    calibrationData
  );
  
  if (accuracyLoss > 0.01) {  // 1% accuracy loss threshold
    console.warn('Quantization accuracy loss exceeds threshold');
    return model;  // Return original model
  }
  
  return quantizedModel;
}
```

### 3. Inference Optimization

**Caching Strategy**:
```javascript
class AIDecisionCache {
  constructor(maxSize = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hitRate = 0;
    this.totalRequests = 0;
  }
  
  async getDecision(gameState) {
    this.totalRequests++;
    
    const cacheKey = this.generateCacheKey(gameState);
    
    if (this.cache.has(cacheKey)) {
      this.hitRate++;
      return this.cache.get(cacheKey);
    }
    
    // Compute decision
    const decision = await this.computeDecision(gameState);
    
    // Cache result
    this.cache.set(cacheKey, decision);
    
    // Evict oldest entries if cache is full
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    return decision;
  }
  
  generateCacheKey(gameState) {
    // Create deterministic hash of game state
    const stateString = JSON.stringify(gameState);
    return crypto.createHash('md5').update(stateString).digest('hex');
  }
  
  getHitRate() {
    return this.totalRequests > 0 ? this.hitRate / this.totalRequests : 0;
  }
}
```

**Batch Inference**:
```javascript
class BatchInferenceOptimizer {
  constructor(model, maxBatchSize = 32, maxWaitTime = 10) {
    this.model = model;
    this.maxBatchSize = maxBatchSize;
    this.maxWaitTime = maxWaitTime;
    this.pendingRequests = [];
    this.batchTimeout = null;
  }
  
  async predict(gameState) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ gameState, resolve, reject });
      
      // Start batch timer if not already running
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.maxWaitTime);
      }
      
      // Process immediately if batch is full
      if (this.pendingRequests.length >= this.maxBatchSize) {
        clearTimeout(this.batchTimeout);
        this.processBatch();
      }
    });
  }
  
  async processBatch() {
    const requests = this.pendingRequests.splice(0);
    this.batchTimeout = null;
    
    if (requests.length === 0) return;
    
    try {
      // Prepare batch input
      const batchInput = requests.map(req => req.gameState);
      
      // Perform batch inference
      const batchOutput = await this.model.predictBatch(batchInput);
      
      // Resolve individual requests
      requests.forEach((req, index) => {
        req.resolve(batchOutput[index]);
      });
      
    } catch (error) {
      // Reject all requests on error
      requests.forEach(req => {
        req.reject(error);
      });
    }
  }
}
```

## AI Development Best Practices

### 1. Code Organization

**File Structure for AI Components**:
```
src/app/api/
├── bot/
│   ├── simple/
│   │   ├── route.js              # Simple bot implementation
│   │   ├── decision-logic.js     # Decision making algorithms
│   │   └── game-state.js         # Game state management
│   ├── neural/
│   │   ├── route.js              # Neural bot API
│   │   ├── model.js              # Neural network model
│   │   ├── training.js           # Training logic
│   │   └── inference.js          # Inference optimization
│   └── hybrid/
│       ├── route.js              # Hybrid training API
│       ├── coordinator.js        # Training coordination
│       └── integration.js         # System integration
├── training/
│   ├── control/
│   │   ├── route.js              # Training session control
│   │   └── session-manager.js    # Session management
│   ├── status/
│   │   ├── route.js              # Training status API
│   │   └── metrics-collector.js  # Metrics collection
│   └── optimization/
│       ├── route.js              # Training optimization API
│       └── performance-tuner.js   # Performance tuning
├── models/
│   ├── neural/
│   │   ├── route.js              # Model management API
│   │   ├── model-registry.js     # Model versioning
│   │   └── model-evaluator.js    # Model evaluation
│   └── deployment/
│       ├── route.js              # Model deployment API
│       └── deployment-manager.js # Deployment management
└── forge/
    ├── integration/
    │   ├── route.js              # Forge integration API
    │   ├── process-manager.js    # Forge process management
    │   └── communication.js      # Communication layer
    ├── scaling/
    │   ├── route.js              # Forge scaling API
    │   └── load-balancer.js      # Load balancing
    └── monitoring/
        ├── route.js              # Forge monitoring API
        └── health-checker.js     # Health monitoring
```

### 2. Documentation Standards

**AI Component Documentation**:
```javascript
/**
 * SimpleBot - Rule-based MTG AI implementation
 * 
 * Purpose: Provides a foundational MTG AI for proof-of-concept, testing, and demonstration
 * 
 * Architecture:
 * - Decision-making: Priority-based action selection
 * - Game state: Tracks life, mana, cards, creatures, and turn information
 * - Strategy layers: Early game (creatures), mid game (attacks), late game (finishers)
 * 
 * Key Methods:
 * - makeDecision(opponentLife, opponentCreatures): Returns prioritized action list
 * - executeDecision(decision): Executes chosen action and returns result
 * - startTurn(): Advances turn state and resources
 * 
 * Usage:
 * ```javascript
 * const bot = new SimpleBot(20);  // Start with 20 life
 * bot.startTurn();
 * const decisions = bot.makeDecision(15, 1);  // Opponent has 15 life, 1 creature
 * const result = bot.executeDecision(decisions[0]);
 * ```
 * 
 * Performance:
 * - Decision time: <100ms for real-time play
 * - Memory usage: <10MB per bot instance
 * - Concurrency: Supports multiple instances
 */
class SimpleBot {
  // ... implementation
}
```

### 3. Testing Standards

**AI Testing Pyramid**:
```
                    /\
                   /  \
                  /    \
                 /      \
                /        \
               /          \
              /            \
             /              \
            /                \
           /                  \
          /                    \
         /                      \
        /                        \
       /                          \
      /                            \
     /                              \
    /                                \
   /                                  \
  /                                    \
 /                                      \
/========================================\
|               Unit Tests                |
| - Bot decision logic                   |
| - Neural network layers               |
| - Training algorithms                 |
| - Forge integration                  |
|========================================|
|             Integration Tests           |
| - API endpoints                       |
| - Training sessions                   |
| - Model deployment                   |
| - Forge communication                 |
|========================================|
|              System Tests              |
| - End-to-end training                |
| - Performance benchmarks             |
| - Resource usage                     |
| - Error recovery                     |
|========================================|
```

### 4. Performance Standards

**AI Performance Benchmarks**:
```javascript
const AIPerformanceStandards = {
  // Decision making performance
  decisionMaking: {
    maxResponseTime: 100,        // ms
    minAccuracy: 0.7,           // 70% win rate
    maxMemoryUsage: 10 * 1024 * 1024,  // 10MB
    throughput: 1000            // decisions per second
  },
  
  // Training performance
  training: {
    minGamesPerHour: 500,       // games per hour
    maxMemoryUsage: 1024 * 1024 * 1024,  // 1GB
    convergenceThreshold: 0.001,
    minBatchSize: 32,
    maxBatchSize: 256
  },
  
  // Model performance
  models: {
    minWinRate: 0.6,            // 60% against baseline
    maxModelSize: 100 * 1024 * 1024,  // 100MB
    maxInferenceTime: 50,      // ms
    minAccuracy: 0.8           // 80% prediction accuracy
  },
  
  // System performance
  system: {
    maxCpuUsage: 80,           // percentage
    maxMemoryUsage: 2048 * 1024 * 1024,  // 2GB
    maxErrorRate: 0.01,         // 1% error rate
    uptime: 0.999               // 99.9% uptime
  }
};
```

### 5. Security Standards

**AI Security Considerations**:
```javascript
const AISecurityGuidelines = {
  // Model security
  modelProtection: {
    encryptModelFiles: true,
    validateModelHashes: true,
    restrictModelAccess: true,
    auditModelUsage: true
  },
  
  // Training data security
  dataProtection: {
    encryptTrainingData: true,
    anonymizeGameData: true,
    validateDataSources: true,
    auditDataAccess: true
  },
  
  // API security
  apiSecurity: {
    authenticateAllRequests: true,
    rateLimitEndpoints: true,
    validateInputData: true,
    auditApiUsage: true
  },
  
  // System security
  systemSecurity: {
    isolateTrainingProcesses: true,
    restrictNetworkAccess: true,
    monitorResourceUsage: true,
    implementFailSafes: true
  }
};
```

## Conclusion

This comprehensive AI training development guide provides the foundation for working with the ManaMind Training System's sophisticated AI components. By following these guidelines, developers can effectively:

1. **Understand the AI architecture** and how different components interact
2. **Implement new AI features** using established patterns and best practices
3. **Optimize performance** for training speed, model efficiency, and resource usage
4. **Debug issues** systematically using structured logging and monitoring
5. **Test thoroughly** at unit, integration, and system levels
6. **Maintain code quality** through proper organization and documentation

The focus on AI training development ensures that the system continues to evolve and improve, providing increasingly sophisticated MTG AI capabilities while maintaining performance, reliability, and scalability.

For additional guidance on general development workflows, technical architecture, and deployment procedures, refer to the other documentation files in the `.clinerules/` directory.
