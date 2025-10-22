import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Set up environment variables for tests
// Use existing DATABASE_URL from environment if available (for CI), otherwise use test database
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sapphire_test";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-key-for-testing-only";
process.env.AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID ?? "test-google-id";
process.env.AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET ?? "test-google-secret";
process.env.AUTH_GITHUB_ID = process.env.AUTH_GITHUB_ID ?? "test-github-id";
process.env.AUTH_GITHUB_SECRET = process.env.AUTH_GITHUB_SECRET ?? "test-github-secret";
process.env.SKIP_ENV_VALIDATION = "true"; // Skip validation in tests

// Mock window.matchMedia for Mantine and responsive tests
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

// Mock window.ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});
