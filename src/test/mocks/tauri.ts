import { vi } from 'vitest';

// Mock Tauri's invoke function
export const mockInvoke = vi.fn();

// Mock the entire @tauri-apps/api/core module
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

export function mockTauriCommand(command: string, returnValue: any) {
  mockInvoke.mockImplementation((cmd: string, args: any) => {
    if (cmd === command) {
      return Promise.resolve(returnValue);
    }
    return Promise.reject(`Unknown command: ${cmd}`);
  });
}

export function clearTauriMocks() {
  mockInvoke.mockClear();
  mockInvoke.mockReset();
}