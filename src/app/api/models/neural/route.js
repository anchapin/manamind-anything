import sql from "@/app/api/utils/sql";

// Neural Network Model Management API
export async function POST(request) {
  try {
    const { action, modelVersion, config } = await request.json();

    switch (action) {
      case "create":
        return await createModel(config);
      case "train":
        return await trainModel(modelVersion, config);
      case "evaluate":
        return await evaluateModel(modelVersion, config);
      case "predict":
        return await getPrediction(modelVersion, config.gameState);
      // --- additions: deploy/promotion & rollback ---
      case "deploy":
      case "promote":
        return await deployModel(modelVersion);
      case "rollback":
        // for simplicity, rollback just deploys the specified previous version
        return await deployModel(modelVersion);
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Neural model API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function createModel(config) {
  const version = `v${Date.now()}`;

  // Create neural network architecture
  const modelData = {
    architecture: "alphazero",
    layers: {
      // Game state encoder (board, hand, life, mana, etc.)
      encoder: {
        type: "dense",
        sizes: [512, 256, 128],
        activation: "relu",
      },
      // Policy head - predicts action probabilities
      policy: {
        type: "dense",
        sizes: [128, 64, config.actionSpace || 200], // ~200 possible actions per turn
        activation: ["relu", "relu", "softmax"],
      },
      // Value head - predicts win probability
      value: {
        type: "dense",
        sizes: [128, 64, 1],
        activation: ["relu", "relu", "tanh"],
      },
    },
    hyperparameters: {
      learningRate: config.learningRate || 0.001,
      batchSize: config.batchSize || 32,
      epochs: config.epochs || 100,
      regularization: 0.0001,
    },
    gameStateSize: 150, // Cards in hand, field, life, mana, etc.
    created: new Date().toISOString(),
  };

  // Store model in database
  await sql`
    INSERT INTO models (version, name, description, architecture, status, model_data)
    VALUES (
      ${version},
      ${config.name || `Neural Model ${version}`},
      ${config.description || "AlphaZero-style neural network for MTG"},
      'alphazero',
      'initialized',
      ${JSON.stringify(modelData)}
    )
  `;

  return Response.json({
    success: true,
    version,
    modelData,
    message: "Neural network model created successfully",
  });
}

async function trainModel(modelVersion, config) {
  // Start training process
  const trainingConfig = {
    selfPlayGames: config.selfPlayGames || 1000,
    trainingIterations: config.trainingIterations || 10,
    mctsSimulations: config.mctsSimulations || 100,
    cpuct: config.cpuct || 1.0, // MCTS exploration parameter
    tempThreshold: config.tempThreshold || 15, // Temperature for action selection
  };

  // Update model status and create training session
  const [model] = await sql`
    UPDATE models 
    SET status = 'training',
        model_data = model_data || ${JSON.stringify({ trainingConfig })}
    WHERE version = ${modelVersion}
    RETURNING *
  `;

  if (!model) {
    return Response.json({ error: "Model not found" }, { status: 404 });
  }

  // Create training session
  await sql`
    INSERT INTO training_sessions (name, model_version, target_games, config)
    VALUES (
      ${`Neural Training ${modelVersion}`},
      ${modelVersion},
      ${trainingConfig.selfPlayGames},
      ${JSON.stringify(trainingConfig)}
    )
  `;

  // In a real implementation, this would start the actual training process
  // For now, we'll simulate training progress
  setTimeout(() => simulateTraining(modelVersion), 1000);

  return Response.json({
    success: true,
    message: "Neural network training started",
    config: trainingConfig,
  });
}

async function simulateTraining(modelVersion) {
  // Simulate training progress (replace with actual training loop)
  const iterations = 10;

  for (let i = 0; i < iterations; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate training time

    const gamesThisIteration = 100;
    const winRate = 0.45 + i * 0.05 + Math.random() * 0.1; // Gradually improve
    const policyLoss = 2.5 - i * 0.2 + Math.random() * 0.1;
    const valueLoss = 1.8 - i * 0.15 + Math.random() * 0.05;

    // Update training session
    await sql`
      UPDATE training_sessions 
      SET games_completed = games_completed + ${gamesThisIteration},
          win_rate = ${winRate},
          updated_at = NOW()
      WHERE model_version = ${modelVersion} AND status = 'running'
    `;

    // Log metrics
    await sql`
      INSERT INTO performance_metrics (model_version, metric_name, metric_value, game_count)
      VALUES 
        (${modelVersion}, 'win_rate', ${winRate}, ${(i + 1) * gamesThisIteration}),
        (${modelVersion}, 'policy_loss', ${policyLoss}, ${(i + 1) * gamesThisIteration}),
        (${modelVersion}, 'value_loss', ${valueLoss}, ${(i + 1) * gamesThisIteration})
    `;
  }

  // Mark training as complete
  await sql`
    UPDATE models SET status = 'trained' WHERE version = ${modelVersion}
  `;

  await sql`
    UPDATE training_sessions SET status = 'completed' WHERE model_version = ${modelVersion}
  `;
}

async function evaluateModel(modelVersion, config) {
  // Evaluate model against opponents
  const opponents = config.opponents || ["rule_based", "random"];
  const gamesPerOpponent = config.gamesPerOpponent || 100;

  const results = [];

  for (const opponent of opponents) {
    // Simulate evaluation games
    const wins = Math.floor(gamesPerOpponent * (0.6 + Math.random() * 0.3));
    const winRate = wins / gamesPerOpponent;

    results.push({
      opponent,
      gamesPlayed: gamesPerOpponent,
      wins,
      losses: gamesPerOpponent - wins,
      winRate: winRate.toFixed(3),
    });

    // Store in matchup stats
    await sql`
      INSERT INTO matchup_stats (model_version, opponent_type, games_played, games_won, win_rate)
      VALUES (${modelVersion}, ${opponent}, ${gamesPerOpponent}, ${wins}, ${winRate})
    `;
  }

  return Response.json({
    success: true,
    modelVersion,
    evaluationResults: results,
  });
}

async function getPrediction(modelVersion, gameState) {
  // Neural network prediction (simplified)
  // In reality, this would run the actual model

  const [model] = await sql`
    SELECT * FROM models WHERE version = ${modelVersion} AND status IN ('trained', 'deployed')
  `;

  if (!model) {
    return Response.json(
      { error: "Model not found or not trained" },
      { status: 404 },
    );
  }

  // Simulate neural network prediction
  const actions = generatePossibleActions(gameState);
  const predictions = actions.map((action) => ({
    action: action.name,
    probability: Math.random(),
    expectedValue: (Math.random() - 0.5) * 2, // -1 to 1
  }));

  // Normalize probabilities
  const totalProb = predictions.reduce((sum, p) => sum + p.probability, 0);
  predictions.forEach((p) => (p.probability = p.probability / totalProb));

  // Sort by probability
  predictions.sort((a, b) => b.probability - a.probability);

  const stateValue = (Math.random() - 0.5) * 2; // Win probability estimate

  return Response.json({
    success: true,
    modelVersion,
    gameState,
    predictions: predictions.slice(0, 5), // Top 5 actions
    stateValue,
    thinkingTime: Math.random() * 2 + 0.5,
  });
}

function generatePossibleActions(gameState) {
  // Generate possible MTG actions based on game state
  const actions = [
    { name: "Play Land", type: "land" },
    { name: "Cast Creature", type: "creature", cost: 3 },
    { name: "Cast Spell", type: "spell", cost: 2 },
    { name: "Attack with Creatures", type: "combat" },
    { name: "Use Ability", type: "ability" },
    { name: "Pass Turn", type: "pass" },
  ];

  return actions;
}

export async function GET() {
  // Get all neural models
  try {
    // ... keep previous join but also compute deployed version ...
    const models = await sql`
      SELECT 
        m.*,
        ts.games_completed,
        ts.win_rate as current_win_rate,
        ts.status as training_status
      FROM models m
      LEFT JOIN training_sessions ts ON ts.model_version = m.version AND ts.status IN ('running', 'completed')
      WHERE m.architecture = 'alphazero'
      ORDER BY m.created_at DESC
    `;

    const [deployed] = await sql`
      SELECT version FROM models WHERE status = 'deployed' ORDER BY deployed_at DESC NULLS LAST LIMIT 1
    `;

    return Response.json({
      success: true,
      deployedVersion: deployed?.version || null,
      models: models.map((model) => ({
        version: model.version,
        name: model.name,
        status: model.status,
        trainingGames: model.training_games || model.games_completed || 0,
        winRate: model.current_win_rate || model.win_rate_vs_forge,
        created: model.created_at,
        deployedAt: model.deployed_at,
        architecture: model.model_data?.architecture || "alphazero",
      })),
    });
  } catch (error) {
    console.error("Error fetching neural models:", error);
    return Response.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

// --- new helper: promote/deploy a model, making it the single active deployment ---
async function deployModel(modelVersion) {
  if (!modelVersion) {
    return Response.json(
      { error: "modelVersion is required" },
      { status: 400 },
    );
  }

  const [exists] =
    await sql`SELECT version, status FROM models WHERE version = ${modelVersion}`;
  if (!exists) {
    return Response.json({ error: "Model not found" }, { status: 404 });
  }

  try {
    const [_, updated] = await sql.transaction((txn) => [
      txn`UPDATE models SET status = 'trained' WHERE status = 'deployed'`,
      txn`UPDATE models SET status = 'deployed', deployed_at = NOW() WHERE version = ${modelVersion} RETURNING *`,
    ]);

    const deployedModel = Array.isArray(updated) ? updated[0] : null;

    return Response.json({
      success: true,
      message: `Deployed ${modelVersion}`,
      deployed: deployedModel
        ? {
            version: deployedModel.version,
            deployedAt: deployedModel.deployed_at,
          }
        : { version: modelVersion },
    });
  } catch (err) {
    console.error("Deploy failed:", err);
    return Response.json({ error: "Failed to deploy model" }, { status: 500 });
  }
}
