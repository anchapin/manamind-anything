import { useState, useEffect } from "react";
import {
  Eye,
  Gamepad2,
  Clock,
  Cpu,
  Activity,
  RefreshCw,
  PlayCircle,
  ChevronRight,
} from "./icons";

const GameViewer = ({ liveGame }) => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
        Live Game View
      </h3>
      <div className="flex items-center gap-2">
        <div
          className={`status-indicator ${liveGame ? "status-running" : "status-idle"}`}
        >
          <span
            className={`text-sm font-inter font-medium ${
              liveGame
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {liveGame ? "Live" : "No Active Game"}
          </span>
        </div>
        <button className="p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>

    <div className="space-y-4">
      <div className="aspect-video bg-gray-900 dark:bg-gray-950 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Gamepad2 size={48} className="mx-auto mb-4 opacity-60" />
            {liveGame ? (
              <>
                <div className="font-barlow text-lg font-medium">
                  Game in Progress
                </div>
                <div className="font-inter text-sm opacity-80">
                  Turn {liveGame.turn} - {liveGame.players.ai.name} vs{" "}
                  {liveGame.players.opponent.name}
                </div>
              </>
            ) : (
              <>
                <div className="font-barlow text-lg font-medium">
                  No Active Game
                </div>
                <div className="font-inter text-sm opacity-80">
                  Waiting for next match
                </div>
              </>
            )}
          </div>
        </div>

        {liveGame && (
          <>
            <div className="absolute top-4 left-4 bg-black/60 rounded-xl px-3 py-2">
              <div className="text-white text-sm font-inter">
                <div>
                  {liveGame.players.ai.name}: {liveGame.players.ai.life} life
                </div>
                <div>
                  {liveGame.players.opponent.name}:{" "}
                  {liveGame.players.opponent.life} life
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 bg-black/60 rounded-xl px-3 py-2">
              <div className="text-white text-xs font-inter">
                Turn {liveGame.turn} • {Math.floor(liveGame.duration / 60)}:
                {String(liveGame.duration % 60).padStart(2, "0")} elapsed
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Cards in Hand
          </div>
          <div className="font-inter text-xl font-semibold text-black dark:text-white">
            {liveGame?.gameState?.cardsInHand || 0}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Mana Available
          </div>
          <div className="font-inter text-xl font-semibold text-black dark:text-white">
            {liveGame?.gameState?.manaAvailable || 0}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Creatures
          </div>
          <div className="font-inter text-xl font-semibold text-black dark:text-white">
            {liveGame?.gameState?.creatures || 0}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AIDecisionProcess = () => {
  const [decisionData, setDecisionData] = useState(null);

  useEffect(() => {
    fetchAIDecisions();
    const interval = setInterval(fetchAIDecisions, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAIDecisions = async () => {
    try {
      const response = await fetch("/api/ai/decisions");
      if (response.ok) {
        const data = await response.json();
        setDecisionData(data);
      }
    } catch (error) {
      console.error("Error fetching AI decisions:", error);
    }
  };

  if (!decisionData || decisionData.options.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
            AI Decision Making
          </h3>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <div className="font-inter text-sm">No active decision process</div>
          <div className="font-inter text-xs mt-1">
            Waiting for game to start
          </div>
        </div>
      </div>
    );
  }

  const topOption = decisionData.options[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
          AI Decision Making
        </h3>
        <div
          className={`w-3 h-3 rounded-full ${decisionData.status === "thinking" ? "bg-purple-500 training-pulse" : "bg-green-500"}`}
        ></div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
          <div className="font-inter text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
            {decisionData.currentDecision}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-inter text-xs text-purple-700 dark:text-purple-300">
                {topOption.name}
              </span>
              <span className="font-inter text-xs font-medium text-purple-900 dark:text-purple-100">
                {Math.round(topOption.probability * 100)}%
              </span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full"
                style={{ width: `${topOption.probability * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {decisionData.options.slice(1).map((option, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <span className="font-inter text-sm text-black dark:text-white">
                {option.name}
              </span>
              <span className="font-inter text-sm font-medium text-gray-600 dark:text-gray-400">
                {Math.round(option.probability * 100)}%
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs text-gray-500 dark:text-gray-400">
              Thinking time
            </span>
            <span className="font-inter text-xs font-medium text-black dark:text-white">
              {decisionData.thinkingTime}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveGames = () => {
  const [gamesData, setGamesData] = useState({ activeGames: [] });

  useEffect(() => {
    fetchActiveGames();
    const interval = setInterval(fetchActiveGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveGames = async () => {
    try {
      const response = await fetch("/api/games/active");
      if (response.ok) {
        const data = await response.json();
        setGamesData(data);
      }
    } catch (error) {
      console.error("Error fetching active games:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
          Active Sessions
        </h3>
        <button className="flex items-center gap-2 text-black dark:text-gray-300 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
          <span className="font-inter text-sm font-medium">View All</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {gamesData.activeGames.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="font-inter text-sm">No active games</div>
            <div className="font-inter text-xs mt-1">
              Start a new training session
            </div>
          </div>
        ) : (
          gamesData.activeGames.map((game) => (
            <div
              key={game.id}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl"
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  game.status === "active"
                    ? "bg-green-500"
                    : game.status === "paused"
                      ? "bg-yellow-500"
                      : "bg-gray-400 dark:bg-gray-500"
                }`}
              ></div>

              <div className="flex-1">
                <div className="font-inter text-sm font-medium text-black dark:text-white">
                  {game.opponent}
                </div>
                <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  Turn {game.turn} • Win probability:{" "}
                  {Math.round(game.winProb * 100)}%
                </div>
              </div>

              <div className="flex items-center gap-2">
                {game.status === "active" && (
                  <button className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <Eye
                      size={16}
                      className="text-gray-600 dark:text-gray-400"
                    />
                  </button>
                )}
                <div
                  className={`px-2 py-1 rounded-full text-xs font-inter font-medium ${
                    game.status === "active"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : game.status === "paused"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                        : "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {game.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RealtimeStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/system/metrics");
      if (response.ok) {
        const data = await response.json();
        setStats(data.realTimeStats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl"
              >
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
          Real-time Stats
        </h3>
        <div className="status-indicator status-running">
          <Activity size={16} className="text-green-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <div className="w-8 h-8 gradient-ai-green rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock size={16} className="text-white" />
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Avg. Move Time
          </div>
          <div className="font-inter text-lg font-semibold text-black dark:text-white">
            {stats.avgMoveTime}
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <div className="w-8 h-8 gradient-neural-purple rounded-full flex items-center justify-center mx-auto mb-2">
            <Cpu size={16} className="text-white" />
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            CPU Usage
          </div>
          <div className="font-inter text-lg font-semibold text-black dark:text-white">
            {stats.cpuUsage}
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <div className="w-8 h-8 gradient-cyan-blue rounded-full flex items-center justify-center mx-auto mb-2">
            <Activity size={16} className="text-white" />
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Games Today
          </div>
          <div className="font-inter text-lg font-semibold text-black dark:text-white">
            {stats.gamesToday.toLocaleString()}
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <div className="w-8 h-8 gradient-purple-indigo rounded-full flex items-center justify-center mx-auto mb-2">
            <PlayCircle size={16} className="text-white" />
          </div>
          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
            Win Rate Today
          </div>
          <div className="font-inter text-lg font-semibold text-black dark:text-white">
            {stats.winRateToday}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LivePlayInterface() {
  const [liveGame, setLiveGame] = useState(null);

  useEffect(() => {
    fetchLiveGame();
    const interval = setInterval(fetchLiveGame, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveGame = async () => {
    try {
      const response = await fetch("/api/games/active");
      if (response.ok) {
        const data = await response.json();
        setLiveGame(data.liveGame);
      }
    } catch (error) {
      console.error("Error fetching live game:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <GameViewer liveGame={liveGame} />
        </div>
        <div>
          <AIDecisionProcess />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveGames />
        <RealtimeStats />
      </div>
    </div>
  );
}
