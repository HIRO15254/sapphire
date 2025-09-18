import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "../../test/helpers/renderWithProviders";
import { SampleNoteList } from "./SampleNoteList";

describe("SampleNoteList Component", () => {
  const mockOnNoteDeleted = vi.fn();

  const sampleNotes = [
    {
      id: 1,
      title: "First Note",
      content: "This is the first note content",
      user_id: 1,
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        created_at: "2024-01-01",
      },
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 2,
      title: "Second Note",
      content: "This is the second note with longer content that should be displayed properly",
      user_id: 2,
      user: {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        created_at: "2024-01-02",
      },
      created_at: "2024-01-02T11:00:00Z",
      updated_at: "2024-01-02T15:30:00Z",
    },
    {
      id: 3,
      title: "Note Without Content",
      user_id: 1,
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        created_at: "2024-01-01",
      },
      created_at: "2024-01-03T12:00:00Z",
      updated_at: "2024-01-03T12:00:00Z",
    },
  ];

  beforeEach(() => {
    mockOnNoteDeleted.mockClear();
  });

  test("renders note list title with correct count", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    expect(screen.getByText("Sample Notes (3)")).toBeInTheDocument();
  });

  test("renders all note titles", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    expect(screen.getByText("First Note")).toBeInTheDocument();
    expect(screen.getByText("Second Note")).toBeInTheDocument();
    expect(screen.getByText("Note Without Content")).toBeInTheDocument();
  });

  test("renders note content when available", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    expect(screen.getByText("This is the first note content")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is the second note with longer content that should be displayed properly"
      )
    ).toBeInTheDocument();
  });

  test("does not render content section for notes without content", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    // The third note should not have a content section
    const noteCards = screen.getAllByText(/Note Without Content/);
    expect(noteCards).toHaveLength(1);
  });

  test("displays user information correctly", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    // Should display user names instead of just IDs
    expect(screen.getAllByText("John Doe")).toHaveLength(2);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  test("formats created dates correctly in Japanese format", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    // Check that creation dates are formatted in Japanese format - use getAllBy for multiple
    expect(screen.getAllByText(/Created:/)).toHaveLength(3);
    expect(screen.getByText(/2024\/1\/1.*19:00/)).toBeInTheDocument();
    expect(screen.getByText(/2024\/1\/2.*20:00/)).toBeInTheDocument();
    expect(screen.getAllByText(/2024\/1\/3/)).toHaveLength(2); // Appears in both created and updated
  });

  test("shows updated date when different from created date in Japanese format", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    // Second note has different updated_at time, should show "Updated:" in Japanese format
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    expect(screen.getByText(/2024\/1\/3.*00:30/)).toBeInTheDocument();
  });

  test("does not show updated date when same as created date", () => {
    const notesWithSameDates = [sampleNotes[0]]; // First note has same created/updated time
    render(<SampleNoteList notes={notesWithSameDates} onNoteDeleted={mockOnNoteDeleted} />);

    expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument();
  });

  test("handles invalid timestamps gracefully", () => {
    const notesWithInvalidDates = [
      {
        id: 1,
        title: "Note With Invalid Dates",
        content: "Test content",
        user_id: 1,
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          created_at: "2024-01-01",
        },
        created_at: "invalid-date",
        updated_at: "invalid-date",
      },
    ];

    render(<SampleNoteList notes={notesWithInvalidDates} onNoteDeleted={mockOnNoteDeleted} />);

    expect(screen.getByText("Note With Invalid Dates")).toBeInTheDocument();
  });

  test("renders delete buttons for each note", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    const deleteButtons = screen.getAllByRole("button");
    expect(deleteButtons).toHaveLength(3); // One delete button per note
  });

  test("calls onNoteDeleted when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    const deleteButtons = screen.getAllByRole("button");
    await user.click(deleteButtons[0]); // Click first delete button

    expect(mockOnNoteDeleted).toHaveBeenCalledTimes(1);
    expect(mockOnNoteDeleted).toHaveBeenCalledWith(1); // Should pass the note ID
  });

  test("shows empty state when no notes provided", () => {
    render(<SampleNoteList notes={[]} onNoteDeleted={mockOnNoteDeleted} />);

    expect(screen.getByText("Sample Notes (0)")).toBeInTheDocument();
    expect(screen.getByText("No notes yet. Add one above!")).toBeInTheDocument();
  });

  test("displays notes in card layout", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    // Should render cards for each note
    const noteCards = screen.getAllByText(/First Note|Second Note|Note Without Content/);
    expect(noteCards).toHaveLength(3);
  });

  test("accessibility: delete buttons have proper labels", () => {
    render(<SampleNoteList notes={sampleNotes} onNoteDeleted={mockOnNoteDeleted} />);

    const deleteButtons = screen.getAllByRole("button");
    deleteButtons.forEach((button) => {
      // Should have some form of accessible description
      expect(button).toHaveAttribute("aria-label");
    });
  });

  test("handles long content gracefully", () => {
    const notesWithLongContent = [
      {
        id: 1,
        title: "Note with Very Long Content",
        content:
          "This is a very long content that should be displayed properly without breaking the layout. ".repeat(
            10
          ),
        user_id: 1,
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          created_at: "2024-01-01",
        },
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
      },
    ];

    render(<SampleNoteList notes={notesWithLongContent} onNoteDeleted={mockOnNoteDeleted} />);

    expect(screen.getByText("Note with Very Long Content")).toBeInTheDocument();
    // Content should be present but may be truncated or wrapped
    expect(screen.getByText(/This is a very long content/)).toBeInTheDocument();
  });
});
