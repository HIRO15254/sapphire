import { SessionList } from "@/features/poker-sessions/components/SessionList";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "./test-utils";

const mockSessions = [
  {
    id: 1,
    date: new Date("2025-01-15T18:00:00"),
    location: { id: 1, name: "渋谷" },
    buyIn: "10000.00",
    cashOut: "15000.00",
    durationMinutes: 180,
    profit: 5000,
    tags: [],
    notes: null,
  },
  {
    id: 2,
    date: new Date("2025-01-14T20:00:00"),
    location: { id: 2, name: "池袋" },
    buyIn: "20000.00",
    cashOut: "18000.00",
    durationMinutes: 240,
    profit: -2000,
    tags: [],
    notes: null,
  },
];

describe("SessionList", () => {
  it("空リストの場合、メッセージが表示される", () => {
    render(<SessionList sessions={[]} />);

    expect(screen.getByText("セッションがまだありません")).toBeInTheDocument();
  });

  it("カスタム空メッセージが表示される", () => {
    render(<SessionList sessions={[]} emptyMessage="検索結果がありません" />);

    expect(screen.getByText("検索結果がありません")).toBeInTheDocument();
  });

  it("セッション一覧が正しく表示される", () => {
    render(<SessionList sessions={mockSessions} />);

    expect(screen.getByText("渋谷")).toBeInTheDocument();
    expect(screen.getByText("池袋")).toBeInTheDocument();
  });

  it("onEditがセッションカードに渡される", async () => {
    const onEdit = vi.fn();
    render(<SessionList sessions={mockSessions} onEdit={onEdit} />);

    // 最初のカードを展開
    const expandButtons = screen.getAllByLabelText("詳細を表示");
    fireEvent.click(expandButtons[0]);

    // Collapse完了を待機
    const editButton = await screen.findByRole("button", { name: "編集" });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(1);
  });

  it("onDeleteがセッションカードに渡される", async () => {
    const onDelete = vi.fn();
    render(<SessionList sessions={mockSessions} onDelete={onDelete} />);

    // 最初のカードを展開
    const expandButtons = screen.getAllByLabelText("詳細を表示");
    fireEvent.click(expandButtons[0]);

    // Collapse完了を待機
    const deleteButton = await screen.findByRole("button", { name: "削除" });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
