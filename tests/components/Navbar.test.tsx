import { Navbar } from "@/features/layout/components/Navbar";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "./test-utils";

// next/navigationのモック
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

// next/linkのモック
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Navbar", () => {
  describe("ナビゲーションリンク", () => {
    it("ダッシュボード、セッション一覧のリンクが表示される", () => {
      render(<Navbar />);

      expect(screen.getByRole("link", { name: /ダッシュボード/ })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /セッション一覧/ })).toBeInTheDocument();
    });

    it("リンクが正しいhrefを持つ", () => {
      render(<Navbar />);

      expect(screen.getByRole("link", { name: /ダッシュボード/ })).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: /セッション一覧/ })).toHaveAttribute(
        "href",
        "/poker-sessions"
      );
    });
  });

  describe("アクティブ状態のハイライト", () => {
    it("現在のパスがルートの場合、ダッシュボードリンクがアクティブになる", async () => {
      const { usePathname } = await import("next/navigation");
      vi.mocked(usePathname).mockReturnValue("/");

      render(<Navbar />);

      const dashboardLink = screen.getByRole("link", { name: /ダッシュボード/ });
      expect(dashboardLink).toHaveAttribute("data-active", "true");
    });

    it("現在のパスが/poker-sessionsの場合、セッション一覧リンクがアクティブになる", async () => {
      const { usePathname } = await import("next/navigation");
      vi.mocked(usePathname).mockReturnValue("/poker-sessions");

      render(<Navbar />);

      const sessionsLink = screen.getByRole("link", { name: /セッション一覧/ });
      expect(sessionsLink).toHaveAttribute("data-active", "true");
    });

    it("子ルートでも親リンクがアクティブになる（/poker-sessions/123）", async () => {
      const { usePathname } = await import("next/navigation");
      vi.mocked(usePathname).mockReturnValue("/poker-sessions/123");

      render(<Navbar />);

      const sessionsLink = screen.getByRole("link", { name: /セッション一覧/ });
      expect(sessionsLink).toHaveAttribute("data-active", "true");
    });
  });

  describe("ユーザー情報", () => {
    it("ユーザー名が表示される", () => {
      render(<Navbar userName="テストユーザー" userEmail="test@example.com" />);

      expect(screen.getByText("テストユーザー")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  describe("ログアウト", () => {
    it("ログアウトボタンが表示される", () => {
      render(<Navbar onLogout={() => {}} />);

      expect(screen.getByRole("button", { name: "ログアウト" })).toBeInTheDocument();
    });

    it("ログアウトをクリックするとコールバックが呼ばれる", () => {
      const onLogout = vi.fn();
      render(<Navbar onLogout={onLogout} />);

      const logoutButton = screen.getByRole("button", { name: "ログアウト" });
      fireEvent.click(logoutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("ナビゲーションコールバック", () => {
    it("リンクをクリックするとonNavigateが呼ばれる", () => {
      const onNavigate = vi.fn();
      render(<Navbar onNavigate={onNavigate} />);

      const dashboardLink = screen.getByRole("link", { name: /ダッシュボード/ });
      fireEvent.click(dashboardLink);

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
