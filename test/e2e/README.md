# E2E Tests for Sapphire

## Setup

1. Install tauri-driver:
```bash
cargo install tauri-driver --locked
```

2. On Windows, install Microsoft Edge WebDriver:
```bash
# Using msedgedriver-tool (recommended)
cargo install --git https://github.com/chippers/msedgedriver-tool
# Run to download the appropriate version
msedgedriver-tool
```

3. Install WebDriverIO dependencies:
```bash
bun install
```

## Running Tests

### Prerequisites
- Ensure the Tauri app can be built: `bun run tauri build`
- Make sure tauri-driver is installed and accessible in PATH

### Run E2E Tests
```bash
# Run E2E tests
bun run test:e2e
```

### Run All Tests
```bash
# Run unit tests + integration tests
bun run test:all
```

## Test Structure

- `wdio.conf.ts` - WebDriverIO configuration
- `test/e2e/app.spec.ts` - Main application E2E tests

## Platform Notes

- **Windows**: Uses Microsoft Edge WebDriver
- **Linux**: Uses WebKit WebDriver
- **macOS**: Desktop WebDriver not supported (use mobile testing approach)

## Troubleshooting

1. **WebDriver Connection Issues**:
   - Ensure tauri-driver is running on port 9515
   - Check that the correct WebDriver is installed for your platform

2. **App Startup Issues**:
   - Verify the app builds successfully with `bun run tauri build`
   - Check tauri.conf.json for correct configuration

3. **Element Not Found**:
   - Increase waitforTimeout in wdio.conf.ts
   - Add explicit waits for dynamic content