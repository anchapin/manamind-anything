import { useState, useEffect } from "react";
import {
  PlayCircle,
  PauseCircle,
  StopCircle,
  RefreshCw,
  MoreVertical,
  Clock,
  Target,
  Trophy,
  Zap,
} from "./icons";

const TrainingStatus = () => {
  const [trainingData, setTrainingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noActiveSession, setNoActiveSession] = useState(false);

  useEffect(() => {
    fetchTrainingStatus();
    // Refresh every 5 seconds
    const interval = setInterval(fetchTrainingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch("/api/training/status");
      if (response.status === 404) {
        // No active training session - this is normal
        setNoActiveSession(true);
        setTrainingData(null);
        setError(null);
      } else if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } else {
        const data = await response.json();
        setTrainingData(data);
        setNoActiveSession(false);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching training status:", err);
      setError(err.message);
      setNoActiveSession(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (noActiveSession) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
            Training Status
          </h3>
          <div className="status-indicator">
            <span className="text-sm font-inter font-medium text-gray-500 dark:text-gray-400">
              No Active Session
            </span>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle
              size={32}
              className="text-gray-400 dark:text-gray-500"
            />
          </div>
          <p className="font-inter text-gray-600 dark:text-gray-400 mb-2">
            No training session is currently running
          </p>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400">
            Start a new training session to begin monitoring progress
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
        <div className="text-center text-red-500 dark:text-red-400">
          <p>Failed to load training status</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchTrainingStatus}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { session } = trainingData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
          Training Status
        </h3>
        <div
          className={`status-indicator ${session.status === "running" ? "status-running" : "status-paused"}`}
        >
          <span
            className={`text-sm font-inter font-medium ${
              session.status === "running"
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {session.status === "running" ? "Running" : "Paused"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${session.status === "running" ? "bg-green-500 training-pulse" : "bg-yellow-500"}`}
          ></div>
          <span className="font-inter text-sm text-gray-600 dark:text-gray-400">
            Session: {session.name}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-inter text-gray-600 dark:text-gray-400">
              Progress
            </span>
            <span className="font-inter text-black dark:text-white font-medium">
              {session.progress.current.toLocaleString()} /{" "}
              {session.progress.target.toLocaleString()} games
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="gradient-ai-green h-2 rounded-full"
              style={{ width: `${session.progress.percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <span className="text-xs font-inter text-gray-500 dark:text-gray-400">
              Win Rate
            </span>
            <div className="font-inter text-lg font-semibold text-black dark:text-white">
              {session.performance.winRate}%
            </div>
          </div>
          <div>
            <span className="text-xs font-inter text-gray-500 dark:text-gray-400">
              Games/Hour
            </span>
            <div className="font-inter text-lg font-semibold text-black dark:text-white">
              {session.performance.gamesPerHour.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainingControls = () => {
  const [isTraining, setIsTraining] = useState(true);
  const [loading, setLoading] = useState(false);

  const controlTraining = async (action, config = null) => {
    setLoading(true);
    try {
      const response = await fetch("/api/training/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, config }),
      });

      if (!response.ok) {
        throw new Error("Failed to control training");
      }

      const result = await response.json();
      setIsTraining(result.session.status === "running");
    } catch (error) {
      console.error("Error controlling training:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
          Training Controls
        </h3>
        <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setIsTraining(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-3xl transition-colors ${
            isTraining
              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <PlayCircle size={16} />
          <span className="font-inter text-sm font-medium">Start</span>
        </button>

        <button
          onClick={() => setIsTraining(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-3xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <PauseCircle size={16} />
          <span className="font-inter text-sm font-medium">Pause</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-3xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <StopCircle size={16} />
          <span className="font-inter text-sm font-medium">Stop</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-inter font-medium text-gray-700 dark:text-gray-300 mb-2">
            Learning Rate
          </label>
          <input
            type="range"
            min="0.0001"
            max="0.01"
            step="0.0001"
            defaultValue="0.003"
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-3xl appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs font-inter text-gray-500 dark:text-gray-400 mt-1">
            <span>0.0001</span>
            <span>0.003</span>
            <span>0.01</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-inter font-medium text-gray-700 dark:text-gray-300 mb-2">
            Batch Size
          </label>
          <select
            defaultValue="64"
            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 text-black dark:text-white font-inter text-sm"
          >
            <option value="32">32</option>
            <option value="64">64</option>
            <option value="128">128</option>
            <option value="256">256</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const RecentMetrics = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
        Recent Performance
      </h3>
      <button className="flex items-center gap-2 text-black dark:text-gray-300 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
        <span className="font-inter text-sm font-medium">View Details</span>
        <RefreshCw size={16} />
      </button>
    </div>

    <div className="space-y-4">
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl">
        <div className="w-10 h-10 gradient-neural-purple rounded-3xl flex items-center justify-center">
          <Clock size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="font-inter text-sm font-medium text-black dark:text-white">
            Last 1000 Games
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Avg. Win Rate: 74.8%
          </div>
        </div>
        <div className="text-right">
          <div className="font-inter text-sm font-semibold text-green-600 dark:text-green-400">
            +2.3%
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            vs previous
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl">
        <div className="w-10 h-10 gradient-cyan-blue rounded-3xl flex items-center justify-center">
          <Target size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="font-inter text-sm font-medium text-black dark:text-white">
            Policy Accuracy
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Move prediction rate
          </div>
        </div>
        <div className="text-right">
          <div className="font-inter text-sm font-semibold text-black dark:text-white">
            87.4%
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            stable
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl">
        <div className="w-10 h-10 gradient-ai-green rounded-3xl flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="font-inter text-sm font-medium text-black dark:text-white">
            Training Speed
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Games per second
          </div>
        </div>
        <div className="text-right">
          <div className="font-inter text-sm font-semibold text-black dark:text-white">
            0.51
          </div>
          <div className="font-inter text-xs text-green-500 dark:text-green-400">
            optimal
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ModelProgress = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
        Model Milestones
      </h3>
      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-3xl text-xs font-inter">
        v2.3.1
      </span>
    </div>

    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-5 top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Trophy size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 pb-6">
            <div className="font-inter text-sm font-medium text-black dark:text-white">
              80% Win Rate Achieved
            </div>
            <div className="font-inter text-xs text-gray-500 dark:text-gray-400 mb-2">
              Against Forge AI opponents
            </div>
            <div className="font-inter text-xs text-green-600 dark:text-green-400">
              Milestone completed • 2 hours ago
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Target size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 pb-6">
            <div className="font-inter text-sm font-medium text-black dark:text-white">
              Policy Network Optimization
            </div>
            <div className="font-inter text-xs text-gray-500 dark:text-gray-400 mb-2">
              Improved move selection accuracy
            </div>
            <div className="font-inter text-xs text-blue-600 dark:text-blue-400">
              In progress • 67% complete
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Zap size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="font-inter text-sm font-medium text-gray-400 dark:text-gray-500">
              MTGA Integration
            </div>
            <div className="font-inter text-xs text-gray-400 dark:text-gray-500 mb-2">
              Arena client interface
            </div>
            <div className="font-inter text-xs text-gray-400 dark:text-gray-500">
              Pending • Phase 2
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function TrainingDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrainingStatus />
        <TrainingControls />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentMetrics />
        <ModelProgress />
      </div>
    </div>
  );
}
