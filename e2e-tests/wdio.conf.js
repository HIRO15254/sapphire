const { spawn } = require("child_process");
const path = require("node:path");

exports.config = {
  hostname: "127.0.0.1",
  port: 4444,
  specs: ["./test/specs/**/*.js"],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      "tauri:options": {
        application: "../src-tauri/target/debug/sapphire",
        env: {
          TAURI_TEST_MODE: "1",
          TAURI_TEST_ID: `e2e_${Date.now()}`
        }
      },
    },
  ],
  logLevel: 'warn',
  reporters: ["spec"],
  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },

  onPrepare: () => {
    console.log("Building Rust project...");
    return new Promise((resolve, reject) => {
      const buildProcess = spawn("bun", ["tauri", "build", "--debug", "--no-bundle"], {
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          TAURI_TEST_MODE: "1",
          TAURI_TEST_ID: `e2e_${Date.now()}`
        }
      });

      buildProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Rust project built successfully");
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  },

  beforeSession: () => {
    console.log("Starting tauri-driver...");

    // Determine native driver based on platform
    const isWindows = process.platform === "win32";
    const isCI = process.env.CI === "true";

    let nativeDriverArgs = ["--port", "4444"];

    if (isWindows) {
      // Windows: Use msedgedriver
      const driverPath = isCI
        ? process.env.WEBDRIVER_EDGE_DRIVER || "msedgedriver.exe"
        : "C:\\edgedriver_win64\\msedgedriver.exe";
      nativeDriverArgs.push("--native-driver", driverPath);
    } else {
      // Linux: Use webkit2gtk-driver
      const driverPath = isCI
        ? process.env.WEBDRIVER_WEBKIT_DRIVER || "WebKitWebDriver"
        : "WebKitWebDriver";
      nativeDriverArgs.push("--native-driver", driverPath);
    }

    global.tauriDriver = spawn("tauri-driver", nativeDriverArgs, {
      stdio: "inherit",
      env: {
        ...process.env,
        DISPLAY: process.env.DISPLAY || ":99" // For headless CI
      }
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("tauri-driver started");
        resolve();
      }, 3000);
    });
  },

  afterSession: async (config, capabilities, specs) => {
    console.log("Stopping tauri-driver...");
    if (global.tauriDriver) {
      global.tauriDriver.kill();
    }

    // Cleanup test database for this specific test session
    const testId = capabilities['tauri:options']?.env?.TAURI_TEST_ID;
    if (testId) {
      try {
        console.log(`Cleaning up test database for session ${testId}...`);
        const { cleanupTestDatabases } = require('./cleanup-test-db.js');
        await cleanupTestDatabases();
        console.log(`Test database cleanup for session ${testId} completed`);
      } catch (error) {
        console.warn(`Failed to cleanup test database for session ${testId}:`, error.message);
      }
    }

    console.log("E2E test session completed");
  },
};

function closeTauriDriver() {
  exit = true;
  tauriDriver?.kill();
}

function onShutdown(fn) {
  const cleanup = () => {
    try {
      fn();
    } finally {
      process.exit();
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGHUP", cleanup);
  process.on("SIGBREAK", cleanup);
}

onShutdown(() => {
  closeTauriDriver();
});
