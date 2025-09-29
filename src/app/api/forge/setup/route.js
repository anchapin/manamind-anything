import sql from "@/app/api/utils/sql";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Forge Environment Setup and Configuration API
export async function POST(request) {
  try {
    const { action, config } = await request.json();

    switch (action) {
      case "check_environment":
        return await checkForgeEnvironment();
      case "setup_forge":
        return await setupForgeEnvironment(config);
      case "configure_decks":
        return await configureForgeDecks(config);
      case "test_launch":
        return await testForgeLaunch(config);
      case "download_forge":
        return await downloadForge(config);
      case "update_config":
        return await updateForgeConfig(config);
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Forge setup error:", error);
    return Response.json({ error: "Forge setup failed" }, { status: 500 });
  }
}

export async function GET() {
  // Return current Forge environment status
  return await checkForgeEnvironment();
}

async function checkForgeEnvironment() {
  const checks = {
    java: { name: "Java Runtime", status: "checking", details: null },
    forge: { name: "Forge Installation", status: "checking", details: null },
    memory: { name: "Available Memory", status: "checking", details: null },
    permissions: { name: "File Permissions", status: "checking", details: null },
    config: { name: "Forge Configuration", status: "checking", details: null }
  };

  try {
    // Check Java installation
    try {
      const { stdout } = await execAsync('java -version');
      const javaVersion = stdout.match(/version "([^"]+)"/)?.[1] || "unknown";
      checks.java.status = "ok";
      checks.java.details = { version: javaVersion };
    } catch (error) {
      checks.java.status = "error";
      checks.java.details = { error: "Java not found or not accessible" };
    }

    // Check Forge installation
    const forgePath = process.env.FORGE_PATH || '/opt/forge';
    const forgeJar = path.join(forgePath, 'forge-gui-desktop.jar');
    
    try {
      await fs.access(forgeJar, fs.constants.F_OK);
      const stats = await fs.stat(forgeJar);
      checks.forge.status = "ok";
      checks.forge.details = {
        path: forgePath,
        jarFile: forgeJar,
        size: `${Math.round(stats.size / 1024 / 1024)}MB`,
        modified: stats.mtime
      };
    } catch (error) {
      checks.forge.status = "error";
      checks.forge.details = {
        error: "Forge JAR not found",
        expectedPath: forgeJar,
        suggestion: "Download and install Forge"
      };
    }

    // Check available memory
    try {
      const { stdout } = await execAsync('free -m');
      const memoryMatch = stdout.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (memoryMatch) {
        const [, total, used, available] = memoryMatch;
        checks.memory.status = parseInt(available) > 2048 ? "ok" : "warning";
        checks.memory.details = {
          total: `${total}MB`,
          used: `${used}MB`,
          available: `${available}MB`,
          recommendedMin: "2048MB"
        };
      }
    } catch (error) {
      checks.memory.status = "unknown";
      checks.memory.details = { error: "Could not check memory" };
    }

    // Check file permissions
    try {
      const tempDir = process.env.FORGE_TEMP_DIR || '/tmp/forge';
      await fs.mkdir(tempDir, { recursive: true });
      await fs.access(tempDir, fs.constants.W_OK);
      checks.permissions.status = "ok";
      checks.permissions.details = { writableDir: tempDir };
    } catch (error) {
      checks.permissions.status = "error";
      checks.permissions.details = { error: "Cannot write to temp directory" };
    }

    // Check Forge configuration
    try {
      const configPath = path.join(forgePath, 'res', 'preferences.properties');
      await fs.access(configPath, fs.constants.R_OK);
      const configContent = await fs.readFile(configPath, 'utf8');
      checks.config.status = "ok";
      checks.config.details = {
        configFile: configPath,
        hasApiMode: configContent.includes('apiMode'),
        hasHeadlessMode: configContent.includes('headless')
      };
    } catch (error) {
      checks.config.status = "warning";
      checks.config.details = {
        error: "Config file not found or not readable",
        suggestion: "Will create default configuration"
      };
    }

    // Overall status
    const hasErrors = Object.values(checks).some(check => check.status === "error");
    const hasWarnings = Object.values(checks).some(check => check.status === "warning");
    
    let overallStatus = "ok";
    if (hasErrors) overallStatus = "error";
    else if (hasWarnings) overallStatus = "warning";

    return Response.json({
      success: true,
      status: overallStatus,
      checks,
      recommendations: generateRecommendations(checks),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: "Environment check failed",
      details: error.message
    }, { status: 500 });
  }
}

