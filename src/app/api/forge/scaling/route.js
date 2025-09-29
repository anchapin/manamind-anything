import sql from "@/app/api/utils/sql";

// Forge Scaling and Load Management API
let scalingConfig = {
  maxInstances: 5,
  autoScale: true,
  scaleUpThreshold: 0.8,  // CPU/Memory usage
  scaleDownThreshold: 0.3,
  minInstances: 1,
  instanceTypes: {
    'small': { memory: '1G', maxGames: 2 },
    'medium': { memory: '2G', maxGames: 5 },
    'large': { memory: '4G', maxGames: 10 }
  }
};

let instancePool = new Map(); // Track instances and their load
let gameQueue = []; // Queue for games waiting for available instances

export async function POST(request) {
  try {
    const { action, config, gameConfig } = await request.json();

    switch (action) {
      case "scale_up":
        return await scaleUp(config);
      case "scale_down":
        return await scaleDown(config);
      case "auto_scale":
        return await performAutoScaling();
      case "get_scaling_status":
        return await getScalingStatus();
      case "update_config":
        return await updateScalingConfig(config);
      case "queue_game":
        return await queueGame(gameConfig);
      case "process_queue":
        return await processGameQueue();
      case "optimize_instances":
        return await optimizeInstances();
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Forge scaling error:", error);
    return Response.json({ error: "Scaling operation failed" }, { status: 500 });
  }
}

export async function GET() {
  return await getScalingStatus();
}

async function scaleUp(config) {
  const currentInstances = await getCurrentInstances();
  
  if (currentInstances.length >= scalingConfig.maxInstances) {
    return Response.json({
      success: false,
      error: "Maximum instances reached",
      maxInstances: scalingConfig.maxInstances,
      currentInstances: currentInstances.length
    }, { status: 400 });
  }

  try {
    // Launch new Forge instance
    const instanceType = config?.instanceType || 'medium';
    const instanceConfig = {
      ...scalingConfig.instanceTypes[instanceType],
      aiDifficulty: config?.aiDifficulty || 'MEDIUM',
      gameMode: 'Constructed',
      format: 'Standard'
    };

    const launchResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/forge/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'launch_forge',
        config: instanceConfig
      })
    });

    const result = await launchResponse.json();

    if (result.success) {
      // Add to instance pool
      instancePool.set(result.gameId, {
        gameId: result.gameId,
        processId: result.processId,
        instanceType,
        maxGames: instanceConfig.maxGames,
        currentGames: 0,
        status: 'running',
        launched: Date.now(),
        lastActivity: Date.now(),
        cpuUsage: 0,
        memoryUsage: 0
      });

      // Log scaling event
      await sql`
        INSERT INTO system_metrics (metric_name, metric_value, instance_id)
        VALUES ('forge_scale_up', 1, ${result.gameId})
      `;

      return Response.json({
        success: true,
        action: 'scale_up',
        newInstance: {
          gameId: result.gameId,
          instanceType,
          maxGames: instanceConfig.maxGames
        },
        totalInstances: currentInstances.length + 1,
        message: 'Forge instance scaled up successfully'
      });
    } else {
      return Response.json({
        success: false,
        error: 'Failed to launch new instance',
        details: result.error
      }, { status: 500 });
    }

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Scale up failed',
      details: error.message
    }, { status: 500 });
  }
}

async function scaleDown(config) {
  const currentInstances = await getCurrentInstances();
  
  if (currentInstances.length <= scalingConfig.minInstances) {
    return Response.json({
      success: false,
      error: "Minimum instances reached",
      minInstances: scalingConfig.minInstances,
      currentInstances: currentInstances.length
    }, { status: 400 });
  }

  try {
    // Find least utilized instance
    const instanceToRemove = findLeastUtilizedInstance(currentInstances);
    
    if (!instanceToRemove) {
      return Response.json({
        success: false,
        error: "No suitable instance found for removal"
      }, { status: 400 });
    }

    // Gracefully shutdown the instance
    const shutdownResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/forge/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'shutdown_forge',
        gameId: instanceToRemove.gameId
      })
    });

    const result = await shutdownResponse.json();

    if (result.success) {
      // Remove from instance pool
      instancePool.delete(instanceToRemove.gameId);

      // Log scaling event
      await sql`
        INSERT INTO system_metrics (metric_name, metric_value, instance_id)
        VALUES ('forge_scale_down', 1, ${instanceToRemove.gameId})
      `;

      return Response.json({
        success: true,
        action: 'scale_down',
        removedInstance: instanceToRemove.gameId,
        totalInstances: currentInstances.length - 1,
        message: 'Forge instance scaled down successfully'
      });
    } else {
      return Response.json({
        success: false,
        error: 'Failed to shutdown instance',
        details: result.error
      }, { status: 500 });
    }

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Scale down failed',
      details: error.message
    }, { status: 500 });
  }
}

