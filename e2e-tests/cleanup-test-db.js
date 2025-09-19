const { spawn } = require("child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

/**
 * Cleanup test databases by removing old test database files
 * This script can be run periodically or after E2E tests
 */
async function cleanupTestDatabases() {
  try {
    console.log("Starting test database cleanup...");

    // Get the app data directory path (platform-specific)
    let appDataDir;
    const platform = os.platform();
    const appName = "com.sapphire.dev"; // Based on your Tauri app identifier

    if (platform === "win32") {
      appDataDir = path.join(os.homedir(), "AppData", "Roaming", appName);
    } else if (platform === "darwin") {
      appDataDir = path.join(os.homedir(), "Library", "Application Support", appName);
    } else {
      appDataDir = path.join(os.homedir(), ".local", "share", appName);
    }

    const testDbDir = path.join(appDataDir, "test_databases");

    if (!fs.existsSync(testDbDir)) {
      console.log("No test database directory found. Nothing to clean up.");
      return;
    }

    const files = fs.readdirSync(testDbDir);
    const testDbFiles = files.filter(file =>
      file.startsWith("sapphire_test_") && file.endsWith(".db")
    );

    if (testDbFiles.length === 0) {
      console.log("No test database files found to clean up.");
      return;
    }

    console.log(`Found ${testDbFiles.length} test database files to clean up:`);

    for (const file of testDbFiles) {
      const filePath = path.join(testDbDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`  ✓ Removed: ${file}`);
      } catch (error) {
        console.error(`  ✗ Failed to remove ${file}: ${error.message}`);
      }
    }

    console.log("Test database cleanup completed.");

  } catch (error) {
    console.error("Error during test database cleanup:", error.message);
    process.exit(1);
  }
}

// Run cleanup if this script is called directly
if (require.main === module) {
  cleanupTestDatabases();
}

module.exports = { cleanupTestDatabases };