async function setupForgeEnvironment(config) {
  const setupLog = [];
  
  try {
    setupLog.push("Starting Forge environment setup...");

    // Create necessary directories
    const forgePath = config.forgePath || process.env.FORGE_PATH || '/opt/forge';
    const tempDir = config.tempDir || process.env.FORGE_TEMP_DIR || '/tmp/forge';
    
    setupLog.push(`Creating directories: ${forgePath}, ${tempDir}`);
    await fs.mkdir(forgePath, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(forgePath, 'res'), { recursive: true });
    await fs.mkdir(path.join(forgePath, 'decks'), { recursive: true });
    await fs.mkdir(path.join(forgePath, 'logs'), { recursive: true });

    // Create Forge configuration
    const configPath = path.join(forgePath, 'res', 'preferences.properties');
    const forgeConfig = generateForgeConfig(config);
    
    setupLog.push(`Writing Forge configuration to ${configPath}`);
    await fs.writeFile(configPath, forgeConfig);

    // Download Forge if not present
    const forgeJar = path.join(forgePath, 'forge-gui-desktop.jar');
    try {
      await fs.access(forgeJar);
      setupLog.push("Forge JAR already exists");
    } catch {
      setupLog.push("Forge JAR not found, will need to download");
      // Note: Actual download would happen in downloadForge function
    }

    // Create default deck configurations
    setupLog.push("Setting up default decks...");
    await createDefaultDecks(forgePath);

    // Create startup script
    const startupScript = generateStartupScript(forgePath, config);
    const scriptPath = path.join(forgePath, 'start-forge.sh');
    await fs.writeFile(scriptPath, startupScript);
    await fs.chmod(scriptPath, '755');
    setupLog.push(`Created startup script: ${scriptPath}`);

    // Test basic functionality
    setupLog.push("Testing environment...");
    const testResult = await testBasicFunctionality(forgePath);
    
    if (testResult.success) {
      setupLog.push("Environment setup completed successfully");
    } else {
      setupLog.push(`Environment test failed: ${testResult.error}`);
    }

    return Response.json({
      success: testResult.success,
      forgePath,
      setupLog,
      config: {
        forgePath,
        tempDir,
        configPath,
        scriptPath
      },
      nextSteps: testResult.success ? [
        "Download Forge JAR if not present",
        "Test launch with sample game",
        "Configure additional decks if needed"
      ] : [
        "Fix environment issues",
        "Check permissions and dependencies",
        "Re-run setup"
      ]
    });

  } catch (error) {
    setupLog.push(`Setup failed: ${error.message}`);
    return Response.json({
      success: false,
      error: "Environment setup failed",
      setupLog,
      details: error.message
    }, { status: 500 });
  }
}

function generateForgeConfig(config) {
  return `# Forge Configuration for ManaMind Training
# Generated on ${new Date().toISOString()}

# API and Headless Mode
apiMode=true
headlessMode=true
enableLogging=true
logLevel=${config.logLevel || 'INFO'}

# Game Settings
defaultGameMode=${config.defaultGameMode || 'Constructed'}
defaultFormat=${config.defaultFormat || 'Standard'}
enableAI=true
defaultAIDifficulty=${config.defaultAIDifficulty || 'MEDIUM'}

# Performance Settings
maxMemory=${config.maxMemory || '2G'}
gcTimeRatio=${config.gcTimeRatio || '4'}
enableParallelGC=true

# Neural Network Integration
enableNeuralMode=true
neuralResponseTimeout=${config.neuralTimeout || '30000'}
enableStateLogging=true

# Deck Management
enableCustomDecks=true
deckValidation=true
autoLoadDecks=true

# Network Settings
enableNetworkPlay=false
apiPort=${config.apiPort || '17171'}
bindAddress=${config.bindAddress || 'localhost'}

# Debug Settings
debugMode=${config.debugMode || 'false'}
verboseLogging=${config.verboseLogging || 'false'}
saveGameStates=true
`;
}

function generateStartupScript(forgePath, config) {
  return `#!/bin/bash
# Forge Startup Script for ManaMind Training
# Generated on ${new Date().toISOString()}

FORGE_PATH="${forgePath}"
JAVA_PATH="${config.javaPath || 'java'}"
MEMORY="${config.memory || '2G'}"
LOG_DIR="${forgePath}/logs"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Set Java options
JAVA_OPTS="-Xmx$MEMORY -Xms512m"
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
JAVA_OPTS="$JAVA_OPTS -XX:MaxGCPauseMillis=200"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
JAVA_OPTS="$JAVA_OPTS -Dforge.log.dir=$LOG_DIR"

# Launch Forge with arguments
exec "$JAVA_PATH" $JAVA_OPTS \\
  -jar "$FORGE_PATH/forge-gui-desktop.jar" \\
  --headless \\
  --api-mode \\
  --config-dir="$FORGE_PATH/res" \\
  --log-dir="$LOG_DIR" \\
  "$@"
`;
}

