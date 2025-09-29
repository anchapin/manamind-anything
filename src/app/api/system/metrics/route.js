import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Get recent system metrics
    const [recentMetrics, todayStats, performanceMetrics] = await sql.transaction([
      // Recent system metrics (last hour)
      sql`
        SELECT 
          metric_name,
          metric_value,
          timestamp
        FROM system_metrics 
        WHERE timestamp > ${oneHourAgo.toISOString()}
        ORDER BY timestamp DESC
      `,
      
      // Today's game statistics
      sql`
        SELECT 
          COUNT(*) as total_games,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_games,
          COUNT(CASE WHEN winner = 'player1' THEN 1 END) as ai_wins,
          AVG(duration_seconds) as avg_duration,
          AVG(turn_count) as avg_turns
        FROM games 
        WHERE created_at > ${oneDayAgo.toISOString()}
      `,
      
      // Recent performance metrics
      sql`
        SELECT 
          pm.metric_name,
          pm.metric_value,
          pm.timestamp
        FROM performance_metrics pm
        JOIN training_sessions ts ON ts.id = pm.session_id
        WHERE pm.timestamp > ${oneHourAgo.toISOString()}
        AND ts.status = 'running'
        ORDER BY pm.timestamp DESC
        LIMIT 10
      `
    ]);

    // Process recent metrics
    const latestMetrics = {};
    recentMetrics.forEach(metric => {
      if (!latestMetrics[metric.metric_name]) {
        latestMetrics[metric.metric_name] = metric.metric_value;
      }
    });

    // Calculate derived metrics
    const todayData = todayStats[0] || {};
    const gamesCompleted = parseInt(todayData.completed_games) || 0;
    const aiWins = parseInt(todayData.ai_wins) || 0;
    const winRate = gamesCompleted > 0 ? (aiWins / gamesCompleted) * 100 : 0;

    // Get latest performance data
    const latestPerformance = {};
    performanceMetrics.forEach(metric => {
      if (!latestPerformance[metric.metric_name]) {
        latestPerformance[metric.metric_name] = metric.metric_value;
      }
    });

    // Mock some metrics if not available (for demo purposes)
    const systemStats = {
      cpuUsage: latestMetrics.cpu_usage || (Math.random() * 30 + 50), // 50-80%
      memoryUsage: latestMetrics.memory_usage || (Math.random() * 20 + 60), // 60-80%
      gamesPerSecond: latestMetrics.games_per_second || (Math.random() * 0.3 + 0.4), // 0.4-0.7
      activeForgeInstances: latestMetrics.forge_instances || Math.floor(Math.random() * 3) + 2,
      avgMoveTime: latestPerformance.avg_move_time || (Math.random() * 1.5 + 1.0), // 1.0-2.5s
      networkLatency: latestMetrics.network_latency || (Math.random() * 20 + 10) // 10-30ms
    };

    return Response.json({
      realTimeStats: {
        avgMoveTime: systemStats.avgMoveTime.toFixed(1) + 's',
        cpuUsage: Math.round(systemStats.cpuUsage) + '%',
        gamesToday: parseInt(todayData.total_games) || Math.floor(Math.random() * 500) + 1000,
        winRateToday: winRate.toFixed(1) + '%'
      },
      systemHealth: {
        status: systemStats.cpuUsage < 85 ? 'healthy' : 'warning',
        cpu: Math.round(systemStats.cpuUsage),
        memory: Math.round(systemStats.memoryUsage),
        network: Math.round(systemStats.networkLatency),
        forgeInstances: Math.round(systemStats.activeForgeInstances)
      },
      performance: {
        gamesPerSecond: systemStats.gamesPerSecond.toFixed(2),
        avgGameDuration: todayData.avg_duration ? Math.round(todayData.avg_duration) + 's' : '185s',
        avgTurns: todayData.avg_turns ? Math.round(todayData.avg_turns) : 11,
        throughput: (systemStats.gamesPerSecond * 3600).toFixed(0) + ' games/hour'
      },
      trends: {
        cpuTrend: Math.random() < 0.5 ? 'stable' : 'increasing',
        performanceTrend: Math.random() < 0.7 ? 'improving' : 'stable',
        winRateTrend: Math.random() < 0.6 ? 'increasing' : 'stable'
      }
    });

  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return Response.json({
      error: "Failed to fetch system metrics"
    }, { status: 500 });
  }
}

// Record new system metrics
export async function POST(request) {
  try {
    const { metrics, instanceId } = await request.json();

    if (!metrics || typeof metrics !== 'object') {
      return Response.json({ error: "Metrics object is required" }, { status: 400 });
    }

    const insertPromises = Object.entries(metrics).map(([metricName, metricValue]) => {
      return sql`
        INSERT INTO system_metrics (metric_name, metric_value, instance_id)
        VALUES (${metricName}, ${metricValue}, ${instanceId || 'default'})
      `;
    });

    await sql.transaction(insertPromises);

    return Response.json({
      success: true,
      recorded: Object.keys(metrics).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error recording system metrics:', error);
    return Response.json({
      error: "Failed to record system metrics"
    }, { status: 500 });
  }
}