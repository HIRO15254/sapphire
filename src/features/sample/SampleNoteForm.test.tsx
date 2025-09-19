import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "../../test/helpers/renderWithProviders";
import { SampleNoteForm } from "./SampleNoteForm";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import type { SampleUser } from "./types";

const mockInvoke = vi.mocked(invoke);

describe("SampleNoteForm Component", () => {
  const mockOnNoteSaved = vi.fn();
  const mockOnCancel = vi.fn();

  const sampleUsers: SampleUser[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      created_at: "2024-01-01",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      created_at: "2024-01-02",
    },
  ];

  const sampleNote = {
    id: 1,
    title: "Test Note",
    content: "Test content",
    user_id: 1,
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      created_at: "2024-01-01",
    },
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };

  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockReset();
    mockOnNoteSaved.mockClear();
    mockOnCancel.mockClear();
  });

  test("renders create form correctly", () => {
    render(<SampleNoteForm users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    expect(screen.getByText("Add New Sample Note")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Note title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Note content (optional)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select User")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Sample Note" })).toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  test("renders edit form correctly", () => {
    render(
      <SampleNoteForm
        note={sampleNote}
        users={sampleUsers}
        onNoteSaved={mockOnNoteSaved}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Edit Sample Note")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test content")).toBeInTheDocument();
    // Should show the user's name in the select field
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Sample Note" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  test("allows user to type in input fields in create mode", async () => {
    const user = userEvent.setup();
    render(<SampleNoteForm users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const titleInput = screen.getByPlaceholderText("Note title");
    const contentInput = screen.getByPlaceholderText("Note content (optional)");

    await user.type(titleInput, "My New Note");
    await user.type(contentInput, "Some content here");

    expect(titleInput).toHaveValue("My New Note");
    expect(contentInput).toHaveValue("Some content here");
  });

  test("allows user to select from user dropdown", async () => {
    const user = userEvent.setup();
    render(<SampleNoteForm users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const userSelect = screen.getByPlaceholderText("Select User");
    await user.click(userSelect);

    // Should show user options
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  test("shows validation error for empty title", async () => {
    const user = userEvent.setup();
    render(<SampleNoteForm users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const submitButton = screen.getByRole("button", { name: "Add Sample Note" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test("shows validation error when no user is selected", async () => {
    const user = userEvent.setup();
    render(<SampleNoteForm users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const titleInput = screen.getByPlaceholderText("Note title");
    const submitButton = screen.getByRole("button", { name: "Add Sample Note" });

    await user.type(titleInput, "Test Title");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Please select a user")).toBeInTheDocument();
    });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test("creates note successfully and resets form", async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValue(null);

    render(<SampleNoteForm users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const titleInput = screen.getByPlaceholderText("Note title");
    const contentInput = screen.getByPlaceholderText("Note content (optional)");
    const userSelect = screen.getByPlaceholderText("Select User");
    const submitButton = screen.getByRole("button", { name: "Add Sample Note" });

    await user.type(titleInput, "My Note");
    await user.type(contentInput, "Note content");
    await user.click(userSelect);
    await user.click(screen.getByText("John Doe"));
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_note", {
        note: {
          title: "My Note",
          content: "Note content",
          user_id: 1,
        },
      });
    });

    expect(mockOnNoteSaved).toHaveBeenCalledTimes(1);

    // Form should be reset
    await waitFor(() => {
      expect(titleInput).toHaveValue("");
      expect(contentInput).toHaveValue("");
    });
  });

  test("updates note successfully", async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValue(null);

    render(<SampleNoteForm note={sampleNote} users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const titleInput = screen.getByDisplayValue("Test Note");
    const submitButton = screen.getByRole("button", { name: "Update Sample Note" });

    await user.clear(titleInput);
    await user.type(titleInput, "Updated Note");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("update_note", {
        id: 1,
        note: {
          title: "Updated Note",
          content: "Test content",
          user_id: 1,
        },
      });
    });

    expect(mockOnNoteSaved).toHaveBeenCalledTimes(1);
  });

  test("calls cancel callback when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SampleNoteForm
        note={sampleNote}
        users={sampleUsers}
        onNoteSaved={mockOnNoteSaved}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test("handles creation error gracefully", async () => {
    const user = userEvent.setup();
    const errorMessage = "Database error";
    mockInvoke.mockRejectedValue(errorMessage);

    render(<SampleNoteForm users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const titleInput = screen.getByPlaceholderText("Note title");
    const userSelect = screen.getByPlaceholderText("Select User");
    const submitButton = screen.getByRole("button", { name: "Add Sample Note" });

    await user.type(titleInput, "Test Note");
    await user.click(userSelect);
    await user.click(screen.getByText("John Doe"));
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_note", {
        note: {
          title: "Test Note",
          content: "",
          user_id: 1,
        },
      });
    });

    // onNoteSaved should not be called on error
    expect(mockOnNoteSaved).not.toHaveBeenCalled();

    // Form should not be reset on error
    expect(titleInput).toHaveValue("Test Note");
  });

  test("handles update error gracefully", async () => {
    const user = userEvent.setup();
    const errorMessage = "Update failed";
    mockInvoke.mockRejectedValue(errorMessage);

    render(<SampleNoteForm note={sampleNote} users={sampleUsers} onNoteSaved={mockOnNoteSaved} />);

    const submitButton = screen.getByRole("button", { name: "Update Sample Note" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("update_note", {
        id: 1,
        note: {
          title: "Test Note",
          content: "Test content",
          user_id: 1,
        },
      });
    });

    // onNoteSaved should not be called on error
    expect(mockOnNoteSaved).not.toHaveBeenCalled();
  });

  test("handles empty users list gracefully", () => {
    render(<SampleNoteForm users={[]} onNoteSaved={mockOnNoteSaved} />);

    expect(screen.getByText("Add New Sample Note")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select User")).toBeInTheDocument();
    // Should still render but with no user options
  });
});
