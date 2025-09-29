import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    // Get current training session with latest metrics
    const [sessions, metrics] = await sql.transaction([
      sql`
        SELECT 
          ts.*,
          m.name as model_name,
          m.architecture
        FROM training_sessions ts
        JOIN models m ON m.version = ts.model_version
        WHERE ts.status = 'running'
        ORDER BY ts.updated_at DESC
        LIMIT 1
      `,
      sql`
        SELECT 
          pm.metric_name,
          pm.metric_value,
          pm.game_count,
          pm.timestamp
        FROM performance_metrics pm
        JOIN training_sessions ts ON ts.id = pm.session_id
        WHERE ts.status = 'running'
        AND pm.timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY pm.timestamp DESC
        LIMIT 20
      `
    ]);

    if (sessions.length === 0) {
      return Response.json({
        error: "No active training session found"
      }, { status: 404 });
    }

    const session = sessions[0];
    
    // Calculate progress percentage
    const progressPercent = Math.round((session.games_completed / session.target_games) * 100);
    
    // Get latest metrics
    const latestMetrics = {};
    metrics.forEach(metric => {
      if (!latestMetrics[metric.metric_name]) {
        latestMetrics[metric.metric_name] = metric.metric_value;
      }
    });

    // Calculate games per hour
    const gamesPerHour = latestMetrics.games_per_hour || Math.round(session.games_completed / Math.max(1, (Date.now() - new Date(session.created_at)) / (1000 * 60 * 60)));

    return Response.json({
      session: {
        name: session.name,
        model: {
          version: session.model_version,
          name: session.model_name,
          architecture: session.architecture
        },
        status: session.status,
        progress: {
          current: session.games_completed,
          target: session.target_games,
          percentage: progressPercent
        },
        performance: {
          winRate: (session.win_rate * 100).toFixed(1),
          gamesPerHour: gamesPerHour,
          avgGameDuration: session.avg_game_duration
        },
        config: {
          learningRate: session.learning_rate,
          batchSize: session.batch_size
        },
        timestamps: {
          started: session.created_at,
          lastUpdate: session.updated_at
        }
      },
      metrics: latestMetrics
    });

  } catch (error) {
    console.error('Error fetching training status:', error);
    return Response.json({
      error: "Failed to fetch training status"
    }, { status: 500 });
  }
}