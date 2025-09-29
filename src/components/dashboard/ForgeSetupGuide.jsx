'use client';

import { useState } from 'react';
import { Download, Terminal, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export default function ForgeSetupGuide() {
  const [currentStep, setCurrentStep] = useState(0);

  const setupSteps = [
    {
      title: 'Download Forge',
      icon: Download,
      description: 'Get the latest Forge release',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Download the latest Forge release from the official repository:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4" />
              <a 
                href="https://releases.cardforge.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                https://releases.cardforge.org/
              </a>
            </div>
            <p className="text-sm text-gray-600">
              Download the latest "forge-gui-desktop" JAR file
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Requirements:</strong> Java 8 or higher must be installed on your system.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Install Java',
      icon: Terminal,
      description: 'Ensure Java is available',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Verify Java is installed and accessible:
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="mb-2">$ java -version</div>
            <div className="text-gray-400">
              openjdk version "11.0.0" 2018-09-25<br/>
              OpenJDK Runtime Environment...<br/>
              OpenJDK 64-Bit Server VM...
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Install Java (if needed):</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <strong>Ubuntu/Debian:</strong><br/>
                <code className="text-xs bg-gray-200 px-1 rounded">
                  sudo apt install openjdk-11-jre
                </code>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>macOS:</strong><br/>
                <code className="text-xs bg-gray-200 px-1 rounded">
                  brew install openjdk@11
                </code>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Windows:</strong><br/>
                <span className="text-xs">Download from Oracle or OpenJDK</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Configure Environment',
      icon: Terminal,
      description: 'Set up environment variables',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Configure environment variables for the ManaMind integration:
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Set Environment Variables:</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div># Path to Forge installation directory</div>
                <div>export FORGE_PATH="/opt/forge"</div>
                <div className="mt-2"># Path to Java executable (optional)</div>
                <div>export JAVA_PATH="java"</div>
                <div className="mt-2"># Base URL for API calls (development)</div>
                <div>export BASE_URL="http://localhost:3000"</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800">For Production:</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    Add these variables to your deployment environment or .env file
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Directory Structure:</h4>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              /opt/forge/<br/>
              ├── forge-gui-desktop.jar<br/>
              ├── res/ (card images & data)<br/>
              └── cache/ (generated files)
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Test Integration',
      icon: CheckCircle,
      description: 'Verify everything works',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Test the Forge integration using the Real Forge Manager:
          </p>
          
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Testing Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                <li>Use the "Launch Real Forge" button above</li>
                <li>Select AI difficulty (start with Medium)</li>
                <li>Choose a player deck archetype</li>
                <li>Monitor the Activity Log for successful launch</li>
                <li>Check the Active Instances panel for running processes</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Expected Behavior:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Forge process starts within 10-15 seconds</li>
                <li>• Activity log shows "✅ Forge launched successfully"</li>
                <li>• Process appears in Active Instances with green status</li>
                <li>• You can query game state and send commands</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-yellow-800">Troubleshooting:</h5>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Check Java version and PATH</li>
                    <li>• Verify FORGE_PATH points to correct directory</li>
                    <li>• Ensure Forge JAR file has execute permissions</li>
                    <li>• Check server logs for detailed error messages</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = setupSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Real Forge Setup Guide
        </h2>
        <p className="text-gray-600">
          Follow these steps to connect ManaMind with real Forge AI opponents
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          {setupSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentStep === index
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <StepIcon className="w-4 h-4" />
                <span className="hidden md:inline">
                  Step {index + 1}
                </span>
              </button>
            );
          })}
        </div>
        
        <div className="text-sm text-gray-500">
          {currentStep + 1} of {setupSteps.length}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            <p className="text-gray-600 text-sm">{currentStepData.description}</p>
          </div>
        </div>
        
        <div className="pl-9">
          {currentStepData.content}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={() => setCurrentStep(Math.min(setupSteps.length - 1, currentStep + 1))}
          disabled={currentStep === setupSteps.length - 1}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === setupSteps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}