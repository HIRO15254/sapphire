# Tauri E2E Tests

This directory contains end-to-end tests for the Sapphire Tauri application using WebDriver.

## Setup

The E2E tests use WebdriverIO with tauri-driver to test the actual Tauri application binary.

### Prerequisites

1. **tauri-driver**: Already installed via `cargo install tauri-driver`
2. **Built application**: The release build must exist at `../src-tauri/target/release/sapphire.exe`

### Dependencies

- @wdio/cli - WebdriverIO command line interface
- @wdio/local-runner - Local test runner
- @wdio/mocha-framework - Mocha test framework integration
- @wdio/spec-reporter - Spec reporter for test output

## Running Tests

### From project root:
```bash
npm run test:e2e
```

### From e2e-tests directory:
```bash
npm test
```

## Test Structure

- `wdio.conf.js` - WebdriverIO configuration
- `specs/app.e2e.js` - Main application tests

## How it Works

1. **tauri-driver** starts as a WebDriver server
2. **WebdriverIO** connects to tauri-driver
3. **tauri-driver** launches the actual Tauri application binary
4. Tests interact with the real application through WebDriver protocol
5. Tests can access both frontend and backend functionality through the Tauri IPC bridge

## Test Coverage

- Main application title and navigation
- Tab switching between Users and Notes
- User creation, display, and deletion
- Note creation with user association
- Form validation
- Data persistence

## Platform Support

- ✅ Windows (current platform)
- ✅ Linux
- ❌ macOS (not supported by tauri-driver)

## Troubleshooting

If tests fail:
1. Ensure the application builds successfully: `npm run build`
2. Verify tauri-driver is installed: `tauri-driver --version`
3. Check that the binary path in wdio.conf.js is correct
4. Ensure no other instances of the app are running