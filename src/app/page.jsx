"use client";

import { useState } from "react";
import { Play, Target, Brain } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import TrainingDashboard from "@/components/dashboard/TrainingDashboard";
import AnalyticsCenter from "@/components/dashboard/AnalyticsCenter";
import LivePlayInterface from "@/components/dashboard/LivePlayInterface";
import ModelManagement from "@/components/dashboard/ModelManagement";
import SystemMonitor from "@/components/dashboard/SystemMonitor";
import ForgeManager from "@/components/dashboard/ForgeManager";
import MTGAInterface from "@/components/dashboard/MTGAInterface"; // added import
import GlobalStyles from "@/components/dashboard/GlobalStyles";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("training");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "training":
        return <TrainingDashboard />;
      case "analytics":
        return <AnalyticsCenter />;
      case "live-play":
        return <LivePlayInterface />;
      case "models":
        return <ModelManagement />;
      case "forge":
        return <ForgeManager />;
      case "mtga":
        return <MTGAInterface />; // new case
      case "system":
        return <SystemMonitor />;
      default:
        return <TrainingDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GlobalStyles />

      {/* Quick Actions Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                ManaMind Training System
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Live MTG AI training dashboard with proof-of-concept bot
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/neural-forge"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Brain size={14} />
                Neural + Forge
              </a>
              <a
                href="/demo"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play size={14} />
                Interactive Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 lg:ml-60">
          <Header
            activeSection={activeSection}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className="p-6 lg:p-8">{renderContent()}</main>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-72">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
            Quick Start
          </h3>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Target size={12} className="text-blue-500" />
              <span>Training tab shows live AI metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain size={12} className="text-purple-500" />
              <span>Live Play shows AI decision making</span>
            </div>
            <div className="flex items-center gap-2">
              <Play size={12} className="text-green-500" />
              <a
                href="/demo"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try working bot demo →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
