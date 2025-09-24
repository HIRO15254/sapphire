import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import App from "../App";

// Custom render function for App tests (App has its own BrowserRouter)
const renderApp = () => {
  return render(
    <MantineProvider>
      <Notifications />
      <App />
    </MantineProvider>
  );
};

// Get the mocked function
const mockInvoke = vi.mocked(invoke);

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
      return Promise.resolve(null);
    });
  });

  test("renders sapphire title", async () => {
    renderApp();
    expect(screen.getByText("Sapphire - SQLite Database Demo")).toBeInTheDocument();
  });

  test("renders tabs for navigation", async () => {
    renderApp();

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  test("loads users and notes on mount", async () => {
    renderApp();

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_users");
      expect(mockInvoke).toHaveBeenCalledWith("get_notes");
    });
  });

  test("displays user management interface by default", async () => {
    renderApp();

    // Users tab should be active by default now
    await waitFor(() => {
      expect(screen.getByText("Add New Sample User")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    });
  });

  test("displays notes management interface in notes tab", async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByText("Notes")).toBeInTheDocument();
    });

    const notesTab = screen.getByText("Notes");
    await user.click(notesTab);

    await waitFor(() => {
      expect(screen.getByText("Add New Sample Note")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Note title")).toBeInTheDocument();
    });
  });
});
