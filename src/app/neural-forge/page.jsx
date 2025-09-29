"use client";

import { useState, useEffect } from "react";
import {
  PlayCircle,
  PauseCircle,
  StopCircle,
  Brain,
  Gamepad2,
  Zap,
  ArrowRightLeft,
  Settings,
  TrendingUp,
  Activity,
  Cpu,
} from "lucide-react";
import RealForgeManager from "@/components/dashboard/RealForgeManager";
import ForgeSetupGuide from "@/components/dashboard/ForgeSetupGuide";

export default function NeuralForgePage() {
  const [activeMode, setActiveMode] = useState("neural");
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [models, setModels] = useState([]);
  const [forgeGames, setForgeGames] = useState([]);
  const [config, setConfig] = useState({
    neural: {
      targetGames: 10000,
      learningRate: 0.001,
      batchSize: 64,
      mctsSimulations: 100,
    },
    forge: {
      targetGames: 1000,
      opponentDifficulty: "medium",
      gameFormat: "standard",
    },
    hybrid: {
      targetGames: 5000,
      neuralGames: 3000,
      forgeGames: 2000,
      alternateEvery: 500,
    },
  });

  useEffect(() => {
    fetchTrainingStatus();
    fetchModels();
    fetchForgeGames();

    const interval = setInterval(() => {
      fetchTrainingStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch("/api/training/status");
      if (response.status === 404) {
        // No active training session - this is normal
        setTrainingStatus(null);
      } else if (response.ok) {
        const data = await response.json();
        setTrainingStatus(data.session);
      } else {
        console.error(
          "Failed to fetch training status:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error fetching training status:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models/neural");
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const fetchForgeGames = async () => {
    try {
      const response = await fetch("/api/forge/integration");
      if (response.ok) {
        const data = await response.json();
        setForgeGames(data.activeGames || []);
      }
    } catch (error) {
      console.error("Error fetching Forge games:", error);
    }
  };

  const startTraining = async (mode) => {
    setIsStarting(true);
    try {
      const response = await fetch("/api/training/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          config: {
            mode,
            ...config[mode],
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTrainingStatus(result.session);
        setActiveMode(mode);
      } else {
        console.error("Failed to start training");
      }
    } catch (error) {
      console.error("Error starting training:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const controlTraining = async (action) => {
    try {
      const response = await fetch("/api/training/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, config: {} }),
      });

      if (response.ok) {
        fetchTrainingStatus();
      }
    } catch (error) {
      console.error(`Error ${action} training:`, error);
    }
  };

  const switchMode = async (newMode) => {
    try {
      const response = await fetch("/api/training/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "switch_mode",
          config: {
            previousMode: activeMode,
            newMode,
            ...config[newMode],
          },
        }),
      });

      if (response.ok) {
        setActiveMode(newMode);
        fetchTrainingStatus();
      }
    } catch (error) {
      console.error("Error switching mode:", error);
    }
  };

  const TrainingModeCard = ({
    mode,
    title,
    icon: Icon,
    description,
    isActive,
    onSelect,
  }) => (
    <div
      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
        isActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
      }`}
      onClick={() => onSelect(mode)}
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon
          size={24}
          className={
            isActive ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
          }
        />
        <h3 className="font-semibold text-lg">{title}</h3>
        {isActive && (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {description}
      </p>

      {mode === "neural" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Target Games:</span>
            <input
              type="number"
              value={config.neural.targetGames}
              onChange={(e) =>
                setConfig({
                  ...config,
                  neural: {
                    ...config.neural,
                    targetGames: parseInt(e.target.value),
                  },
                })
              }
              className="w-20 px-2 py-1 text-right bg-gray-50 dark:bg-gray-700 rounded"
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>Learning Rate:</span>
            <input
              type="number"
              step="0.001"
              value={config.neural.learningRate}
              onChange={(e) =>
                setConfig({
                  ...config,
                  neural: {
                    ...config.neural,
                    learningRate: parseFloat(e.target.value),
                  },
                })
              }
              className="w-20 px-2 py-1 text-right bg-gray-50 dark:bg-gray-700 rounded"
            />
          </div>
        </div>
      )}

      {mode === "forge" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Target Games:</span>
            <input
              type="number"
              value={config.forge.targetGames}
              onChange={(e) =>
                setConfig({
                  ...config,
                  forge: {
                    ...config.forge,
                    targetGames: parseInt(e.target.value),
                  },
                })
              }
              className="w-20 px-2 py-1 text-right bg-gray-50 dark:bg-gray-700 rounded"
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>Difficulty:</span>
            <select
              value={config.forge.opponentDifficulty}
              onChange={(e) =>
                setConfig({
                  ...config,
                  forge: {
                    ...config.forge,
                    opponentDifficulty: e.target.value,
                  },
                })
              }
              className="px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-xs"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      )}

      {mode === "hybrid" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Neural Games:</span>
            <input
              type="number"
              value={config.hybrid.neuralGames}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hybrid: {
                    ...config.hybrid,
                    neuralGames: parseInt(e.target.value),
                  },
                })
              }
              className="w-20 px-2 py-1 text-right bg-gray-50 dark:bg-gray-700 rounded"
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>Forge Games:</span>
            <input
              type="number"
              value={config.hybrid.forgeGames}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hybrid: {
                    ...config.hybrid,
                    forgeGames: parseInt(e.target.value),
                  },
                })
              }
              className="w-20 px-2 py-1 text-right bg-gray-50 dark:bg-gray-700 rounded"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Neural Network + Forge Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced AI training combining neural networks with real MTG
            opponents
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
            <Cpu className="w-4 h-4" />
            <span>Real Forge Process Control Available</span>
          </div>
        </div>

        {/* Training Status */}
        {trainingStatus && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Current Training</h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    trainingStatus.status === "running"
                      ? "bg-green-500 animate-pulse"
                      : trainingStatus.status === "paused"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm font-medium capitalize">
                  {trainingStatus.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {trainingStatus.progress?.current?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-500">Games Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {trainingStatus.performance?.winRate || 0}%
                </div>
                <div className="text-sm text-gray-500">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {trainingStatus.performance?.gamesPerHour || 0}
                </div>
                <div className="text-sm text-gray-500">Games/Hour</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${trainingStatus.progress?.percentage || 0}%`,
                }}
              ></div>
            </div>

            <div className="flex gap-3">
              {trainingStatus.status === "running" ? (
                <button
                  onClick={() => controlTraining("pause")}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <PauseCircle size={16} />
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => controlTraining("resume")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <PlayCircle size={16} />
                  Resume
                </button>
              )}
              <button
                onClick={() => controlTraining("stop")}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <StopCircle size={16} />
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Training Mode Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Training Modes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrainingModeCard
              mode="neural"
              title="Neural Network"
              icon={Brain}
              description="Pure self-play neural network learning with AlphaZero architecture"
              isActive={activeMode === "neural"}
              onSelect={setActiveMode}
            />
            <TrainingModeCard
              mode="forge"
              title="Forge Integration"
              icon={Gamepad2}
              description="Training against Forge AI opponents with real MTG rules"
              isActive={activeMode === "forge"}
              onSelect={setActiveMode}
            />
            <TrainingModeCard
              mode="hybrid"
              title="Hybrid Training"
              icon={Zap}
              description="Combined neural self-play and Forge opponent training"
              isActive={activeMode === "hybrid"}
              onSelect={setActiveMode}
            />
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => startTraining(activeMode)}
              disabled={isStarting || trainingStatus?.status === "running"}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayCircle size={20} />
              {isStarting
                ? "Starting..."
                : `Start ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} Training`}
            </button>

            {trainingStatus && (
              <button
                onClick={() =>
                  switchMode(
                    activeMode === "neural"
                      ? "forge"
                      : activeMode === "forge"
                        ? "hybrid"
                        : "neural",
                  )
                }
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowRightLeft size={20} />
                Switch Mode
              </button>
            )}
          </div>
        </div>

        {/* Real Forge Manager */}
        <div className="mb-8">
          <RealForgeManager />
        </div>

        {/* Forge Setup Guide */}
        <div className="mb-8">
          <ForgeSetupGuide />
        </div>

        {/* Status Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Neural Models */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain size={20} className="text-blue-500" />
              Neural Models
            </h3>

            {models.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain size={48} className="mx-auto mb-4 opacity-30" />
                <p>No neural models yet</p>
                <p className="text-sm">
                  Start neural training to create your first model
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {models.slice(0, 5).map((model, index) => (
                  <div
                    key={model.version}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">
                        {model.trainingGames.toLocaleString()} games
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {model.winRate
                          ? `${(model.winRate * 100).toFixed(1)}%`
                          : "Training"}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          model.status === "trained"
                            ? "bg-green-100 text-green-600"
                            : model.status === "training"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {model.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forge Games */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gamepad2 size={20} className="text-green-500" />
              Active Forge Games
            </h3>

            {forgeGames.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gamepad2 size={48} className="mx-auto mb-4 opacity-30" />
                <p>No active Forge games</p>
                <p className="text-sm">Start Forge training to begin playing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {forgeGames.map((game, index) => (
                  <div
                    key={game.gameId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div>
                      <div className="font-medium">{game.players.opponent}</div>
                      <div className="text-sm text-gray-500">
                        Turn {game.state.turn}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {game.state.player1Life} vs {game.state.player2Life}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          game.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {game.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
