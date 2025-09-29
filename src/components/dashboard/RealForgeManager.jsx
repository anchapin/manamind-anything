'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Trash2, Monitor, Cpu, Clock, Target } from 'lucide-react';

export default function RealForgeManager() {
  const [forgeInstances, setForgeInstances] = useState([]);
  const [launchConfig, setLaunchConfig] = useState({
    aiDifficulty: 'MEDIUM',
    gameMode: 'Constructed',
    playerDeck: 'Default_Aggro',
    aiDeck: 'Default_Control',
    format: 'Standard',
    memory: '2G'
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch active Forge instances
  const fetchInstances = useCallback(async () => {
    try {
      const response = await fetch('/api/forge/process');
      if (!response.ok) throw new Error('Failed to fetch instances');
      
      const data = await response.json();
      if (data.success) {
        setForgeInstances(data.instances || []);
      }
    } catch (err) {
      console.error('Error fetching instances:', err);
      setError('Failed to fetch Forge instances');
    }
  }, []);

  // Poll for updates
  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 3000);
    return () => clearInterval(interval);
  }, [fetchInstances]);

  // Launch new Forge instance
  const launchForge = async () => {
    setIsLaunching(true);
    setError(null);
    
    const logEntry = `[${new Date().toLocaleTimeString()}] Launching Forge with ${launchConfig.aiDifficulty} difficulty...`;
    setLogs(prev => [logEntry, ...prev].slice(0, 50));

    try {
      const response = await fetch('/api/forge/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_game',
          config: launchConfig
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const successLog = `[${new Date().toLocaleTimeString()}] ✅ Forge launched successfully! Game ID: ${data.gameId}`;
        setLogs(prev => [successLog, ...prev].slice(0, 50));
        await fetchInstances(); // Refresh list
      } else {
        throw new Error(data.error || data.details || 'Launch failed');
      }
    } catch (err) {
      console.error('Error launching Forge:', err);
      setError(`Failed to launch Forge: ${err.message}`);
      const errorLog = `[${new Date().toLocaleTimeString()}] ❌ Launch failed: ${err.message}`;
      setLogs(prev => [errorLog, ...prev].slice(0, 50));
    } finally {
      setIsLaunching(false);
    }
  };

  // Shutdown Forge instance
  const shutdownForge = async (gameId) => {
    const shutdownLog = `[${new Date().toLocaleTimeString()}] Shutting down game ${gameId}...`;
    setLogs(prev => [shutdownLog, ...prev].slice(0, 50));

    try {
      const response = await fetch('/api/forge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'shutdown_forge',
          gameId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const successLog = `[${new Date().toLocaleTimeString()}] ✅ Game ${gameId} shut down successfully`;
        setLogs(prev => [successLog, ...prev].slice(0, 50));
        await fetchInstances();
      } else {
        throw new Error(data.error || 'Shutdown failed');
      }
    } catch (err) {
      console.error('Error shutting down Forge:', err);
      const errorLog = `[${new Date().toLocaleTimeString()}] ❌ Shutdown failed: ${err.message}`;
      setLogs(prev => [errorLog, ...prev].slice(0, 50));
    }
  };

  // Get game state
  const getGameState = async (gameId) => {
    try {
      const response = await fetch('/api/forge/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_state',
          gameId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const stateLog = `[${new Date().toLocaleTimeString()}] Game ${gameId} - Turn ${data.gameState?.turn || '?'}, Phase: ${data.gameState?.phase || '?'}`;
        setLogs(prev => [stateLog, ...prev].slice(0, 50));
      }
    } catch (err) {
      console.error('Error getting game state:', err);
    }
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Real Forge Process Manager
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Monitor className="w-4 h-4" />
          <span>{forgeInstances.length} Active Instance{forgeInstances.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Launch Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Launch Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">AI Difficulty</label>
            <select
              value={launchConfig.aiDifficulty}
              onChange={(e) => setLaunchConfig(prev => ({ ...prev, aiDifficulty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Player Deck</label>
            <select
              value={launchConfig.playerDeck}
              onChange={(e) => setLaunchConfig(prev => ({ ...prev, playerDeck: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="Default_Aggro">Aggro Red</option>
              <option value="Default_Control">Control Blue</option>
              <option value="Default_Midrange">Midrange Green</option>
              <option value="Default_Combo">Combo Deck</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Memory</label>
            <select
              value={launchConfig.memory}
              onChange={(e) => setLaunchConfig(prev => ({ ...prev, memory: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="1G">1GB RAM</option>
              <option value="2G">2GB RAM</option>
              <option value="4G">4GB RAM</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={launchForge}
            disabled={isLaunching}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isLaunching 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Play className="w-4 h-4" />
            {isLaunching ? 'Launching...' : 'Launch Real Forge'}
          </button>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded border">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Active Instances */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">Active Instances</h3>
        
        {forgeInstances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active Forge instances</p>
            <p className="text-sm">Launch a new instance to start playing against real Forge AI</p>
          </div>
        ) : (
          forgeInstances.map(instance => (
            <div key={instance.gameId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    instance.status === 'running' ? 'bg-green-500' :
                    instance.status === 'starting' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-medium text-gray-700">Game {instance.gameId.split('_')[1]}</span>
                  <span className="text-sm text-gray-500">PID: {instance.processId}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => getGameState(instance.gameId)}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <Target className="w-3 h-3" />
                    State
                  </button>
                  <button
                    onClick={() => shutdownForge(instance.gameId)}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    <Square className="w-3 h-3" />
                    Shutdown
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-1 font-medium capitalize">{instance.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Difficulty:</span>
                  <span className="ml-1 font-medium">{instance.config?.aiDifficulty || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">Uptime:</span>
                  <span className="ml-1 font-medium">{formatUptime(instance.uptime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Memory:</span>
                  <span className="ml-1 font-medium">{instance.config?.memory || '2G'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Activity Log */}
      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-700 mb-3">Activity Log</h3>
          <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}