async function createDefaultDecks(forgePath) {
  const decksDir = path.join(forgePath, 'decks');
  
  const defaultDecks = {
    'Default_Aggro.dck': generateDeckFile('aggro'),
    'Default_Control.dck': generateDeckFile('control'),
    'Default_Midrange.dck': generateDeckFile('midrange'),
    'Default_Combo.dck': generateDeckFile('combo')
  };

  for (const [filename, content] of Object.entries(defaultDecks)) {
    const deckPath = path.join(decksDir, filename);
    await fs.writeFile(deckPath, content);
  }
}

function generateDeckFile(archetype) {
  const deckTemplates = {
    aggro: `[duel]
[metadata]
Name=Default Aggro
Description=Fast aggressive deck for training
Archetype=Aggro

[main]
4 Lightning Bolt
4 Goblin Guide
4 Monastery Swiftspear
4 Lava Spike
20 Mountain
4 Rift Bolt
4 Chain Lightning
4 Skullcrack
4 Searing Spear
4 Keldon Marauders
4 Ball Lightning

[sideboard]
4 Smash to Smithereens
4 Searing Blood
4 Skullcrack
3 Searing Blaze
`,

    control: `[duel]
[metadata]
Name=Default Control
Description=Control deck with counters and removal
Archetype=Control

[main]
4 Counterspell
4 Wrath of God
4 Fact or Fiction
2 Elspeth, Knight-Errant
10 Island
8 Plains
4 Flooded Strand
4 Day of Judgment
4 Mana Leak
4 Cancel
4 Divination
4 Condemn
4 Baneslayer Angel

[sideboard]
4 Negate
4 Disenchant
4 Circle of Protection: Red
3 Elixir of Immortality
`,

    midrange: `[duel]
[metadata]
Name=Default Midrange
Description=Efficient creatures and spells
Archetype=Midrange

[main]
4 Tarmogoyf
4 Dark Confidant
4 Lightning Bolt
3 Liliana of the Veil
4 Bloodbraid Elf
9 Forest
7 Mountain
4 Grove of the Burnwillows
4 Raging Ravine
4 Maelstrom Pulse
4 Kitchen Finks
4 Huntmaster of the Fells
4 Inquisition of Kozilek

[sideboard]
3 Ancient Grudge
4 Fulminator Mage
4 Obstinate Baloth
4 Grim Lavamancer
`,

    combo: `[duel]
[metadata]
Name=Default Combo
Description=Combo deck for complex interactions
Archetype=Combo

[main]
4 Splinter Twin
4 Deceiver Exarch
4 Pestermite
4 Snapcaster Mage
4 Remand
4 Spell Snare
10 Island
6 Mountain
4 Scalding Tarn
4 Steam Vents
4 Lightning Bolt
4 Serum Visions
4 Gitaxian Probe

[sideboard]
3 Blood Moon
4 Pyroclasm
4 Dispel
4 Negate
`
  };

  return deckTemplates[archetype] || deckTemplates.aggro;
}

