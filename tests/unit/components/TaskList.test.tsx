import { TaskList } from "@/features/tasks/components/TaskList";
import type { Task } from "@/server/db/schema";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("TaskList Component", () => {
  const renderWithMantine = (component: React.ReactElement) => {
    return render(<MantineProvider>{component}</MantineProvider>);
  };

  const mockTasks: Task[] = [
    {
      id: "1",
      content: "牛乳を買う",
      completed: false,
      createdAt: new Date("2025-10-17T10:00:00Z"),
      updatedAt: new Date("2025-10-17T10:00:00Z"),
    },
    {
      id: "2",
      content: "レポートを書く",
      completed: true,
      createdAt: new Date("2025-10-17T09:00:00Z"),
      updatedAt: new Date("2025-10-17T10:30:00Z"),
    },
  ];

  it("タスクのリストを表示する", () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();

    renderWithMantine(<TaskList tasks={mockTasks} onToggle={onToggle} onDelete={onDelete} />);

    expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
    expect(screen.getByText("レポートを書く")).toBeInTheDocument();
  });

  it("空のリストで「タスクがありません」を表示する", () => {
    const onToggle = vi.fn();

    renderWithMantine(<TaskList tasks={[]} onToggle={onToggle} />);

    expect(screen.getByText(/タスクがありません/i)).toBeInTheDocument();
  });

  it("loading中はローディング表示", () => {
    const onToggle = vi.fn();

    renderWithMantine(<TaskList tasks={[]} isLoading={true} onToggle={onToggle} />);

    expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
  });

  it("onToggleコールバックが渡される", () => {
    const onToggle = vi.fn();

    renderWithMantine(<TaskList tasks={mockTasks} onToggle={onToggle} />);

    // TaskItemコンポーネントが正しくレンダリングされていることを確認
    expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
    expect(screen.getByText("レポートを書く")).toBeInTheDocument();

    // チェックボックスが存在することを確認
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
  });

  it("onDeleteコールバックが渡される", () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();

    renderWithMantine(<TaskList tasks={mockTasks} onToggle={onToggle} onDelete={onDelete} />);

    // 削除ボタンが存在することを確認
    const deleteButtons = screen.getAllByLabelText("削除");
    expect(deleteButtons).toHaveLength(2);
  });

  it("onDeleteが省略された場合は削除ボタンが表示されない", () => {
    const onToggle = vi.fn();

    renderWithMantine(<TaskList tasks={mockTasks} onToggle={onToggle} />);

    // 削除ボタンが存在しないことを確認
    expect(screen.queryByLabelText("削除")).not.toBeInTheDocument();
  });
});
