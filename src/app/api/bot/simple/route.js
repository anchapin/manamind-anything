import sql from "@/app/api/utils/sql";

// Simple rule-based MTG bot for proof of concept
class SimpleBot {
  constructor(life = 20) {
    this.life = life;
    this.mana = 0;
    this.cardsInHand = 7;
    this.creatures = [];
    this.spells = [];
    this.turn = 0;
  }

  // Simulate drawing a card and gaining mana each turn
  startTurn() {
    this.turn++;
    this.mana = Math.min(this.turn, 10); // Max 10 mana
    if (this.cardsInHand < 7) {
      this.cardsInHand++;
    }
  }

  // Simple decision making based on game state
  makeDecision(opponentLife, opponentCreatures = 0) {
    const decisions = [];
    
    // Always play a land if we have less than 10 mana
    if (this.mana < 10) {
      decisions.push({
        action: 'play_land',
        priority: 0.9,
        cost: 0,
        description: 'Play land, pass turn'
      });
    }

    // Cast creatures early game
    if (this.turn <= 4 && this.mana >= 2 && this.cardsInHand > 0) {
      decisions.push({
        action: 'cast_creature',
        priority: 0.8,
        cost: Math.min(this.mana, 4),
        description: 'Cast creature spell'
      });
    }

    // Attack if we have creatures
    if (this.creatures.length > 0) {
      const attackPriority = opponentLife < 10 ? 0.9 : 0.6;
      decisions.push({
        action: 'attack',
        priority: attackPriority,
        cost: 0,
        description: 'Attack with creatures'
      });
    }

    // Cast direct damage if opponent is low
    if (opponentLife <= 6 && this.mana >= 1) {
      decisions.push({
        action: 'lightning_bolt',
        priority: 0.95,
        cost: 1,
        description: 'Cast Lightning Bolt'
      });
    }

    // Cast removal if opponent has creatures
    if (opponentCreatures > 0 && this.mana >= 2) {
      decisions.push({
        action: 'removal',
        priority: 0.7,
        cost: 2,
        description: 'Cast removal spell'
      });
    }

    // Counterspell (defensive)
    if (this.mana >= 2 && opponentCreatures > this.creatures.length) {
      decisions.push({
        action: 'counterspell',
        priority: 0.5,
        cost: 2,
        description: 'Cast counterspell'
      });
    }

    // Sort by priority and return valid decisions
    return decisions
      .filter(d => d.cost <= this.mana)
      .sort((a, b) => b.priority - a.priority);
  }

  // Execute the chosen decision
  executeDecision(decision) {
    switch (decision.action) {
      case 'play_land':
        // Land is already played via startTurn()
        break;
        
      case 'cast_creature':
        this.creatures.push({ power: 2, toughness: 2, cost: decision.cost });
        this.cardsInHand--;
        this.mana -= decision.cost;
        break;
        
      case 'attack':
        const damage = this.creatures.reduce((total, creature) => total + creature.power, 0);
        return { damage, target: 'opponent' };
        
      case 'lightning_bolt':
        this.cardsInHand--;
        this.mana -= decision.cost;
        return { damage: 3, target: 'opponent' };
        
      case 'removal':
        this.cardsInHand--;
        this.mana -= decision.cost;
        return { damage: 0, target: 'creature', effect: 'destroy' };
        
      case 'counterspell':
        this.cardsInHand--;
        this.mana -= decision.cost;
        return { damage: 0, target: 'spell', effect: 'counter' };
    }
    return { damage: 0 };
  }
}