async function performAutoScaling() {
  if (!scalingConfig.autoScale) {
    return Response.json({
      success: false,
      message: "Auto-scaling is disabled"
    });
  }

  const currentInstances = await getCurrentInstances();
  const metrics = await getResourceMetrics();
  
  let actions = [];
  
  // Check if we need to scale up
  if (metrics.avgCpuUsage > scalingConfig.scaleUpThreshold || 
      metrics.avgMemoryUsage > scalingConfig.scaleUpThreshold ||
      gameQueue.length > 0) {
    
    if (currentInstances.length < scalingConfig.maxInstances) {
      const scaleUpResult = await scaleUp({ instanceType: 'medium' });
      if (scaleUpResult.success) {
        actions.push('scaled_up');
      }
    }
  }
  
  // Check if we need to scale down
  else if (metrics.avgCpuUsage < scalingConfig.scaleDownThreshold && 
           metrics.avgMemoryUsage < scalingConfig.scaleDownThreshold &&
           gameQueue.length === 0) {
    
    if (currentInstances.length > scalingConfig.minInstances) {
      const scaleDownResult = await scaleDown({});
      if (scaleDownResult.success) {
        actions.push('scaled_down');
      }
    }
  }

  // Process any queued games
  if (gameQueue.length > 0) {
    const processResult = await processGameQueue();
    if (processResult.processed > 0) {
      actions.push(`processed_${processResult.processed}_queued_games`);
    }
  }

  return Response.json({
    success: true,
    action: 'auto_scale',
    metrics,
    actions,
    currentInstances: currentInstances.length,
    queuedGames: gameQueue.length,
    message: actions.length > 0 ? `Auto-scaling performed: ${actions.join(', ')}` : 'No scaling needed'
  });
}

