import sql from "@/app/api/utils/sql";
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Forge Process Management API
export async function POST(request) {
  try {
    const { action, gameId, config, command } = await request.json();
    
    switch (action) {
      case 'launch_forge':
        return await launchForgeInstance(config);
      case 'send_command':
        return await sendForgeCommand(gameId, command);
      case 'get_game_state':
        return await getForgeGameState(gameId);
      case 'shutdown_forge':
        return await shutdownForgeInstance(gameId);
      case 'list_instances':
        return await listForgeInstances();
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Forge process error:', error);
    return Response.json({ error: 'Forge process management failed' }, { status: 500 });
  }
}

// Store active Forge processes
const forgeProcesses = new Map();
const gameStates = new Map();

async function launchForgeInstance(config) {
  const gameId = `forge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Forge configuration
    const forgeConfig = {
      forgePath: process.env.FORGE_PATH || '/opt/forge',
      javaPath: process.env.JAVA_PATH || 'java',
      memory: config.memory || '2G',
      aiDifficulty: config.aiDifficulty || 'MEDIUM',
      gameMode: config.gameMode || 'Constructed',
      playerDeck: config.playerDeck || 'Default_Aggro',
      aiDeck: config.aiDeck || 'Default_Control',
      format: config.format || 'Standard',
      logLevel: config.logLevel || 'INFO'
    };

    // Create Forge command arguments
    const forgeArgs = [
      `-Xmx${forgeConfig.memory}`,
      `-jar`, `${forgeConfig.forgePath}/forge-gui-desktop.jar`,
      `--headless`,
      `--ai-difficulty=${forgeConfig.aiDifficulty}`,
      `--game-mode=${forgeConfig.gameMode}`,
      `--player-deck=${forgeConfig.playerDeck}`,
      `--ai-deck=${forgeConfig.aiDeck}`,
      `--format=${forgeConfig.format}`,
      `--log-level=${forgeConfig.logLevel}`,
      `--api-mode`,
      `--game-id=${gameId}`
    ];

    console.log(`Launching Forge with: ${forgeConfig.javaPath} ${forgeArgs.join(' ')}`);

    // Spawn Forge process
    const forgeProcess = spawn(forgeConfig.javaPath, forgeArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: forgeConfig.forgePath,
      env: {
        ...process.env,
        FORGE_API_MODE: 'true',
        FORGE_GAME_ID: gameId
      }
    });

    // Handle process events
    forgeProcess.on('error', (error) => {
      console.error(`Forge process error for ${gameId}:`, error);
      forgeProcesses.delete(gameId);
      gameStates.delete(gameId);
    });

    forgeProcess.on('exit', (code, signal) => {
      console.log(`Forge process ${gameId} exited with code ${code}, signal ${signal}`);
      forgeProcesses.delete(gameId);
      gameStates.delete(gameId);
    });

    // Set up communication handlers
    let outputBuffer = '';
    let gameStarted = false;

    forgeProcess.stdout.on('data', (data) => {
      outputBuffer += data.toString();
      
      // Process complete JSON messages
      const lines = outputBuffer.split('\n');
      outputBuffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line.trim());
            handleForgeMessage(gameId, message);
            
            if (message.type === 'GAME_STARTED') {
              gameStarted = true;
            }
          } catch (e) {
            console.log(`Forge ${gameId} output:`, line);
          }
        }
      }
    });

    forgeProcess.stderr.on('data', (data) => {
      console.error(`Forge ${gameId} stderr:`, data.toString());
    });

    // Store process reference
    forgeProcesses.set(gameId, {
      process: forgeProcess,
      config: forgeConfig,
      started: Date.now(),
      status: 'starting'
    });

    // Initialize game state
    gameStates.set(gameId, {
      gameId,
      status: 'initializing',
      phase: 'pre_game',
      turn: 0,
      activePlayer: null,
      players: {
        human: {
          name: 'ManaMind',
          life: 20,
          mana: {},
          hand: [],
          battlefield: [],
          library: 60,
          graveyard: []
        },
        ai: {
          name: `Forge ${forgeConfig.aiDifficulty}`,
          life: 20,
          mana: {},
          hand: [],
          battlefield: [],
          library: 60,
          graveyard: []
        }
      },
      availableActions: [],
      lastUpdate: Date.now()
    });

    // Store game in database
    await sql`
      INSERT INTO games (
        session_id, game_type, status, player1_type, player2_type,
        player1_life, player2_life, game_format, game_data
      ) VALUES (
        ${gameId},
        'vs_forge_real',
        'starting',
        'manamind_neural',
        ${`forge_${forgeConfig.aiDifficulty.toLowerCase()}`},
        20,
        20,
        ${forgeConfig.format},
        ${JSON.stringify({ forgeConfig, processId: forgeProcess.pid })}
      )
    `;

    // Wait for initial game setup (with timeout)
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 10000); // 10 second timeout
      const checkStarted = () => {
        if (gameStarted || !forgeProcesses.has(gameId)) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkStarted, 500);
        }
      };
      checkStarted();
    });

    const processInfo = forgeProcesses.get(gameId);
    if (processInfo) {
      processInfo.status = gameStarted ? 'running' : 'failed';
    }

    return Response.json({
      success: true,
      gameId,
      processId: forgeProcess.pid,
      status: gameStarted ? 'running' : 'starting',
      config: forgeConfig,
      message: gameStarted ? 'Forge launched successfully' : 'Forge launching (may take a moment)'
    });

  } catch (error) {
    console.error('Failed to launch Forge:', error);
    
    // Cleanup on failure
    const processInfo = forgeProcesses.get(gameId);
    if (processInfo && processInfo.process) {
      processInfo.process.kill();
      forgeProcesses.delete(gameId);
    }
    gameStates.delete(gameId);
    
    return Response.json({
      success: false,
      error: 'Failed to launch Forge',
      details: error.message
    }, { status: 500 });
  }
}

function handleForgeMessage(gameId, message) {
  console.log(`Forge ${gameId} message:`, message.type, message);
  
  const currentState = gameStates.get(gameId);
  if (!currentState) return;

  switch (message.type) {
    case 'GAME_STARTED':
      currentState.status = 'active';
      currentState.phase = 'upkeep';
      currentState.activePlayer = message.activePlayer || 'human';
      break;

    case 'GAME_STATE_UPDATE':
      // Update complete game state from Forge
      Object.assign(currentState, {
        turn: message.turn || currentState.turn,
        phase: message.phase || currentState.phase,
        activePlayer: message.activePlayer || currentState.activePlayer,
        players: message.players || currentState.players,
        availableActions: message.availableActions || [],
        lastUpdate: Date.now()
      });
      break;

    case 'PLAYER_ACTION_REQUIRED':
      currentState.availableActions = message.actions || [];
      currentState.waitingForAction = true;
      break;

    case 'GAME_ENDED':
      currentState.status = 'completed';
      currentState.winner = message.winner;
      currentState.finalState = message.finalState;
      
      // Update database
      updateGameInDatabase(gameId, currentState);
      break;

    case 'ERROR':
      console.error(`Forge game ${gameId} error:`, message.error);
      currentState.status = 'error';
      currentState.error = message.error;
      break;
  }

  // Update stored state
  gameStates.set(gameId, currentState);
}

async function sendForgeCommand(gameId, command) {
  const processInfo = forgeProcesses.get(gameId);
  if (!processInfo) {
    return Response.json({ error: 'Forge instance not found' }, { status: 404 });
  }

  try {
    // Send command to Forge stdin
    const commandData = JSON.stringify({
      type: 'COMMAND',
      gameId,
      command: command.action,
      parameters: command.params || {},
      timestamp: Date.now()
    }) + '\n';

    processInfo.process.stdin.write(commandData);

    return Response.json({
      success: true,
      gameId,
      commandSent: command,
      message: 'Command sent to Forge'
    });

  } catch (error) {
    console.error(`Failed to send command to Forge ${gameId}:`, error);
    return Response.json({
      success: false,
      error: 'Failed to send command',
      details: error.message
    }, { status: 500 });
  }
}

async function getForgeGameState(gameId) {
  const gameState = gameStates.get(gameId);
  if (!gameState) {
    return Response.json({ error: 'Game state not found' }, { status: 404 });
  }

  const processInfo = forgeProcesses.get(gameId);
  const processStatus = processInfo ? 'running' : 'stopped';

  return Response.json({
    success: true,
    gameId,
    gameState,
    processStatus,
    lastUpdate: gameState.lastUpdate
  });
}

async function shutdownForgeInstance(gameId) {
  const processInfo = forgeProcesses.get(gameId);
  if (!processInfo) {
    return Response.json({ error: 'Forge instance not found' }, { status: 404 });
  }

  try {
    // Send graceful shutdown command first
    const shutdownCommand = JSON.stringify({
      type: 'SHUTDOWN',
      gameId,
      timestamp: Date.now()
    }) + '\n';

    processInfo.process.stdin.write(shutdownCommand);

    // Wait briefly for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force kill if still running
    if (!processInfo.process.killed) {
      processInfo.process.kill('SIGTERM');
      
      // Wait for termination
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!processInfo.process.killed) {
        processInfo.process.kill('SIGKILL');
      }
    }

    // Cleanup
    forgeProcesses.delete(gameId);
    gameStates.delete(gameId);

    // Update database
    await sql`
      UPDATE games
      SET status = 'terminated', completed_at = NOW()
      WHERE session_id = ${gameId}
    `;

    return Response.json({
      success: true,
      gameId,
      message: 'Forge instance shut down successfully'
    });

  } catch (error) {
    console.error(`Error shutting down Forge ${gameId}:`, error);
    return Response.json({
      success: false,
      error: 'Failed to shutdown Forge instance',
      details: error.message
    }, { status: 500 });
  }
}

async function listForgeInstances() {
  const instances = Array.from(forgeProcesses.entries()).map(([gameId, info]) => ({
    gameId,
    processId: info.process.pid,
    status: info.status,
    started: info.started,
    config: info.config,
    uptime: Date.now() - info.started
  }));

  return Response.json({
    success: true,
    instances,
    count: instances.length
  });
}

async function updateGameInDatabase(gameId, gameState) {
  try {
    await sql`
      UPDATE games
      SET status = ${gameState.status},
          winner = ${gameState.winner || null},
          turn_count = ${gameState.turn},
          player1_life = ${gameState.players?.human?.life || 20},
          player2_life = ${gameState.players?.ai?.life || 20},
          completed_at = ${gameState.status === 'completed' ? 'NOW()' : null},
          game_data = ${JSON.stringify(gameState)}
      WHERE session_id = ${gameId}
    `;
  } catch (error) {
    console.error(`Failed to update game ${gameId} in database:`, error);
  }
}

// Cleanup on process exit
process.on('exit', () => {
  console.log('Shutting down all Forge processes...');
  for (const [gameId, processInfo] of forgeProcesses.entries()) {
    try {
      processInfo.process.kill('SIGTERM');
    } catch (error) {
      console.error(`Error killing Forge process ${gameId}:`, error);
    }
  }
});

export async function GET() {
  // Return status of all Forge instances
  return await listForgeInstances();
}