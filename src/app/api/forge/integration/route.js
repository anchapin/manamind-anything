import sql from "@/app/api/utils/sql";

// Real Forge AI Integration API
export async function POST(request) {
  try {
    const { action, gameId, config, moveData } = await request.json();

    switch (action) {
      case "start_game":
        return await startRealForgeGame(config);
      case "get_state":
        return await getRealGameState(gameId);
      case "make_move":
        return await makeRealMove(gameId, moveData);
      case "end_game":
        return await endRealGame(gameId);
      case "get_deck_list":
        return await getDeckList();
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Real Forge integration error:", error);
    return Response.json(
      { error: "Forge integration failed" },
      { status: 500 },
    );
  }
}

async function startRealForgeGame(config) {
  // Launch actual Forge process
  const launchResponse = await fetch(
    `${process.env.BASE_URL || "http://localhost:3000"}/api/forge/process`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "launch_forge",
        config: {
          aiDifficulty: config.aiDifficulty?.toUpperCase() || "MEDIUM",
          gameMode: config.gameMode || "Constructed",
          playerDeck: config.playerDeck || "Default_Aggro",
          aiDeck: config.opponentDeck || "Default_Control",
          format: config.format || "Standard",
          memory: config.memory || "2G",
          logLevel: "INFO",
        },
      }),
    },
  );

  const launchResult = await launchResponse.json();

  if (!launchResult.success) {
    return Response.json(
      {
        success: false,
        error: "Failed to launch Forge",
        details: launchResult.details || launchResult.error,
      },
      { status: 500 },
    );
  }

  // Wait a moment for game to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Get initial game state from Forge
  const stateResponse = await fetch(
    `${process.env.BASE_URL || "http://localhost:3000"}/api/forge/process`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_game_state",
        gameId: launchResult.gameId,
      }),
    },
  );

  const stateResult = await stateResponse.json();

  return Response.json({
    success: true,
    gameId: launchResult.gameId,
    processId: launchResult.processId,
    gameState: stateResult.gameState || {
      gameId: launchResult.gameId,
      status: "active",
      phase: "beginning",
      turn: 1,
      activePlayer: "human",
      message: "Real Forge game started - waiting for initial state",
    },
    forgeConfig: launchResult.config,
    message: "Real Forge game launched successfully",
  });
}

async function getRealGameState(gameId) {
  // Get current state from Forge process
  const response = await fetch(
    `${process.env.BASE_URL || "http://localhost:3000"}/api/forge/process`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_game_state",
        gameId,
      }),
    },
  );

  const result = await response.json();

  if (!result.success) {
    return Response.json({ error: "Game state not found" }, { status: 404 });
  }

  // Also update database with current state
  if (result.gameState) {
    await sql`
      UPDATE games 
      SET game_data = ${JSON.stringify(result.gameState)},
          turn_count = ${result.gameState.turn || 0},
          player1_life = ${result.gameState.players?.human?.life || 20},
          player2_life = ${result.gameState.players?.ai?.life || 20},
          status = ${result.gameState.status === "completed" ? "completed" : "active"}
      WHERE session_id = ${gameId}
    `;
  }

  return Response.json({
    success: true,
    gameId,
    gameState: result.gameState,
    processStatus: result.processStatus,
    lastUpdate: result.lastUpdate,
  });
}

async function makeRealMove(gameId, moveData) {
  // Send move to real Forge process
  const response = await fetch(
    `${process.env.BASE_URL || "http://localhost:3000"}/api/forge/process`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_command",
        gameId,
        command: {
          action: moveData.actionId,
          params: moveData.params || {},
          target: moveData.target,
          cardId: moveData.cardId,
          amount: moveData.amount,
        },
      }),
    },
  );

  const result = await response.json();

  if (!result.success) {
    return Response.json(
      {
        success: false,
        error: "Failed to send move to Forge",
        details: result.error,
      },
      { status: 500 },
    );
  }

  // Get updated game state after move
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Allow Forge to process

  const stateResponse = await getRealGameState(gameId);
  const stateData = await stateResponse.json();

  return Response.json({
    success: true,
    gameId,
    moveResult: {
      success: true,
      move: moveData,
      effects: [`Command '${moveData.actionId}' sent to Forge`],
      newGameState: stateData.gameState,
    },
    gameState: stateData.gameState,
  });
}