async function getCurrentInstances() {
  try {
    const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/forge/process`);
    const data = await response.json();
    return data.success ? data.instances : [];
  } catch (error) {
    console.error('Failed to get current instances:', error);
    return [];
  }
}

async function getResourceMetrics() {
  const instances = await getCurrentInstances();
  
  if (instances.length === 0) {
    return {
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      totalGames: 0,
      instanceUtilization: 0
    };
  }

  // Simulate resource metrics (in real implementation, get from system monitoring)
  let totalCpu = 0;
  let totalMemory = 0;
  let totalGames = 0;
  let totalCapacity = 0;

  for (const instance of instances) {
    const poolInstance = instancePool.get(instance.gameId);
    if (poolInstance) {
      // Simulate CPU/Memory usage based on games and uptime
      const gameLoad = poolInstance.currentGames / poolInstance.maxGames;
      const cpuUsage = Math.min(0.2 + gameLoad * 0.6 + Math.random() * 0.1, 1.0);
      const memoryUsage = Math.min(0.3 + gameLoad * 0.5 + Math.random() * 0.1, 1.0);
      
      poolInstance.cpuUsage = cpuUsage;
      poolInstance.memoryUsage = memoryUsage;
      
      totalCpu += cpuUsage;
      totalMemory += memoryUsage;
      totalGames += poolInstance.currentGames;
      totalCapacity += poolInstance.maxGames;
    }
  }

  return {
    avgCpuUsage: totalCpu / instances.length,
    avgMemoryUsage: totalMemory / instances.length,
    totalGames,
    instanceUtilization: totalCapacity > 0 ? totalGames / totalCapacity : 0,
    activeInstances: instances.length
  };
}

function findLeastUtilizedInstance(instances) {
  let leastUtilized = null;
  let lowestUtilization = 1.0;

  for (const instance of instances) {
    const poolInstance = instancePool.get(instance.gameId);
    if (poolInstance && poolInstance.currentGames === 0) {
      const utilization = (poolInstance.cpuUsage + poolInstance.memoryUsage) / 2;
      if (utilization < lowestUtilization) {
        lowestUtilization = utilization;
        leastUtilized = poolInstance;
      }
    }
  }

  return leastUtilized;
}

async function getScalingStatus() {
  const instances = await getCurrentInstances();
  const metrics = await getResourceMetrics();

  return Response.json({
    success: true,
    scaling: {
      config: scalingConfig,
      instances: {
        active: instances.length,
        pool: Array.from(instancePool.values()),
        queue: gameQueue.length
      },
      metrics,
      recommendations: generateScalingRecommendations(metrics, instances.length)
    },
    timestamp: new Date().toISOString()
  });
}

function generateScalingRecommendations(metrics, instanceCount) {
  const recommendations = [];

  if (metrics.avgCpuUsage > 0.8) {
    recommendations.push({
      type: 'scale_up',
      priority: 'high',
      reason: 'High CPU usage detected',
      action: 'Add more Forge instances'
    });
  }

  if (metrics.avgMemoryUsage > 0.8) {
    recommendations.push({
      type: 'scale_up',
      priority: 'high',
      reason: 'High memory usage detected',
      action: 'Add more Forge instances or upgrade instance types'
    });
  }

  if (gameQueue.length > 5) {
    recommendations.push({
      type: 'scale_up',
      priority: 'medium',
      reason: 'Game queue building up',
      action: 'Scale up to handle queued games'
    });
  }

  if (metrics.avgCpuUsage < 0.3 && metrics.avgMemoryUsage < 0.3 && instanceCount > scalingConfig.minInstances) {
    recommendations.push({
      type: 'scale_down',
      priority: 'low',
      reason: 'Low resource utilization',
      action: 'Consider scaling down to save resources'
    });
  }

  if (instanceCount === 0) {
    recommendations.push({
      type: 'scale_up',
      priority: 'critical',
      reason: 'No active instances',
      action: 'Launch at least one Forge instance'
    });
  }

  return recommendations;
}

async function updateScalingConfig(config) {
  // Update scaling configuration
  scalingConfig = {
    ...scalingConfig,
    ...config
  };

  return Response.json({
    success: true,
    config: scalingConfig,
    message: 'Scaling configuration updated'
  });
}

async function queueGame(gameConfig) {
  // Add game to queue if no available instances
  const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  gameQueue.push({
    queueId,
    gameConfig,
    priority: gameConfig.priority || 'normal',
    queuedAt: Date.now(),
    retries: 0
  });

  return Response.json({
    success: true,
    queueId,
    position: gameQueue.length,
    estimatedWait: estimateWaitTime(),
    message: 'Game queued for next available instance'
  });
}

async function processGameQueue() {
  const availableInstances = getAvailableInstances();
  let processed = 0;

  while (gameQueue.length > 0 && availableInstances.length > 0) {
    const queuedGame = gameQueue.shift();
    const instance = availableInstances.shift();

    try {
      // Launch game on available instance
      const gameResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/forge/integration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_game',
          config: queuedGame.gameConfig
        })
      });

      const result = await gameResponse.json();
      
      if (result.success) {
        // Update instance utilization
        const poolInstance = instancePool.get(instance.gameId);
        if (poolInstance) {
          poolInstance.currentGames++;
          poolInstance.lastActivity = Date.now();
        }
        processed++;
      } else {
        // Put game back in queue with retry
        queuedGame.retries++;
        if (queuedGame.retries < 3) {
          gameQueue.unshift(queuedGame);
        }
      }
    } catch (error) {
      console.error('Error processing queued game:', error);
      // Put game back in queue
      gameQueue.unshift(queuedGame);
      break;
    }
  }

  return Response.json({
    success: true,
    processed,
    remaining: gameQueue.length,
    message: `Processed ${processed} queued games`
  });
}

function getAvailableInstances() {
  return Array.from(instancePool.values()).filter(instance => 
    instance.status === 'running' && 
    instance.currentGames < instance.maxGames
  );
}

function estimateWaitTime() {
  const availableCapacity = getAvailableInstances().reduce((sum, instance) => 
    sum + (instance.maxGames - instance.currentGames), 0
  );
  
  if (availableCapacity > 0) {
    return 0;
  }
  
  // Estimate based on average game duration and queue position
  const avgGameDuration = 600000; // 10 minutes
  const position = gameQueue.length;
  return Math.ceil(position * avgGameDuration / scalingConfig.maxInstances);
}

async function optimizeInstances() {
  const instances = await getCurrentInstances();
  const optimizations = [];

  // Check for underutilized instances
  for (const instance of instances) {
    const poolInstance = instancePool.get(instance.gameId);
    if (poolInstance) {
      const utilization = poolInstance.currentGames / poolInstance.maxGames;
      
      if (utilization < 0.2 && poolInstance.currentGames === 0) {
        // Mark for potential shutdown
        optimizations.push({
          type: 'shutdown_candidate',
          gameId: instance.gameId,
          reason: 'Low utilization'
        });
      }
      
      if (poolInstance.cpuUsage > 0.9 || poolInstance.memoryUsage > 0.9) {
        // Mark for potential upgrade
        optimizations.push({
          type: 'upgrade_candidate',
          gameId: instance.gameId,
          reason: 'High resource usage'
        });
      }
    }
  }

  return Response.json({
    success: true,
    optimizations,
    recommendations: optimizations.length > 0 ? 
      'Consider implementing suggested optimizations' : 
      'Instances are well optimized',
    timestamp: new Date().toISOString()
  });
}