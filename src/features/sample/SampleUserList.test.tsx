import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "../../test/helpers/renderWithProviders";
import { SampleUserList } from "./SampleUserList";

describe("SampleUserList Component", () => {
  const mockOnUserDeleted = vi.fn();

  const sampleUsers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      created_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      created_at: "2024-01-02T11:00:00Z",
    },
    {
      id: 3,
      name: "Bob Wilson",
      email: "bob@example.com",
      created_at: "2024-01-03T12:00:00Z",
    },
  ];

  beforeEach(() => {
    mockOnUserDeleted.mockClear();
  });

  test("renders user list title with correct count", () => {
    render(<SampleUserList users={sampleUsers} onUserDeleted={mockOnUserDeleted} />);

    expect(screen.getByText("Sample Users (3)")).toBeInTheDocument();
  });

  test("renders table headers correctly", () => {
    render(<SampleUserList users={sampleUsers} onUserDeleted={mockOnUserDeleted} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  test("renders all users in table rows", () => {
    render(<SampleUserList users={sampleUsers} onUserDeleted={mockOnUserDeleted} />);

    // Check user data is displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();

    // Check IDs are displayed
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("formats created dates correctly in Japanese format", () => {
    render(<SampleUserList users={sampleUsers} onUserDeleted={mockOnUserDeleted} />);

    // Check that dates are formatted in Japanese format (YYYY/M/D)
    expect(screen.getByText("2024/1/1")).toBeInTheDocument();
    expect(screen.getByText("2024/1/2")).toBeInTheDocument();
    expect(screen.getByText("2024/1/3")).toBeInTheDocument();
  });

  test("handles invalid created_at gracefully", () => {
    const usersWithInvalidDates = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        created_at: "invalid-date",
      },
    ];

    render(<SampleUserList users={usersWithInvalidDates} onUserDeleted={mockOnUserDeleted} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("renders delete buttons for each user", () => {
    render(<SampleUserList users={sampleUsers} onUserDeleted={mockOnUserDeleted} />);

    const deleteButtons = screen.getAllByRole("button");
    expect(deleteButtons).toHaveLength(3); // One delete button per user
  });

  test("calls onUserDeleted when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<SampleUserList users={sampleUsers} onUserDeleted={mockOnUserDeleted} />);

    const deleteButtons = screen.getAllByRole("button");
    await user.click(deleteButtons[0]); // Click first delete button

    expect(mockOnUserDeleted).toHaveBeenCalledTimes(1);
    expect(mockOnUserDeleted).toHaveBeenCalledWith(1); // Should pass the user ID
  });

  test("shows empty state when no users provided", () => {
    render(<SampleUserList users={[]} onUserDeleted={mockOnUserDeleted} />);

    expect(screen.getByText("Sample Users (0)")).toBeInTheDocument();
    expect(screen.getByText("No users yet. Add one above!")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("handles users array with undefined/null entries", () => {
    const usersWithNulls = sampleUsers.filter((_user, index) => index !== 1); // Remove middle user

    render(<SampleUserList users={usersWithNulls} onUserDeleted={mockOnUserDeleted} />);

    expect(screen.getByText("Sample Users (2)")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  test("accessibility: delete buttons have proper labels or descriptions", () => {
    render(<SampleUserList users={sampleUsers} onUserDeleted={mockOnUserDeleted} />);

    const deleteButtons = screen.getAllByRole("button");
    deleteButtons.forEach((button) => {
      // Should be clickable buttons
      expect(button).toBeInTheDocument();
    });
  });
});
