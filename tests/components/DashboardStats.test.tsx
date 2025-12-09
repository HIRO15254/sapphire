import { DashboardStats } from "@/features/dashboard/components/DashboardStats";
import { describe, expect, it } from "vitest";
import { render, screen } from "./test-utils";

describe("DashboardStats", () => {
  describe("統計情報の表示", () => {
    it("総収支が正しく表示される", () => {
      render(
        <DashboardStats
          totalProfit={50000}
          sessionCount={10}
          avgProfit={5000}
          totalDurationMinutes={1200}
        />
      );

      expect(screen.getByText("総収支")).toBeInTheDocument();
      // formatCurrency は全角円記号を使用する
      expect(screen.getByText("￥50,000")).toBeInTheDocument();
    });

    it("セッション数が正しく表示される", () => {
      render(
        <DashboardStats
          totalProfit={50000}
          sessionCount={10}
          avgProfit={5000}
          totalDurationMinutes={1200}
        />
      );

      expect(screen.getByText("セッション数")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("平均収支が正しく表示される", () => {
      render(
        <DashboardStats
          totalProfit={50000}
          sessionCount={10}
          avgProfit={5000}
          totalDurationMinutes={1200}
        />
      );

      expect(screen.getByText("平均収支")).toBeInTheDocument();
      expect(screen.getByText("￥5,000")).toBeInTheDocument();
    });

    it("総プレイ時間が正しく表示される", () => {
      render(
        <DashboardStats
          totalProfit={50000}
          sessionCount={10}
          avgProfit={5000}
          totalDurationMinutes={1200}
        />
      );

      expect(screen.getByText("総プレイ時間")).toBeInTheDocument();
      expect(screen.getByText("20時間")).toBeInTheDocument();
    });
  });

  describe("利益/損失の色分け", () => {
    it("利益がある場合は緑色で表示される", () => {
      render(
        <DashboardStats
          totalProfit={50000}
          sessionCount={10}
          avgProfit={5000}
          totalDurationMinutes={1200}
        />
      );

      const profitElement = screen.getByText("￥50,000");
      // MantineはCSS変数を使用するため、style属性にgreen関連のクラスが含まれることを確認
      expect(profitElement).toHaveAttribute("style", expect.stringContaining("green"));
    });

    it("損失がある場合は赤色で表示される", () => {
      render(
        <DashboardStats
          totalProfit={-30000}
          sessionCount={10}
          avgProfit={-3000}
          totalDurationMinutes={1200}
        />
      );

      const lossElement = screen.getByText("-￥30,000");
      expect(lossElement).toHaveAttribute("style", expect.stringContaining("red"));
    });
  });

  describe("空状態", () => {
    it("セッションがない場合は空状態メッセージが表示される", () => {
      render(
        <DashboardStats totalProfit={0} sessionCount={0} avgProfit={0} totalDurationMinutes={0} />
      );

      expect(screen.getByText("セッションがありません")).toBeInTheDocument();
      expect(
        screen.getByText("最初のセッションを記録して統計を表示しましょう")
      ).toBeInTheDocument();
    });

    it("空状態ではセッション作成へのリンクが表示される", () => {
      render(
        <DashboardStats totalProfit={0} sessionCount={0} avgProfit={0} totalDurationMinutes={0} />
      );

      const createLink = screen.getByRole("link", { name: /セッションを記録/ });
      expect(createLink).toHaveAttribute("href", "/poker-sessions/new");
    });
  });

  describe("プレイ時間のフォーマット", () => {
    it("分のみの場合は分で表示される", () => {
      render(
        <DashboardStats
          totalProfit={1000}
          sessionCount={1}
          avgProfit={1000}
          totalDurationMinutes={45}
        />
      );

      expect(screen.getByText("45分")).toBeInTheDocument();
    });

    it("時間と分の場合は両方表示される", () => {
      render(
        <DashboardStats
          totalProfit={1000}
          sessionCount={1}
          avgProfit={1000}
          totalDurationMinutes={90}
        />
      );

      expect(screen.getByText("1時間30分")).toBeInTheDocument();
    });

    it("ちょうど時間の場合は時間のみ表示される", () => {
      render(
        <DashboardStats
          totalProfit={1000}
          sessionCount={1}
          avgProfit={1000}
          totalDurationMinutes={120}
        />
      );

      expect(screen.getByText("2時間")).toBeInTheDocument();
    });
  });
});
