import "@testing-library/jest-dom";

// Mock Tauri API
Object.defineProperty(window, "__TAURI_INTERNALS__", {
  value: {},
});

// Mock window.ipc for Tauri
Object.defineProperty(window, "__TAURI_IPC__", {
  value: {
    invoke: vi.fn(),
  },
});

// Setup global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia for Mantine
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
