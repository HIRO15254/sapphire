import { TaskItem } from "@/features/tasks/components/TaskItem";
import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("TaskItem Component", () => {
  const renderWithMantine = (component: React.ReactElement) => {
    return render(<MantineProvider>{component}</MantineProvider>);
  };

  const mockTask = {
    id: "test-id-123",
    content: "テストタスク",
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("表示機能", () => {
    it("タスクの内容が表示される", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);

      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    it("未完了タスクはチェックボックスがオフである", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("完了タスクはチェックボックスがオンである", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();
      const completedTask = { ...mockTask, completed: true };

      renderWithMantine(<TaskItem task={completedTask} onToggle={onToggle} onDelete={onDelete} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  describe("完了機能（User Story 2）", () => {
    it("チェックボックスをクリックするとonToggleが呼ばれる", async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(onToggle).toHaveBeenCalledWith(mockTask.id);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("完了タスクは取り消し線スタイルが適用される（FR-006）", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();
      const completedTask = { ...mockTask, completed: true };

      renderWithMantine(<TaskItem task={completedTask} onToggle={onToggle} onDelete={onDelete} />);

      const taskText = screen.getByText("テストタスク");
      expect(taskText).toHaveStyle({ textDecoration: "line-through" });
    });

    it("未完了タスクは取り消し線がない", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);

      const taskText = screen.getByText("テストタスク");
      expect(taskText).not.toHaveStyle({ textDecoration: "line-through" });
    });

    it("完了タスクと未完了タスクの視覚的区別が明確（FR-006）", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      const { rerender } = renderWithMantine(
        <TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />
      );

      const taskTextIncomplete = screen.getByText("テストタスク");
      expect(taskTextIncomplete).not.toHaveStyle({
        textDecoration: "line-through",
      });

      // 完了状態に再レンダリング
      const completedTask = { ...mockTask, completed: true };
      rerender(
        <MantineProvider>
          <TaskItem task={completedTask} onToggle={onToggle} onDelete={onDelete} />
        </MantineProvider>
      );

      const taskTextCompleted = screen.getByText("テストタスク");
      expect(taskTextCompleted).toHaveStyle({ textDecoration: "line-through" });
    });
  });

  describe("削除機能（User Story 3）", () => {
    it("削除ボタンが表示される", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("削除ボタンをクリックすると確認ダイアログが表示され、確定でonDeleteが呼ばれる", async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      // 確認ダイアログが表示されるまで待機（モーダルのアニメーション対応）
      await waitFor(() => {
        expect(screen.getByText("このタスクを削除してもよろしいですか？")).toBeInTheDocument();
      });

      // 「削除する」ボタンをクリック
      const confirmButton = screen.getByRole("button", { name: /削除する/ });
      await user.click(confirmButton);

      expect(onDelete).toHaveBeenCalledWith(mockTask.id);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("onDeleteが未定義の場合、削除ボタンは表示されない", () => {
      const onToggle = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} />);

      expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("チェックボックスに適切なaria-labelがある", () => {
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      renderWithMantine(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAccessibleName(/テストタスク/);
    });
  });
});
