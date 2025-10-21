import { TaskInput } from "@/features/tasks/components/TaskInput";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("TaskInput Component", () => {
  const renderWithMantine = (component: React.ReactElement) => {
    return render(<MantineProvider>{component}</MantineProvider>);
  };

  it("入力欄とボタンが表示される", () => {
    const onSubmit = vi.fn();

    renderWithMantine(<TaskInput onSubmit={onSubmit} />);

    expect(screen.getByPlaceholderText(/タスクを入力してください/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /追加/i })).toBeInTheDocument();
  });

  it("タスクを入力して送信できる", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithMantine(<TaskInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/タスクを入力してください/i);
    const button = screen.getByRole("button", { name: /追加/i });

    await user.type(input, "牛乳を買う");
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledWith("牛乳を買う");
    expect(input).toHaveValue(""); // 送信後にクリアされる
  });

  it("Enterキーで送信できる", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithMantine(<TaskInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/タスクを入力してください/i);

    await user.type(input, "牛乳を買う{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("牛乳を買う");
    expect(input).toHaveValue("");
  });

  it("空の入力は送信しない", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithMantine(<TaskInput onSubmit={onSubmit} />);

    const button = screen.getByRole("button", { name: /追加/i });

    await user.click(button);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("空白のみの入力は送信しない", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithMantine(<TaskInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/タスクを入力してください/i);
    const button = screen.getByRole("button", { name: /追加/i });

    await user.type(input, "   ");
    await user.click(button);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("loading中はボタンが無効化される", () => {
    const onSubmit = vi.fn();

    renderWithMantine(<TaskInput onSubmit={onSubmit} isLoading={true} />);

    const button = screen.getByRole("button", { name: /追加/i });

    expect(button).toBeDisabled();
  });

  it("loading中は入力欄も無効化される", () => {
    const onSubmit = vi.fn();

    renderWithMantine(<TaskInput onSubmit={onSubmit} isLoading={true} />);

    const input = screen.getByPlaceholderText(/タスクを入力してください/i);

    expect(input).toBeDisabled();
  });
});
