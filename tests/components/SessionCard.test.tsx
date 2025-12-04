import { SessionCard } from "@/features/poker-sessions/components/SessionCard";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "./test-utils";

const mockSession = {
  id: 1,
  date: new Date("2025-01-15T18:00:00"),
  location: { id: 1, name: "ポーカースタジアム渋谷" },
  buyIn: "10000.00",
  cashOut: "15000.00",
  durationMinutes: 180,
  profit: 5000,
  tags: [
    { id: 1, name: "NLH" },
    { id: 2, name: "キャッシュ" },
  ],
  notes: "<p>良いセッションだった</p>",
};

describe("SessionCard", () => {
  it("場所名が表示される", () => {
    render(<SessionCard session={mockSession} />);

    expect(screen.getByText("ポーカースタジアム渋谷")).toBeInTheDocument();
  });

  it("収支が正しい色で表示される（プラス=緑）", () => {
    render(<SessionCard session={mockSession} />);

    const profitBadge = screen.getByText(/\+.*5,000/);
    expect(profitBadge).toBeInTheDocument();
  });

  it("収支が正しい色で表示される（マイナス=赤）", () => {
    const losingSession = { ...mockSession, profit: -3000, cashOut: "7000.00" };
    render(<SessionCard session={losingSession} />);

    const profitBadge = screen.getByText(/-.*3,000/);
    expect(profitBadge).toBeInTheDocument();
  });

  it("展開ボタンをクリックすると詳細が表示される", async () => {
    render(<SessionCard session={mockSession} />);

    // 展開ボタンをクリック
    const expandButton = screen.getByLabelText("詳細を表示");
    fireEvent.click(expandButton);

    // 詳細が表示される（Collapse完了を待機）
    expect(await screen.findByText("バイイン")).toBeInTheDocument();
    expect(screen.getByText("キャッシュアウト")).toBeInTheDocument();
  });

  it("タグが表示される", async () => {
    render(<SessionCard session={mockSession} />);

    // 展開して詳細を表示
    const expandButton = screen.getByLabelText("詳細を表示");
    fireEvent.click(expandButton);

    expect(await screen.findByText("NLH")).toBeInTheDocument();
    expect(screen.getByText("キャッシュ")).toBeInTheDocument();
  });

  it("編集ボタンをクリックするとonEditが呼ばれる", async () => {
    const onEdit = vi.fn();
    render(<SessionCard session={mockSession} onEdit={onEdit} />);

    // 展開して詳細を表示
    const expandButton = screen.getByLabelText("詳細を表示");
    fireEvent.click(expandButton);

    // 編集ボタンをクリック
    const editButton = await screen.findByRole("button", { name: "編集" });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(1);
  });

  it("削除ボタンをクリックするとonDeleteが呼ばれる", async () => {
    const onDelete = vi.fn();
    render(<SessionCard session={mockSession} onDelete={onDelete} />);

    // 展開して詳細を表示
    const expandButton = screen.getByLabelText("詳細を表示");
    fireEvent.click(expandButton);

    // 削除ボタンをクリック
    const deleteButton = await screen.findByRole("button", { name: "削除" });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("showActions=falseの場合、アクションボタンが表示されない", async () => {
    render(<SessionCard session={mockSession} showActions={false} onEdit={vi.fn()} />);

    // 展開して詳細を表示
    const expandButton = screen.getByLabelText("詳細を表示");
    fireEvent.click(expandButton);

    // Collapse完了を待機
    await screen.findByText("バイイン");

    expect(screen.queryByRole("button", { name: "編集" })).not.toBeInTheDocument();
  });
});
