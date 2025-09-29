'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Settings, Download, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';

export default function ForgeManager() {
  const [environment, setEnvironment] = useState(null);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [setupStep, setSetupStep] = useState('check');
  const [setupLog, setSetupLog] = useState([]);

  useEffect(() => {
    checkEnvironment();
    if (environment?.status === 'ok') {
      loadInstances();
    }
  }, []);

  const checkEnvironment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/forge/setup');
      const data = await response.json();
      setEnvironment(data);
      
      if (data.status === 'ok') {
        setSetupStep('ready');
      } else if (data.status === 'warning') {
        setSetupStep('warnings');
      } else {
        setSetupStep('setup_needed');
      }
    } catch (error) {
      console.error('Environment check failed:', error);
    }
    setLoading(false);
  };

  const loadInstances = async () => {
    try {
      const response = await fetch('/api/forge/process');
      const data = await response.json();
      if (data.success) {
        setInstances(data.instances || []);
      }
    } catch (error) {
      console.error('Failed to load instances:', error);
    }
  };

  const setupEnvironment = async () => {
    setLoading(true);
    setSetupLog([]);
    
    try {
      const response = await fetch('/api/forge/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_forge',
          config: {
            forgePath: '/opt/forge',
            memory: '2G',
            defaultAIDifficulty: 'MEDIUM'
          }
        })
      });
      
      const data = await response.json();
      setSetupLog(data.setupLog || []);
      
      if (data.success) {
        setSetupStep('setup_complete');
        await checkEnvironment();
      } else {
        setSetupStep('setup_failed');
      }
    } catch (error) {
      console.error('Setup failed:', error);
      setSetupStep('setup_failed');
    }
    setLoading(false);
  };

  const testLaunch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/forge/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_launch',
          config: { memory: '1G' }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadInstances();
      }
    } catch (error) {
      console.error('Test launch failed:', error);
    }
    setLoading(false);
  };

  const shutdownInstance = async (gameId) => {
    try {
      await fetch('/api/forge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'shutdown_forge',
          gameId
        })
      });
      await loadInstances();
    } catch (error) {
      console.error('Shutdown failed:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const formatUptime = (uptime) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Forge Environment</h2>
        <button 
          onClick={checkEnvironment}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Environment Status */}
      {environment && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon(environment.status)}
            <span className="text-lg font-medium">
              Environment Status: {environment.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(environment.checks || {}).map(([key, check]) => (
              <div key={key} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(check.status)}
                  <span className="font-medium">{check.name}</span>
                </div>
                
                {check.details && (
                  <div className="text-sm text-gray-600">
                    {check.status === 'ok' && (
                      <div>
                        {check.details.version && <div>Version: {check.details.version}</div>}
                        {check.details.size && <div>Size: {check.details.size}</div>}
                        {check.details.available && <div>Available: {check.details.available}</div>}
                      </div>
                    )}
                    {check.status === 'error' && (
                      <div className="text-red-600">{check.details.error}</div>
                    )}
                    {check.details.suggestion && (
                      <div className="text-blue-600 mt-1">{check.details.suggestion}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {environment.recommendations && environment.recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Recommendations:</h3>
              <ul className="space-y-2">
                {environment.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium text-yellow-700">{rec.action}:</span> {rec.description}
                    {rec.command && (
                      <code className="block mt-1 p-1 bg-yellow-100 text-xs rounded">{rec.command}</code>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Setup Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Setup Actions</h3>
        <div className="flex flex-wrap gap-3">
          {setupStep === 'setup_needed' && (
            <button
              onClick={setupEnvironment}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Setup Environment
            </button>
          )}
          
          {environment?.status === 'ok' && (
            <button
              onClick={testLaunch}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Test Launch
            </button>
          )}

          <button
            onClick={() => window.open('https://releases.cardforge.org/forge/', '_blank')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Forge
          </button>
        </div>
      </div>

      {/* Setup Log */}
      {setupLog.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Setup Log</h3>
          <div className="bg-gray-50 border rounded-lg p-4 max-h-48 overflow-y-auto">
            <pre className="text-sm">
              {setupLog.map((line, index) => (
                <div key={index} className="mb-1">{line}</div>
              ))}
            </pre>
          </div>
        </div>
      )}

      {/* Active Instances */}
      <div>
        <h3 className="text-lg font-medium mb-3">Active Forge Instances</h3>
        
        {instances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No active Forge instances
          </div>
        ) : (
          <div className="space-y-3">
            {instances.map((instance) => (
              <div key={instance.gameId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      instance.status === 'running' ? 'bg-green-400' :
                      instance.status === 'starting' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}></div>
                    <span className="font-medium">{instance.gameId}</span>
                    <span className="text-sm text-gray-500">
                      PID: {instance.processId}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => shutdownInstance(instance.gameId)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                  >
                    <Square className="w-3 h-3" />
                    Stop
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium">{instance.status}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Uptime:</span>
                    <div className="font-medium">{formatUptime(instance.uptime)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Memory:</span>
                    <div className="font-medium">{instance.config?.memory || '2G'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">AI Level:</span>
                    <div className="font-medium">{instance.config?.aiDifficulty || 'MEDIUM'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}