import { useState } from 'react';
import { Monitor, Cpu, Database, Activity, RefreshCw, MoreVertical, Zap, Clock } from "./icons";

const SystemStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 gradient-neural-purple rounded-full flex items-center justify-center">
          <Cpu size={24} className="text-white" />
        </div>
        <div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">CPU Usage</div>
          <div className="font-inter text-2xl font-semibold text-black dark:text-white">67.3%</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="gradient-neural-purple h-2 rounded-full" style={{ width: '67%' }}></div>
      </div>
    </div>
    
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 gradient-ai-green rounded-full flex items-center justify-center">
          <Monitor size={24} className="text-white" />
        </div>
        <div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">Memory</div>
          <div className="font-inter text-2xl font-semibold text-black dark:text-white">12.4 GB</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="gradient-ai-green h-2 rounded-full" style={{ width: '78%' }}></div>
      </div>
    </div>
    
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 gradient-cyan-blue rounded-full flex items-center justify-center">
          <Database size={24} className="text-white" />
        </div>
        <div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">Storage</div>
          <div className="font-inter text-2xl font-semibold text-black dark:text-white">2.8 TB</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="gradient-cyan-blue h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
    </div>
    
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 gradient-purple-indigo rounded-full flex items-center justify-center">
          <Activity size={24} className="text-white" />
        </div>
        <div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">Network</div>
          <div className="font-inter text-2xl font-semibold text-black dark:text-white">847 MB/s</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="gradient-purple-indigo h-2 rounded-full" style={{ width: '62%' }}></div>
      </div>
    </div>
  </div>
);

const InfrastructureHealth = () => {
  const services = [
    { name: "Forge Engine", status: "healthy", uptime: "99.97%", instances: 12 },
    { name: "Training Pipeline", status: "healthy", uptime: "99.92%", instances: 8 },
    { name: "Model Storage", status: "healthy", uptime: "100%", instances: 3 },
    { name: "Analytics DB", status: "warning", uptime: "98.84%", instances: 2 },
    { name: "Load Balancer", status: "healthy", uptime: "99.99%", instances: 2 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">Infrastructure Health</h3>
        <div className="flex items-center gap-2">
          <div className="status-indicator status-running">
            <span className="text-sm font-inter text-green-600 dark:text-green-400 font-medium">All Systems Operational</span>
          </div>
          <button className="p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
            <div className={`w-3 h-3 rounded-full ${
              service.status === 'healthy' ? 'bg-green-500' : 
              service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            
            <div className="flex-1">
              <div className="font-inter text-sm font-medium text-black dark:text-white">{service.name}</div>
              <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                {service.instances} instances • Uptime: {service.uptime}
              </div>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-inter font-medium capitalize ${
              service.status === 'healthy' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
              service.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
              'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            }`}>
              {service.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResourceUsage = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">Resource Usage (24h)</h3>
      <select className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-3xl text-xs font-inter">
        <option>Last 24 hours</option>
        <option>Last 7 days</option>
        <option>Last 30 days</option>
      </select>
    </div>
    
    <div className="h-48 flex items-end justify-between gap-1">
      {Array.from({ length: 24 }, (_, i) => {
        const cpuUsage = Math.random() * 40 + 50; // 50-90% range
        const memUsage = Math.random() * 30 + 60; // 60-90% range
        return (
          <div key={i} className="flex flex-col gap-1 flex-1">
            <div 
              className="bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-sm"
              style={{ height: `${(cpuUsage / 100) * 80}%` }}
            ></div>
            <div 
              className="bg-gradient-to-t from-green-500 to-green-300 rounded-t-sm"
              style={{ height: `${(memUsage / 100) * 60}%` }}
            ></div>
          </div>
        );
      })}
    </div>
    
    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
        <span className="font-inter text-xs text-gray-600 dark:text-gray-400">CPU</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="font-inter text-xs text-gray-600 dark:text-gray-400">Memory</span>
      </div>
    </div>
  </div>
);

const ActiveProcesses = () => {
  const processes = [
    { name: "forge_training_worker", cpu: 23.4, memory: "2.1 GB", status: "running", pid: 1247 },
    { name: "mcts_evaluator", cpu: 18.7, memory: "1.8 GB", status: "running", pid: 1248 },
    { name: "model_validator", cpu: 15.2, memory: "1.2 GB", status: "running", pid: 1249 },
    { name: "analytics_collector", cpu: 8.9, memory: "512 MB", status: "running", pid: 1250 },
    { name: "backup_service", cpu: 2.1, memory: "128 MB", status: "running", pid: 1251 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">Active Processes</h3>
        <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700">
          <MoreVertical size={20} />
        </button>
      </div>
      
      <div className="space-y-3">
        {processes.map((process, index) => (
          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
            <div className="w-8 h-8 gradient-royal-indigo rounded-full flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-inter text-sm font-medium text-black dark:text-white">{process.name}</span>
                <span className="font-inter text-xs text-gray-500 dark:text-gray-400">PID: {process.pid}</span>
              </div>
              <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                CPU: {process.cpu}% • Memory: {process.memory}
              </div>
            </div>
            
            <div className="text-right">
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-inter font-medium">
                {process.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemLogs = () => {
  const logs = [
    { time: "14:32:45", level: "INFO", message: "Training session started for model v2.4.0", source: "TrainingPipeline" },
    { time: "14:31:12", level: "INFO", message: "Model v2.3.1 deployed successfully", source: "ModelManager" },
    { time: "14:29:08", level: "WARN", message: "High memory usage detected on node-03", source: "MonitoringAgent" },
    { time: "14:28:44", level: "INFO", message: "Completed 50,000 self-play games", source: "ForgeEngine" },
    { time: "14:27:33", level: "INFO", message: "Analytics data backup completed", source: "BackupService" },
    { time: "14:26:15", level: "ERROR", message: "Connection timeout to analytics database", source: "AnalyticsCollector" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">System Logs</h3>
        <div className="flex items-center gap-2">
          <select className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-3xl text-xs font-inter">
            <option>All levels</option>
            <option>Error only</option>
            <option>Warn + Error</option>
          </select>
          <button className="p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Clock size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="font-inter text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{log.time}</span>
            </div>
            
            <div className={`px-2 py-0.5 rounded text-xs font-inter font-medium flex-shrink-0 ${
              log.level === 'ERROR' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
              log.level === 'WARN' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
              'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            }`}>
              {log.level}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-inter text-xs text-black dark:text-white break-words">{log.message}</div>
              <div className="font-inter text-xs text-gray-400 dark:text-gray-500">{log.source}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SystemMonitor() {
  return (
    <div className="space-y-6">
      <SystemStats />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <InfrastructureHealth />
        <ResourceUsage />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActiveProcesses />
        <SystemLogs />
      </div>
    </div>
  );
}