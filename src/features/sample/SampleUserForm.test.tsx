import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { render, screen } from "../../test/helpers/renderWithProviders";
import { SampleUserForm } from "./SampleUserForm";

const mockInvoke = vi.mocked(invoke);

describe("SampleUserForm Component", () => {
  const mockOnUserSaved = vi.fn();
  const mockOnCancel = vi.fn();

  const sampleUser = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    created_at: "2024-01-01",
  };

  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockReset();
    mockOnUserSaved.mockClear();
    mockOnCancel.mockClear();
  });

  test("renders create form correctly", () => {
    render(<SampleUserForm onUserSaved={mockOnUserSaved} />);

    expect(screen.getByText("Add New Sample User")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Sample User" })).toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  test("renders edit form correctly", () => {
    render(
      <SampleUserForm user={sampleUser} onUserSaved={mockOnUserSaved} onCancel={mockOnCancel} />
    );

    expect(screen.getByText("Edit Sample User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Sample User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  test("allows user to type in input fields in create mode", async () => {
    const user = userEvent.setup();
    render(<SampleUserForm onUserSaved={mockOnUserSaved} />);

    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");

    await user.type(nameInput, "Jane Smith");
    await user.type(emailInput, "jane@example.com");

    expect(nameInput).toHaveValue("Jane Smith");
    expect(emailInput).toHaveValue("jane@example.com");
  });

  test("shows validation error for empty name", async () => {
    const user = userEvent.setup();
    render(<SampleUserForm onUserSaved={mockOnUserSaved} />);

    const emailInput = screen.getByPlaceholderText("Email");
    const submitButton = screen.getByRole("button", { name: "Add Sample User" });

    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<SampleUserForm onUserSaved={mockOnUserSaved} />);

    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");
    const submitButton = screen.getByRole("button", { name: "Add Sample User" });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test("creates user successfully and resets form", async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValue(null);

    render(<SampleUserForm onUserSaved={mockOnUserSaved} />);

    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");
    const submitButton = screen.getByRole("button", { name: "Add Sample User" });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_user", {
        user: { name: "John Doe", email: "john@example.com" },
      });
    });

    expect(mockOnUserSaved).toHaveBeenCalledTimes(1);

    // Form should be reset
    await waitFor(() => {
      expect(nameInput).toHaveValue("");
      expect(emailInput).toHaveValue("");
    });
  });

  test("updates user successfully", async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValue(null);

    render(<SampleUserForm user={sampleUser} onUserSaved={mockOnUserSaved} />);

    const nameInput = screen.getByDisplayValue("John Doe");
    const submitButton = screen.getByRole("button", { name: "Update Sample User" });

    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("update_user", {
        id: 1,
        user: { name: "Jane Smith", email: "john@example.com" },
      });
    });

    expect(mockOnUserSaved).toHaveBeenCalledTimes(1);
  });

  test("calls cancel callback when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SampleUserForm user={sampleUser} onUserSaved={mockOnUserSaved} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test("handles creation error gracefully", async () => {
    const user = userEvent.setup();
    const errorMessage = "Database error";
    mockInvoke.mockRejectedValue(errorMessage);

    render(<SampleUserForm onUserSaved={mockOnUserSaved} />);

    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");
    const submitButton = screen.getByRole("button", { name: "Add Sample User" });

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create_user", {
        user: { name: "John Doe", email: "john@example.com" },
      });
    });

    // onUserSaved should not be called on error
    expect(mockOnUserSaved).not.toHaveBeenCalled();

    // Form should not be reset on error
    expect(nameInput).toHaveValue("John Doe");
    expect(emailInput).toHaveValue("john@example.com");
  });

  test("handles update error gracefully", async () => {
    const user = userEvent.setup();
    const errorMessage = "Update failed";
    mockInvoke.mockRejectedValue(errorMessage);

    render(<SampleUserForm user={sampleUser} onUserSaved={mockOnUserSaved} />);

    const submitButton = screen.getByRole("button", { name: "Update Sample User" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("update_user", {
        id: 1,
        user: { name: "John Doe", email: "john@example.com" },
      });
    });

    // onUserSaved should not be called on error
    expect(mockOnUserSaved).not.toHaveBeenCalled();
  });
});