async function testBasicFunctionality(forgePath) {
  try {
    // Test file access
    await fs.access(forgePath, fs.constants.R_OK | fs.constants.W_OK);
    
    // Test configuration
    const configPath = path.join(forgePath, 'res', 'preferences.properties');
    await fs.access(configPath, fs.constants.R_OK);
    
    // Test deck access
    const decksDir = path.join(forgePath, 'decks');
    const deckFiles = await fs.readdir(decksDir);
    
    if (deckFiles.length === 0) {
      return { success: false, error: "No deck files found" };
    }

    return { 
      success: true, 
      details: {
        configFile: configPath,
        deckCount: deckFiles.length,
        deckFiles
      }
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function configureForgeDecks(config) {
  try {
    const forgePath = config.forgePath || process.env.FORGE_PATH || '/opt/forge';
    const decksDir = path.join(forgePath, 'decks');
    
    // Ensure decks directory exists
    await fs.mkdir(decksDir, { recursive: true });
    
    const configuredDecks = [];
    
    if (config.decks && Array.isArray(config.decks)) {
      for (const deck of config.decks) {
        const deckFile = path.join(decksDir, `${deck.name}.dck`);
        const deckContent = generateCustomDeck(deck);
        
        await fs.writeFile(deckFile, deckContent);
        configuredDecks.push({
          name: deck.name,
          file: deckFile,
          archetype: deck.archetype
        });
      }
    }

    // List all available decks
    const allDeckFiles = await fs.readdir(decksDir);
    const availableDecks = allDeckFiles
      .filter(file => file.endsWith('.dck'))
      .map(file => file.replace('.dck', ''));

    return Response.json({
      success: true,
      configuredDecks,
      availableDecks,
      decksPath: decksDir
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: "Deck configuration failed",
      details: error.message
    }, { status: 500 });
  }
}

function generateCustomDeck(deckConfig) {
  const { name, description, archetype, cards, sideboard = [] } = deckConfig;
  
  let deckContent = `[duel]
[metadata]
Name=${name}
Description=${description || 'Custom deck for training'}
Archetype=${archetype || 'Custom'}

[main]
`;

  // Add main deck cards
  if (cards && Array.isArray(cards)) {
    for (const card of cards) {
      deckContent += `${card.count || 1} ${card.name}\n`;
    }
  }

  // Add sideboard
  if (sideboard.length > 0) {
    deckContent += `\n[sideboard]\n`;
    for (const card of sideboard) {
      deckContent += `${card.count || 1} ${card.name}\n`;
    }
  }

  return deckContent;
}

async function testForgeLaunch(config) {
  try {
    // Test launching Forge with minimal configuration
    const testConfig = {
      memory: '1G',
      aiDifficulty: 'EASY',
      gameMode: 'Constructed',
      format: 'Standard',
      testMode: true
    };

    const launchResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/forge/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'launch_forge',
        config: testConfig
      })
    });

    const result = await launchResponse.json();

    if (result.success) {
      // Wait a moment then shutdown the test instance
      setTimeout(async () => {
        try {
          await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/forge/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'shutdown_forge',
              gameId: result.gameId
            })
          });
        } catch (error) {
          console.error('Error shutting down test instance:', error);
        }
      }, 5000);
    }

    return Response.json({
      success: result.success,
      testGameId: result.gameId,
      processId: result.processId,
      message: result.success ? 'Forge test launch successful' : 'Forge test launch failed',
      error: result.error
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Test launch failed',
      details: error.message
    }, { status: 500 });
  }
}

async function downloadForge(config) {
  try {
    const forgeUrl = config.forgeUrl || 'https://releases.cardforge.org/forge/forge-gui-desktop/1.6.60/forge-gui-desktop-1.6.60.jar';
    const forgePath = config.forgePath || process.env.FORGE_PATH || '/opt/forge';
    const forgeJar = path.join(forgePath, 'forge-gui-desktop.jar');

    // Ensure directory exists
    await fs.mkdir(forgePath, { recursive: true });

    return Response.json({
      success: false,
      message: 'Manual download required',
      instructions: [
        `Download Forge from: ${forgeUrl}`,
        `Place the JAR file at: ${forgeJar}`,
        `Ensure the file is executable`,
        `Run setup again after download`
      ],
      forgeUrl,
      targetPath: forgeJar
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Download setup failed',
      details: error.message
    }, { status: 500 });
  }
}

async function updateForgeConfig(config) {
  try {
    const forgePath = config.forgePath || process.env.FORGE_PATH || '/opt/forge';
    const configPath = path.join(forgePath, 'res', 'preferences.properties');
    
    // Generate new configuration
    const newConfig = generateForgeConfig(config);
    
    // Backup existing config if it exists
    try {
      await fs.access(configPath);
      const backup = `${configPath}.backup.${Date.now()}`;
      await fs.copyFile(configPath, backup);
    } catch {
      // No existing config to backup
    }
    
    // Write new configuration
    await fs.writeFile(configPath, newConfig);
    
    return Response.json({
      success: true,
      configPath,
      message: 'Forge configuration updated successfully'
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Configuration update failed',
      details: error.message
    }, { status: 500 });
  }
}

function generateRecommendations(checks) {
  const recommendations = [];
  
  if (checks.java.status === 'error') {
    recommendations.push({
      priority: 'high',
      action: 'Install Java',
      description: 'Java Runtime Environment is required to run Forge',
      command: 'sudo apt-get install openjdk-17-jre'
    });
  }
  
  if (checks.forge.status === 'error') {
    recommendations.push({
      priority: 'high',
      action: 'Download Forge',
      description: 'Download and install Forge JAR file',
      url: 'https://releases.cardforge.org/forge/'
    });
  }
  
  if (checks.memory.status === 'warning') {
    recommendations.push({
      priority: 'medium',
      action: 'Increase Available Memory',
      description: 'Close other applications or add more RAM for better performance'
    });
  }
  
  if (checks.permissions.status === 'error') {
    recommendations.push({
      priority: 'high',
      action: 'Fix File Permissions',
      description: 'Ensure write access to Forge directories',
      command: 'sudo chown -R $USER:$USER /opt/forge'
    });
  }
  
  return recommendations;
}