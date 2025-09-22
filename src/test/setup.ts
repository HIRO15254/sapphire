import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock timezone and locale for consistent date formatting in tests
process.env.TZ = "Asia/Tokyo";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Intl.DateTimeFormat to ensure consistent locale
const originalDateTimeFormat = Intl.DateTimeFormat;
vi.stubGlobal("Intl", {
  ...Intl,
  DateTimeFormat: vi.fn().mockImplementation((_locale, options) => {
    return new originalDateTimeFormat("ja-JP", options);
  }),
});

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

// Mock window.location for React Router
Object.defineProperty(window, "location", {
  writable: true,
  value: {
    href: "http://localhost:3000/",
    origin: "http://localhost:3000",
    protocol: "http:",
    host: "localhost:3000",
    hostname: "localhost",
    port: "3000",
    pathname: "/",
    search: "",
    hash: "",
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

// Mock document.title
Object.defineProperty(document, "title", {
  writable: true,
  value: "Test Title",
});
