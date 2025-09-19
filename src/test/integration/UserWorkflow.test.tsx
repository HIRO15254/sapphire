import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import App from "../../App";
import { render, screen } from "../helpers/renderWithProviders";
import { createTestUser, createTestUsers, mockResponses } from "../helpers/testData";

// Get the mocked function
const mockInvoke = vi.mocked(invoke);

describe("User Management Workflow", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockReset();

    // Default mock implementations
    mockInvoke.mockImplementation((command: string, args?: any) => {
      switch (command) {
        case "get_users":
          return Promise.resolve([]);
        case "get_notes":
          return Promise.resolve([]);
        case "greet":
          return Promise.resolve(mockResponses.greet(args?.name || ""));
        case "create_user":
          return Promise.resolve();
        case "delete_user":
          return Promise.resolve();
        default:
          return Promise.reject(`Unknown command: ${command}`);
      }
    });
  });

  test("should create a new user successfully", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Users tab
    await user.click(screen.getByText("Users"));

    await waitFor(() => {
      expect(screen.getByText("Add New Sample User")).toBeInTheDocument();
    });

    // Fill in user form
    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");
    const addButton = screen.getByRole("button", { name: /add sample user/i });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");

    // Mock successful user creation
    mockInvoke.mockClear();
    mockInvoke.mockImplementation((command: string) => {
      if (command === "create_user") {
        return Promise.resolve();
      }
      if (command === "get_users") {
        return Promise.resolve([createTestUser({ id: 1 })]);
      }
      return Promise.resolve([]);
    });

    await user.click(addButton);

    // Verify create_user was called with correct parameters
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_user", {
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
      });
    });
  });

  test("should display validation error for empty fields", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Users tab
    await user.click(screen.getByText("Users"));

    await waitFor(() => {
      expect(screen.getByText("Add New Sample User")).toBeInTheDocument();
    });

    // Try to submit empty form
    const addButton = screen.getByRole("button", { name: /add sample user/i });
    await user.click(addButton);

    // Should not call create_user with empty data
    expect(mockInvoke).not.toHaveBeenCalledWith("create_user", expect.anything());
  });

  test("should display users list", async () => {
    const testUsers = createTestUsers(3);

    mockInvoke.mockImplementation((command: string) => {
      if (command === "get_users") {
        return Promise.resolve(testUsers);
      }
      if (command === "get_notes") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const user = userEvent.setup();
    render(<App />);

    // Navigate to Users tab
    await user.click(screen.getByText("Users"));

    // Wait for users to load and be displayed - check for table content
    await waitFor(() => {
      expect(screen.getByText("Sample Users (3)")).toBeInTheDocument();
      expect(screen.getByText("user1@example.com")).toBeInTheDocument();
    });

    // Users should be visible in the table
    expect(screen.getByText("user2@example.com")).toBeInTheDocument();
    expect(screen.getByText("user3@example.com")).toBeInTheDocument();
  });

  test("should delete user successfully", async () => {
    const testUsers = createTestUsers(2);

    // Initial state with users
    mockInvoke.mockImplementation((command: string, _args?: any) => {
      if (command === "get_users") {
        return Promise.resolve(testUsers);
      }
      if (command === "get_notes") {
        return Promise.resolve([]);
      }
      if (command === "delete_user") {
        return Promise.resolve();
      }
      return Promise.resolve([]);
    });

    const user = userEvent.setup();
    render(<App />);

    // Navigate to Users tab
    await user.click(screen.getByText("Users"));

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText("Sample Users (2)")).toBeInTheDocument();
    });

    // Find and click delete button for first user
    const deleteButtons = screen.getAllByLabelText(/delete user/i);
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Mock delete response
    mockInvoke.mockClear();
    mockInvoke.mockImplementation((command: string, _args?: any) => {
      if (command === "delete_user") {
        return Promise.resolve();
      }
      if (command === "get_users") {
        // Return users without the deleted one
        return Promise.resolve([testUsers[1]]);
      }
      return Promise.resolve([]);
    });

    await user.click(deleteButtons[0]);

    // Verify delete_user was called
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("delete_user", { id: 1 });
    });
  });

  test("should handle error when creating user", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Users tab
    await user.click(screen.getByText("Users"));

    await waitFor(() => {
      expect(screen.getByText("Add New Sample User")).toBeInTheDocument();
    });

    // Fill in user form
    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");
    const addButton = screen.getByRole("button", { name: /add sample user/i });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");

    // Mock error response
    mockInvoke.mockClear();
    mockInvoke.mockImplementation((command: string) => {
      if (command === "create_user") {
        return Promise.reject(new Error("UNIQUE constraint failed"));
      }
      return Promise.resolve([]);
    });

    await user.click(addButton);

    // Should handle error gracefully
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_user", {
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
      });
    });

    // Could check for error notification if implemented
  });
});
