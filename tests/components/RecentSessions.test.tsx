import { RecentSessions } from "@/features/dashboard/components/RecentSessions";
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

const mockSessions = [
  {
    id: 1,
    date: new Date("2024-01-15T14:00:00"),
    location: { id: 1, name: "カジノA" },
    profit: 15000,
    durationMinutes: 180,
  },
  {
    id: 2,
    date: new Date("2024-01-14T10:00:00"),
    location: { id: 2, name: "ポーカールームB" },
    profit: -5000,
    durationMinutes: 120,
  },
  {
    id: 3,
    date: new Date("2024-01-13T18:00:00"),
    location: { id: 1, name: "カジノA" },
    profit: 0,
    durationMinutes: 90,
  },
];

describe("RecentSessions", () => {
  describe("セッション一覧の表示", () => {
    it("セッションが正しく表示される", () => {
      render(<RecentSessions sessions={mockSessions} />);

      // 同じ場所が複数回表示される可能性があるためgetAllByTextを使用
      const casinoAElements = screen.getAllByText("カジノA");
      expect(casinoAElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("ポーカールームB")).toBeInTheDocument();
    });

    it("収支が正しく表示される", () => {
      render(<RecentSessions sessions={mockSessions} />);

      // formatCurrency は全角円記号を使用する
      expect(screen.getByText("+￥15,000")).toBeInTheDocument();
      expect(screen.getByText("-￥5,000")).toBeInTheDocument();
      expect(screen.getByText("￥0")).toBeInTheDocument();
    });

    it("利益は緑、損失は赤で色分けされる", () => {
      render(<RecentSessions sessions={mockSessions} />);

      const profitBadge = screen.getByText("+￥15,000");
      const lossBadge = screen.getByText("-￥5,000");

      // Mantineのバッジは親要素にdata-colorを持つ
      expect(profitBadge.closest("[data-color]")).toHaveAttribute("data-color", "green");
      expect(lossBadge.closest("[data-color]")).toHaveAttribute("data-color", "red");
    });
  });

  describe("セッションへのリンク", () => {
    it("セッションをクリックすると詳細ページへのリンクがある", () => {
      render(<RecentSessions sessions={mockSessions} />);

      // セッションへのリンクを確認（最初のリンクは「すべて見る」なので、2番目以降を確認）
      const sessionLinks = screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href")?.startsWith("/poker-sessions/"));
      expect(sessionLinks[0]).toHaveAttribute("href", "/poker-sessions/1");
    });
  });

  describe("空状態", () => {
    it("セッションがない場合は空状態メッセージが表示される", () => {
      render(<RecentSessions sessions={[]} />);

      expect(screen.getByText("最近のセッションはありません")).toBeInTheDocument();
    });
  });

  describe("セクションタイトル", () => {
    it("「最近のセッション」というタイトルが表示される", () => {
      render(<RecentSessions sessions={mockSessions} />);

      expect(screen.getByText("最近のセッション")).toBeInTheDocument();
    });

    it("「すべて見る」リンクが表示される", () => {
      render(<RecentSessions sessions={mockSessions} />);

      const viewAllLink = screen.getByRole("link", { name: /すべて見る/ });
      expect(viewAllLink).toHaveAttribute("href", "/poker-sessions");
    });
  });

  describe("表示件数", () => {
    it("maxCountで指定した件数だけ表示される", () => {
      render(<RecentSessions sessions={mockSessions} maxCount={2} />);

      const sessionItems = screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href")?.startsWith("/poker-sessions/"));
      expect(sessionItems).toHaveLength(2);
    });

    it("デフォルトは5件まで表示される", () => {
      const manySessions = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        date: new Date(`2024-01-${15 - i}T14:00:00`),
        location: { id: 1, name: `場所${i + 1}` },
        profit: 1000 * (i + 1),
        durationMinutes: 60,
      }));

      render(<RecentSessions sessions={manySessions} />);

      const sessionItems = screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href")?.startsWith("/poker-sessions/"));
      expect(sessionItems).toHaveLength(5);
    });
  });
});
