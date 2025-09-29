import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    // Get active games with their current state
    const activeGames = await sql`
      SELECT 
        g.id,
        g.session_id,
        g.status,
        g.player1_type,
        g.player2_type,
        g.turn_count,
        g.player1_life,
        g.player2_life,
        g.deck1_archetype,
        g.deck2_archetype,
        g.created_at,
        g.game_data,
        EXTRACT(EPOCH FROM (NOW() - g.created_at)) as duration_seconds
      FROM games g
      WHERE g.status IN ('active', 'paused')
      ORDER BY g.created_at DESC
      LIMIT 10
    `;

    // Get current live game (most recent active)
    const liveGame = activeGames.length > 0 ? activeGames[0] : null;
    
    // Calculate win probability (mock calculation based on life totals for now)
    const calculateWinProb = (game) => {
      if (!game) return 0.5;
      const lifeDiff = game.player1_life - game.player2_life;
      const baseProb = 0.5 + (lifeDiff * 0.02); // Rough approximation
      return Math.max(0.1, Math.min(0.9, baseProb));
    };

    // Format games for UI
    const formattedGames = activeGames.map(game => ({
      id: game.id,
      opponent: game.player2_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      status: game.status,
      turn: game.turn_count,
      winProb: calculateWinProb(game),
      duration: Math.round(game.duration_seconds),
      gameState: {
        player1Life: game.player1_life,
        player2Life: game.player2_life,
        deck1: game.deck1_archetype,
        deck2: game.deck2_archetype
      }
    }));

    return Response.json({
      liveGame: liveGame ? {
        id: liveGame.id,
        status: liveGame.status,
        turn: liveGame.turn_count,
        duration: Math.round(liveGame.duration_seconds),
        players: {
          ai: {
            name: "ManaMind",
            life: liveGame.player1_life,
            deck: liveGame.deck1_archetype || "Control Blue"
          },
          opponent: {
            name: liveGame.player2_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            life: liveGame.player2_life,
            deck: liveGame.deck2_archetype || "Aggro Red"
          }
        },
        gameState: {
          cardsInHand: Math.floor(Math.random() * 5) + 3, // Mock for now
          manaAvailable: Math.min(liveGame.turn_count, 10),
          creatures: Math.floor(Math.random() * 4) + 1
        }
      } : null,
      activeGames: formattedGames
    });

  } catch (error) {
    console.error('Error fetching active games:', error);
    return Response.json({
      error: "Failed to fetch active games"
    }, { status: 500 });
  }
}

// Create a new game
export async function POST(request) {
  try {
    const { 
      sessionId, 
      player1Type = 'manamind_v2.3.1', 
      player2Type = 'forge_ai_hard',
      gameType = 'vs_forge_ai',
      deck1Archetype,
      deck2Archetype
    } = await request.json();

    // Create new game
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
        ${sessionId || 'manual_game_' + Date.now()},
        ${gameType},
        ${player1Type},
        ${player2Type},
        'active',
        ${deck1Archetype || 'Control Blue'},
        ${deck2Archetype || 'Aggro Red'},
        1,
        20,
        20
      ) RETURNING *
    `;

    return Response.json({
      success: true,
      game: newGame[0]
    });

  } catch (error) {
    console.error('Error creating game:', error);
    return Response.json({
      error: "Failed to create game"
    }, { status: 500 });
  }
}