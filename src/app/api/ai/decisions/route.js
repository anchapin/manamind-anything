import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    // Get the current active game to provide context
    const activeGame = await sql`
      SELECT * FROM games 
      WHERE status = 'active' 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (activeGame.length === 0) {
      return Response.json({
        status: "No active game",
        thinking: false,
        options: []
      });
    }

    const game = activeGame[0];
    
    // Mock AI decision process based on game state
    // In a real implementation, this would query the actual AI model
    const moveOptions = generateMockMoveOptions(game);
    
    // Simulate thinking time
    const thinkingTime = (Math.random() * 2 + 0.5).toFixed(1); // 0.5-2.5 seconds
    
    // Determine current thinking state
    const isThinking = Math.random() < 0.3; // 30% chance AI is currently thinking
    
    return Response.json({
      gameId: game.id,
      turn: game.turn_count,
      status: isThinking ? "thinking" : "ready",
      thinkingTime: parseFloat(thinkingTime),
      currentDecision: isThinking ? "Evaluating Move Options" : "Move Selected",
      options: moveOptions,
      confidence: {
        high: moveOptions.filter(opt => opt.probability >= 0.7).length,
        medium: moveOptions.filter(opt => opt.probability >= 0.4 && opt.probability < 0.7).length,
        low: moveOptions.filter(opt => opt.probability < 0.4).length
      },
      gameContext: {
        manaAvailable: Math.min(game.turn_count, 10),
        cardsInHand: Math.floor(Math.random() * 5) + 3,
        boardState: "mid-game",
        playerLife: game.player1_life,
        opponentLife: game.player2_life
      }
    });

  } catch (error) {
    console.error('Error fetching AI decisions:', error);
    return Response.json({
      error: "Failed to fetch AI decision data"
    }, { status: 500 });
  }
}

function generateMockMoveOptions(game) {
  // Generate realistic MTG move options based on game state
  const baseOptions = [
    { name: "Cast Lightning Bolt", type: "spell", cost: 1 },
    { name: "Attack with creatures", type: "combat", cost: 0 },
    { name: "Play land, pass turn", type: "land", cost: 0 },
    { name: "Cast counterspell", type: "spell", cost: 2 },
    { name: "Activate planeswalker", type: "ability", cost: 2 },
    { name: "Cast creature spell", type: "creature", cost: 3 },
    { name: "Use artifact ability", type: "ability", cost: 1 },
    { name: "Cast draw spell", type: "spell", cost: 2 }
  ];
  
  // Filter options based on available mana (approximation)
  const availableMana = Math.min(game.turn_count, 10);
  const viableOptions = baseOptions.filter(option => option.cost <= availableMana);
  
  // Shuffle and take 3-5 options
  const shuffled = viableOptions.sort(() => 0.5 - Math.random());
  const selectedOptions = shuffled.slice(0, Math.floor(Math.random() * 3) + 3);
  
  // Assign probabilities (ensuring they make sense)
  return selectedOptions.map((option, index) => {
    let probability;
    if (index === 0) {
      probability = 0.4 + Math.random() * 0.5; // Best option: 40-90%
    } else if (index === 1) {
      probability = 0.3 + Math.random() * 0.4; // Second: 30-70%
    } else {
      probability = 0.1 + Math.random() * 0.4; // Others: 10-50%
    }
    
    return {
      ...option,
      probability: Math.round(probability * 100) / 100,
      evaluation: {
        immediate: Math.random() * 5 + 3, // 3-8 rating
        longTerm: Math.random() * 5 + 3,
        riskLevel: Math.random() < 0.3 ? 'high' : Math.random() < 0.6 ? 'medium' : 'low'
      }
    };
  }).sort((a, b) => b.probability - a.probability);
}