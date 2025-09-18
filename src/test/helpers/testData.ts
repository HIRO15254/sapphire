// Test data factories for consistent test data

export interface TestUser {
  id?: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface TestNote {
  id?: number;
  title: string;
  content?: string;
  user_id: number;
  user: TestUser;
  created_at?: string;
  updated_at?: string;
}

export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  name: "John Doe",
  email: "john@example.com",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestNote = (overrides: Partial<TestNote> = {}): TestNote => {
  const defaultUser = createTestUser({ id: overrides.user_id || 1 });
  return {
    title: "Test Note",
    content: "This is a test note content",
    user_id: 1,
    user: defaultUser,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
};

export const createTestUsers = (count: number): TestUser[] =>
  Array.from({ length: count }, (_, index) =>
    createTestUser({
      id: index + 1,
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
    })
  );

export const createTestNotes = (count: number, userId = 1): TestNote[] => {
  const user = createTestUser({ id: userId, name: "John Doe" });
  return Array.from({ length: count }, (_, index) =>
    createTestNote({
      id: index + 1,
      title: `Note ${index + 1}`,
      content: `Content for note ${index + 1}`,
      user_id: userId,
      user: user,
    })
  );
};

// Mock responses for Tauri commands
export const mockResponses = {
  greet: (name: string) => `Hello, ${name}! You've been greeted from Rust!`,
  getUsers: (users: TestUser[] = []) => users,
  getNotes: (notes: TestNote[] = []) => notes,
  createUser: () => undefined,
  createNote: () => undefined,
  deleteUser: () => undefined,
  deleteNote: () => undefined,
};