async function endRealGame(gameId) {
  // Shutdown Forge process
  const response = await fetch(
    `${process.env.BASE_URL || "http://localhost:3000"}/api/forge/process`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "shutdown_forge",
        gameId,
      }),
    },
  );

  const result = await response.json();

  // Get final game state from database
  const [game] = await sql`
    SELECT * FROM games WHERE session_id = ${gameId}
  `;

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  // Calculate final duration
  const duration = Math.floor((Date.now() - new Date(game.created_at)) / 1000);

  await sql`
    UPDATE games 
    SET status = 'completed',
        completed_at = NOW(),
        duration_seconds = ${duration}
    WHERE session_id = ${gameId}
  `;

  return Response.json({
    success: true,
    gameId,
    duration,
    finalState: game.game_data,
    processShutdown: result.success,
    message: "Real Forge game ended successfully",
  });
}

async function getDeckList() {
  // Return available deck archetypes for Forge
  const decks = [
    {
      name: "Aggro Red",
      type: "aggro",
      colors: ["red"],
      description: "Fast aggressive deck with burn spells",
      cards: 60,
      archetype: "aggro",
    },
    {
      name: "Control Blue",
      type: "control",
      colors: ["blue"],
      description: "Counterspells and card draw",
      cards: 60,
      archetype: "control",
    },
    {
      name: "Midrange Green",
      type: "midrange",
      colors: ["green"],
      description: "Efficient creatures and ramp",
      cards: 60,
      archetype: "midrange",
    },
    {
      name: "Combo Deck",
      type: "combo",
      colors: ["blue", "black"],
      description: "Win through powerful card interactions",
      cards: 60,
      archetype: "combo",
    },
  ];

  return Response.json({
    success: true,
    decks,
  });
}

export async function GET() {
  // Get active real Forge games from process manager
  try {
    const processResponse = await fetch(
      `${process.env.BASE_URL || "http://localhost:3000"}/api/forge/process`,
      {
        method: "GET",
      },
    );

    let activeProcesses = [];
    if (processResponse.ok) {
      const processResult = await processResponse.json();
      activeProcesses = processResult.instances || [];
    }

    // Also get database records
    const forgeGames = await sql`
      SELECT 
        session_id as game_id,
        status,
        player1_type,
        player2_type,
        turn_count,
        player1_life,
        player2_life,
        duration_seconds,
        created_at,
        game_data
      FROM games 
      WHERE game_type IN ('vs_forge_real', 'vs_forge_ai')
      AND status IN ('active', 'starting', 'paused')
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const gamesWithProcessInfo = forgeGames.map((game) => {
      const processInfo = activeProcesses.find(
        (p) => p.gameId === game.game_id,
      );
      return {
        gameId: game.game_id,
        status: game.status,
        players: {
          ai: game.player1_type,
          opponent: game.player2_type,
        },
        state: {
          turn: game.turn_count,
          player1Life: game.player1_life,
          player2Life: game.player2_life,
          duration: game.duration_seconds,
        },
        started: game.created_at,
        processInfo: processInfo
          ? {
              processId: processInfo.processId,
              uptime: processInfo.uptime,
              processStatus: processInfo.status,
            }
          : null,
        isReal: game.game_type === "vs_forge_real",
      };
    });

    return Response.json({
      success: true,
      activeGames: gamesWithProcessInfo,
      activeProcesses: activeProcesses.length,
      message: "Real Forge integration active",
    });
  } catch (error) {
    console.error("Error fetching real Forge games:", error);
    return Response.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}