// Simulate a game between two bots
async function simulateGame(gameId, player1Bot, player2Bot) {
  const turns = [];
  let winner = null;
  let turnCount = 0;

  while (turnCount < 20 && !winner) { // Max 20 turns or until someone wins
    turnCount++;
    
    // Player 1 turn
    player1Bot.startTurn();
    const p1Decisions = player1Bot.makeDecision(player2Bot.life, player2Bot.creatures.length);
    
    if (p1Decisions.length > 0) {
      const chosenDecision = p1Decisions[0];
      const result = player1Bot.executeDecision(chosenDecision);
      
      if (result.damage > 0 && result.target === 'opponent') {
        player2Bot.life -= result.damage;
      }
      
      turns.push({
        turn: turnCount,
        player: 1,
        action: chosenDecision.description,
        damage: result.damage || 0,
        p1Life: player1Bot.life,
        p2Life: player2Bot.life
      });
    }

    if (player2Bot.life <= 0) {
      winner = 'player1';
      break;
    }

    // Player 2 turn (simplified - just copy player 1 logic)
    player2Bot.startTurn();
    const p2Decisions = player2Bot.makeDecision(player1Bot.life, player1Bot.creatures.length);
    
    if (p2Decisions.length > 0) {
      const chosenDecision = p2Decisions[0];
      const result = player2Bot.executeDecision(chosenDecision);
      
      if (result.damage > 0 && result.target === 'opponent') {
        player1Bot.life -= result.damage;
      }
      
      turns.push({
        turn: turnCount,
        player: 2,
        action: chosenDecision.description,
        damage: result.damage || 0,
        p1Life: player1Bot.life,
        p2Life: player2Bot.life
      });
    }

    if (player1Bot.life <= 0) {
      winner = 'player2';
      break;
    }
  }

  // Update game in database
  await sql`
    UPDATE games 
    SET 
      status = 'completed',
      winner = ${winner},
      turn_count = ${turnCount},
      duration_seconds = ${Math.floor(Math.random() * 300) + 60}, -- 1-5 minutes
      player1_life = ${player1Bot.life},
      player2_life = ${player2Bot.life},
      completed_at = NOW(),
      game_data = ${JSON.stringify({ turns, finalState: { player1Bot, player2Bot } })}
    WHERE id = ${gameId}
  `;

  return { winner, turns, finalLife: { p1: player1Bot.life, p2: player2Bot.life } };
}

export async function POST(request) {
  try {
    const { action, gameId, config } = await request.json();

    switch (action) {
      case 'simulate_game':
        // Create a new game if no gameId provided
        let currentGameId = gameId;
        
        if (!currentGameId) {
          const newGame = await sql`
            INSERT INTO games (
              session_id,
              game_type,
              player1_type,
              player2_type,
              status,
              deck1_archetype,
              deck2_archetype,
              turn_count,
              player1_life,
              player2_life
            ) VALUES (
              ${'simple_bot_demo_' + Date.now()},
              'bot_vs_bot',
              'simple_bot_v1',
              'simple_bot_v1',
              'active',
              'Simple Aggro',
              'Simple Aggro',
              0,
              20,
              20
            ) RETURNING id
          `;
          currentGameId = newGame[0].id;
        }

        // Create two bot instances
        const player1Bot = new SimpleBot(20);
        const player2Bot = new SimpleBot(20);

        // Simulate the game
        const gameResult = await simulateGame(currentGameId, player1Bot, player2Bot);

        return Response.json({
          success: true,
          gameId: currentGameId,
          result: gameResult,
          message: `Game completed! Winner: ${gameResult.winner}, Final: P1(${gameResult.finalLife.p1}) vs P2(${gameResult.finalLife.p2})`
        });

      case 'get_decision':
        // Get AI decision for current game state
        const bot = new SimpleBot(config?.life || 20);
        bot.mana = config?.mana || 1;
        bot.cardsInHand = config?.cardsInHand || 7;
        bot.creatures = config?.creatures || [];
        bot.turn = config?.turn || 1;

        const decisions = bot.makeDecision(
          config?.opponentLife || 20,
          config?.opponentCreatures || 0
        );

        return Response.json({
          success: true,
          decisions: decisions.map(d => ({
            ...d,
            probability: d.priority // Convert priority to probability for UI
          })),
          gameState: {
            life: bot.life,
            mana: bot.mana,
            cardsInHand: bot.cardsInHand,
            creatures: bot.creatures.length,
            turn: bot.turn
          }
        });

      case 'start_continuous_simulation':
        // Start running games continuously (for demo purposes)
        // This would be handled by a background process in production
        return Response.json({
          success: true,
          message: "Continuous simulation started",
          note: "In production, this would be handled by a background service"
        });

      default:
        return Response.json({ 
          error: "Invalid action. Use 'simulate_game', 'get_decision', or 'start_continuous_simulation'" 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in simple bot:', error);
    return Response.json({
      error: "Failed to process bot request",
      details: error.message
    }, { status: 500 });
  }
}