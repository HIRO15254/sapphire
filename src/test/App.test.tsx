import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { invoke } from "@tauri-apps/api/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// Get the mocked function
const mockInvoke = vi.mocked(invoke);

// Wrapper component for Mantine provider with notifications
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <Notifications />
    {children}
  </MantineProvider>
);

describe("App Component", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockReset();
    // Mock the database calls that happen on mount
    mockInvoke.mockImplementation((command: string) => {
      if (command === "get_users") {
        return Promise.resolve([]);
      }
      if (command === "get_notes") {
        return Promise.resolve([]);
      }
      if (command === "greet") {
        return Promise.resolve("Hello, Test! You've been greeted from Rust!");
      }
      return Promise.resolve(null);
    });
  });

  test("renders sapphire title", async () => {
    render(<App />, { wrapper: Wrapper });
    expect(screen.getByText("Sapphire - SQLite Database Demo")).toBeInTheDocument();
  });

  test("renders tabs for navigation", async () => {
    render(<App />, { wrapper: Wrapper });

    expect(screen.getByText("Original Demo")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  test("loads users and notes on mount", async () => {
    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_users");
      expect(mockInvoke).toHaveBeenCalledWith("get_notes");
    });
  });

  test("renders name input and greet button in demo tab", async () => {
    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter a name...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Greet" })).toBeInTheDocument();
    });
  });

  test("updates input value when typing", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter a name...")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Enter a name...");
    await user.type(input, "John");

    expect(input).toHaveValue("John");
  });

  test("calls greet command when form is submitted", async () => {
    const user = userEvent.setup();
    const expectedGreeting = "Hello, John! You've been greeted from Rust!";

    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter a name...")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Enter a name...");
    const button = screen.getByRole("button", { name: "Greet" });

    await user.type(input, "John");

    // Clear previous calls and set up specific mock for greet
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue(expectedGreeting);

    await user.click(button);

    // Verify the Tauri command was called correctly
    expect(mockInvoke).toHaveBeenCalledWith("greet", { name: "John" });

    // Wait for the greeting message to appear
    await waitFor(
      () => {
        expect(screen.getByText(expectedGreeting)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("displays user management interface in users tab", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Users")).toBeInTheDocument();
    });

    const usersTab = screen.getByText("Users");
    await user.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText("Add New User")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    });
  });

  test("displays notes management interface in notes tab", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Notes")).toBeInTheDocument();
    });

    const notesTab = screen.getByText("Notes");
    await user.click(notesTab);

    await waitFor(() => {
      expect(screen.getByText("Add New Note")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Note title")).toBeInTheDocument();
    });
  });
});
