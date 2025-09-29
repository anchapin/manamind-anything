import { useState } from 'react';
import { BarChart3, TrendingUp, Target, ChevronDown, RefreshCw } from "./icons";

const PerformanceChart = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">Win Rate Over Time</h3>
      <div className="flex items-center gap-2">
        <select className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-3xl text-xs font-inter">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
        <button className="p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
    
    <div className="h-64 flex items-end justify-between gap-2 px-4">
      {[65, 68, 71, 73, 75, 74, 76, 78, 75, 77, 79, 73, 74, 77].map((value, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <div 
            className="w-6 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg"
            style={{ height: `${(value / 80) * 100}%` }}
          ></div>
          <span className="text-xs font-inter text-gray-400 dark:text-gray-500">{index + 1}</span>
        </div>
      ))}
    </div>
    
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="text-center">
        <div className="text-xs font-inter text-gray-500 dark:text-gray-400">Current</div>
        <div className="font-inter text-lg font-semibold text-black dark:text-white">77.2%</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-inter text-gray-500 dark:text-gray-400">Average</div>
        <div className="font-inter text-lg font-semibold text-black dark:text-white">74.8%</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-inter text-gray-500 dark:text-gray-400">Peak</div>
        <div className="font-inter text-lg font-semibold text-green-600 dark:text-green-400">79.1%</div>
      </div>
    </div>
  </div>
);

const MatchupAnalysis = () => {
  const matchups = [
    { deck: "Aggro Red", winRate: 82.3, games: 1247, trend: "+3.2%" },
    { deck: "Control Blue", winRate: 76.8, games: 934, trend: "+1.8%" },
    { deck: "Midrange Green", winRate: 71.2, games: 1102, trend: "-2.1%" },
    { deck: "Combo Artifacts", winRate: 68.9, games: 678, trend: "+5.4%" },
    { deck: "Tempo White", winRate: 74.5, games: 892, trend: "+0.9%" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">Matchup Analysis</h3>
        <button className="flex items-center gap-2 text-black dark:text-gray-300 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
          <span className="font-inter text-sm font-medium">View All</span>
          <ChevronDown size={16} />
        </button>
      </div>
      
      <div className="space-y-3">
        {matchups.map((matchup, index) => (
          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="flex-1">
              <div className="font-inter text-sm font-medium text-black dark:text-white">{matchup.deck}</div>
              <div className="font-inter text-xs text-gray-500 dark:text-gray-400">{matchup.games} games</div>
            </div>
            <div className="text-right">
              <div className="font-inter text-sm font-semibold text-black dark:text-white">{matchup.winRate}%</div>
              <div className={`font-inter text-xs ${
                matchup.trend.startsWith('+') 
                  ? 'text-green-500 dark:text-green-400' 
                  : 'text-red-500 dark:text-red-400'
              }`}>
                {matchup.trend}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StrategyInsights = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">Strategy Insights</h3>
      <div className="w-3 h-3 bg-blue-500 rounded-full training-pulse"></div>
    </div>
    
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mt-1">
            <Target size={16} className="text-white" />
          </div>
          <div>
            <div className="font-inter text-sm font-medium text-blue-900 dark:text-blue-100">
              Optimal Mulligan Strategy Discovered
            </div>
            <div className="font-inter text-xs text-blue-700 dark:text-blue-300 mt-1">
              AI has developed a 87% accurate hand evaluation system, improving opening hand decisions by 12%
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mt-1">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <div className="font-inter text-sm font-medium text-green-900 dark:text-green-100">
              Mana Curve Optimization
            </div>
            <div className="font-inter text-xs text-green-700 dark:text-green-300 mt-1">
              Discovered that 2-drop creatures are 23% more valuable in current meta than previously estimated
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-3xl border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mt-1">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <div className="font-inter text-sm font-medium text-purple-900 dark:text-purple-100">
              Counter-Play Patterns
            </div>
            <div className="font-inter text-xs text-purple-700 dark:text-purple-300 mt-1">
              AI identified 3 new optimal responses to common opponent strategies, increasing win rate vs control by 8%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ModelComparison = () => {
  const models = [
    { name: "v2.3.1", winRate: 77.2, games: 12847, status: "active" },
    { name: "v2.2.8", winRate: 74.8, games: 45231, status: "retired" },
    { name: "v2.1.5", winRate: 71.3, games: 38912, status: "retired" },
    { name: "v2.0.2", winRate: 68.7, games: 29445, status: "retired" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">Model Comparison</h3>
        <button className="flex items-center gap-2 text-black dark:text-gray-300 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
          <span className="font-inter text-sm font-medium">Export Data</span>
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="space-y-3">
        {models.map((model, index) => (
          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl">
            <div className={`w-3 h-3 rounded-full ${
              model.status === 'active' 
                ? 'bg-green-500' 
                : 'bg-gray-400 dark:bg-gray-500'
            }`}></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-inter text-sm font-medium text-black dark:text-white">{model.name}</span>
                {model.status === 'active' && (
                  <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full text-xs font-inter">
                    Active
                  </span>
                )}
              </div>
              <div className="font-inter text-xs text-gray-500 dark:text-gray-400">{model.games.toLocaleString()} games</div>
            </div>
            <div className="text-right">
              <div className="font-inter text-sm font-semibold text-black dark:text-white">{model.winRate}%</div>
              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                  style={{ width: `${model.winRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalyticsCenter() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <MatchupAnalysis />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyInsights />
        <ModelComparison />
      </div>
    </div>
  );
}