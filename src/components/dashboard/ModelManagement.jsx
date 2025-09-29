import { useState } from "react";
import {
  Layers,
  Database,
  Plus,
  ChevronDown,
  RefreshCw,
  MoreVertical,
  Target,
  Trophy,
} from "./icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ModelVersions = () => {
  // --- replace static models with live data using react-query ---
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch("/api/models/neural");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/models/neural, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const deployMutation = useMutation({
    mutationFn: async (version) => {
      setError(null);
      const res = await fetch("/api/models/neural", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deploy", modelVersion: version }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Deploy failed: [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (err) => {
      console.error(err);
      setError("Could not deploy model");
    },
  });

  const models = data?.models || [];
  const deployedVersion = data?.deployedVersion || null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
          Model Versions
        </h3>
        <button className="flex items-center gap-2 px-4 py-2 rounded-3xl bg-blue-500 hover:bg-blue-600 text-white transition-colors">
          <Plus size={16} />
          <span className="font-inter text-sm font-medium">Create Version</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl font-inter text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {models.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-inter text-sm">
                No models yet
              </div>
            ) : (
              models.map((model, index) => {
                const isDeployed =
                  model.status === "deployed" ||
                  model.version === deployedVersion;
                const winRatePct =
                  model?.winRate != null
                    ? Math.round(Number(model.winRate) * 1000) / 10
                    : null;
                return (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-neural-purple rounded-full flex items-center justify-center">
                          <Database size={20} className="text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-barlow text-lg font-semibold text-black dark:text-white">
                              {model.version}
                            </span>
                            {isDeployed && (
                              <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-inter font-medium">
                                Active
                              </span>
                            )}
                            {!isDeployed && model.status && (
                              <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-inter font-medium capitalize">
                                {model.status}
                              </span>
                            )}
                          </div>
                          <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                            {model.created
                              ? new Date(model.created).toLocaleString()
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isDeployed && (
                          <button
                            onClick={() => deployMutation.mutate(model.version)}
                            disabled={deployMutation.isLoading}
                            className="px-3 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-inter disabled:opacity-60"
                          >
                            {deployMutation.isLoading
                              ? "Deploying..."
                              : "Promote to Active"}
                          </button>
                        )}
                        <button className="p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <MoreVertical
                            size={20}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                          Win Rate
                        </div>
                        <div className="font-inter text-lg font-semibold text-black dark:text-white">
                          {winRatePct != null ? `${winRatePct}%` : "-"}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                          Games Trained
                        </div>
                        <div className="font-inter text-lg font-semibold text-black dark:text-white">
                          {Number(model.trainingGames || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                          Status
                        </div>
                        <div
                          className={`font-inter text-sm font-semibold capitalize ${isDeployed ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
                        >
                          {isDeployed ? "deployed" : model.status || "-"}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                          Architecture
                        </div>
                        <div className="font-inter text-lg font-semibold text-black dark:text-white">
                          {model.architecture || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ModelComparison = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
        Performance Comparison
      </h3>
      <div className="flex items-center gap-2">
        <select className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-3xl text-xs font-inter">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>All time</option>
        </select>
        <button className="p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="font-inter text-sm font-medium text-black dark:text-white">
            v2.3.1 vs v2.2.8
          </span>
        </div>
        <div className="font-inter text-sm font-semibold text-blue-600 dark:text-blue-400">
          +2.4% win rate
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="font-inter text-sm font-medium text-black dark:text-white">
            v2.2.8 vs v2.1.5
          </span>
        </div>
        <div className="font-inter text-sm font-semibold text-green-600 dark:text-green-400">
          +3.5% win rate
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="font-inter text-sm font-medium text-black dark:text-white">
            v2.1.5 vs v2.0.2
          </span>
        </div>
        <div className="font-inter text-sm font-semibold text-green-600 dark:text-green-400">
          +2.6% win rate
        </div>
      </div>
    </div>

    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3 mb-2">
        <Trophy size={16} className="text-green-600 dark:text-green-400" />
        <span className="font-inter text-sm font-medium text-green-900 dark:text-green-100">
          Best Performance Improvement
        </span>
      </div>
      <div className="font-inter text-xs text-green-700 dark:text-green-300">
        v2.2.8 → v2.3.1: 8.7% improvement in control matchups through better
        card evaluation
      </div>
    </div>
  </div>
);

const TrainingProgress = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
        Training Progress
      </h3>
      <div className="w-3 h-3 bg-blue-500 rounded-full training-pulse"></div>
    </div>

    <div className="space-y-4">
      <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-inter text-sm font-medium text-blue-900 dark:text-blue-100">
            v2.4.0 (In Progress)
          </span>
          <span className="font-inter text-xs text-blue-700 dark:text-blue-300">
            67% complete
          </span>
        </div>
        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: "67%" }}
          ></div>
        </div>
        <div className="font-inter text-xs text-blue-700 dark:text-blue-300">
          Focus: Multi-format training, improved sideboard decisions
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Target size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="font-inter text-sm font-medium text-black dark:text-white">
              Neural Network Optimization
            </div>
            <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
              Completed • 95% efficiency gain
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Layers size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="font-inter text-sm font-medium text-black dark:text-white">
              Self-Play Data Generation
            </div>
            <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
              In progress • 890K games generated
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <Database size={16} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="font-inter text-sm font-medium text-gray-500 dark:text-gray-400">
              Model Validation
            </div>
            <div className="font-inter text-xs text-gray-400 dark:text-gray-500">
              Pending • Awaiting training completion
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DeploymentSettings = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 hover-lift">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-barlow text-lg font-semibold text-black dark:text-white">
        Deployment Settings
      </h3>
      <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700">
        <MoreVertical size={20} />
      </button>
    </div>

    <div className="space-y-4">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="font-inter text-sm font-medium text-black dark:text-white">
            Auto-deployment
          </span>
          <div className="w-12 h-6 bg-green-500 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
          Automatically deploy models that achieve {">"}75% win rate
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="font-inter text-sm font-medium text-black dark:text-white">
            A/B Testing
          </span>
          <div className="w-12 h-6 bg-blue-500 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
          Run new models against 20% of traffic before full deployment
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="font-inter text-sm font-medium text-black dark:text-white">
            Rollback on failure
          </span>
          <div className="w-12 h-6 bg-green-500 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
          Revert to previous version if win rate drops below 70%
        </div>
      </div>
    </div>
  </div>
);

export default function ModelManagement() {
  return (
    <div className="space-y-6">
      <ModelVersions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelComparison />
        <TrainingProgress />
      </div>

      <DeploymentSettings />
    </div>
  );
}
