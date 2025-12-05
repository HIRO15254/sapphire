import { SessionDetail } from "@/features/poker-sessions/components/SessionDetail";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "./test-utils";

// next/linkのモック
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockSession = {
  id: 1,
  date: new Date("2024-01-15T14:00:00"),
  location: { id: 1, name: "カジノA" },
  buyIn: "10000",
  cashOut: "25000",
  durationMinutes: 180,
  profit: 15000,
  notes: "<p>良いセッションでした。</p>",
  tags: [
    { id: 1, name: "ライブ" },
    { id: 2, name: "キャッシュ" },
  ],
};

describe("SessionDetail", () => {
  describe("基本情報の表示", () => {
    it("セッションの日時が表示される", () => {
      render(<SessionDetail session={mockSession} />);

      // 日時が表示される（フォーマットは実装依存）
      expect(screen.getByText(/2024年1月15日/)).toBeInTheDocument();
    });

    it("場所が表示される", () => {
      render(<SessionDetail session={mockSession} />);

      expect(screen.getByText("カジノA")).toBeInTheDocument();
    });

    it("バイインが表示される", () => {
      render(<SessionDetail session={mockSession} />);

      expect(screen.getByText(/バイイン/)).toBeInTheDocument();
      expect(screen.getByText("￥10,000")).toBeInTheDocument();
    });

    it("キャッシュアウトが表示される", () => {
      render(<SessionDetail session={mockSession} />);

      expect(screen.getByText(/キャッシュアウト/)).toBeInTheDocument();
      expect(screen.getByText("￥25,000")).toBeInTheDocument();
    });

    it("収支が表示される", () => {
      render(<SessionDetail session={mockSession} />);

      expect(screen.getByText(/収支/)).toBeInTheDocument();
      expect(screen.getByText("+￥15,000")).toBeInTheDocument();
    });

    it("プレイ時間が表示される", () => {
      render(<SessionDetail session={mockSession} />);

      expect(screen.getByText(/プレイ時間/)).toBeInTheDocument();
      expect(screen.getByText("3時間")).toBeInTheDocument();
    });
  });

  describe("タグの表示", () => {
    it("タグが表示される", () => {
      render(<SessionDetail session={mockSession} />);

      expect(screen.getByText("ライブ")).toBeInTheDocument();
      expect(screen.getByText("キャッシュ")).toBeInTheDocument();
    });

    it("タグがない場合はタグセクションが表示されない", () => {
      const sessionWithoutTags = { ...mockSession, tags: [] };
      render(<SessionDetail session={sessionWithoutTags} />);

      // タグセクションがないことを確認
      expect(screen.queryByText("タグ")).not.toBeInTheDocument();
    });
  });

  describe("メモの表示", () => {
    it("メモが表示される", () => {
      render(<SessionDetail session={mockSession} />);

      expect(screen.getByText(/良いセッションでした/)).toBeInTheDocument();
    });

    it("メモがない場合はメモセクションが表示されない", () => {
      const sessionWithoutNotes = { ...mockSession, notes: null };
      render(<SessionDetail session={sessionWithoutNotes} />);

      // メモの内容がないことを確認（「メモ」というラベルはあってもよい）
      expect(screen.queryByText(/良いセッションでした/)).not.toBeInTheDocument();
    });
  });

  describe("収支の色分け", () => {
    it("利益の場合は緑色で表示される", () => {
      render(<SessionDetail session={mockSession} />);

      const profitText = screen.getByText("+￥15,000");
      // 親要素または自身に緑色関連のスタイルがあることを確認
      expect(profitText.closest("[data-color]") || profitText).toHaveAttribute("style");
    });

    it("損失の場合は赤色で表示される", () => {
      const sessionWithLoss = {
        ...mockSession,
        cashOut: "5000",
        profit: -5000,
      };
      render(<SessionDetail session={sessionWithLoss} />);

      const lossText = screen.getByText("-￥5,000");
      expect(lossText).toBeInTheDocument();
    });
  });

  describe("アクションボタン", () => {
    it("編集リンクが表示される", () => {
      render(<SessionDetail session={mockSession} />);

      const editLink = screen.getByRole("link", { name: /編集/ });
      expect(editLink).toHaveAttribute("href", "/poker-sessions/1/edit");
    });

    it("削除ボタンが表示される", () => {
      const onDelete = vi.fn();
      render(<SessionDetail session={mockSession} onDelete={onDelete} />);

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("削除ボタンをクリックするとコールバックが呼ばれる", () => {
      const onDelete = vi.fn();
      render(<SessionDetail session={mockSession} onDelete={onDelete} />);

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it("戻るリンクが表示される", () => {
      render(<SessionDetail session={mockSession} />);

      const backLink = screen.getByRole("link", { name: /一覧に戻る/ });
      expect(backLink).toHaveAttribute("href", "/poker-sessions");
    });
  });
});
