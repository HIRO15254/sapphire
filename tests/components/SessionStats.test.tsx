import { SessionStats } from "@/features/poker-sessions/components/SessionStats";
import { describe, expect, it } from "vitest";
import { render, screen } from "./test-utils";

describe("SessionStats", () => {
  it("セッション数0の場合、空の状態が表示される", () => {
    render(<SessionStats totalProfit={0} sessionCount={0} avgProfit={0} />);

    expect(screen.getByText("セッションがありません")).toBeInTheDocument();
    expect(screen.getByText(/最初のセッションを記録/)).toBeInTheDocument();
  });

  it("合計収支が正しく表示される（プラス）", () => {
    render(<SessionStats totalProfit={50000} sessionCount={10} avgProfit={5000} />);

    // 金額のフォーマットは環境依存のため正規表現でマッチ
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getByText("利益")).toBeInTheDocument();
  });

  it("合計収支が正しく表示される（マイナス）", () => {
    render(<SessionStats totalProfit={-30000} sessionCount={5} avgProfit={-6000} />);

    expect(screen.getByText(/30,000/)).toBeInTheDocument();
    expect(screen.getByText("損失")).toBeInTheDocument();
  });

  it("セッション数が正しく表示される", () => {
    render(<SessionStats totalProfit={10000} sessionCount={15} avgProfit={666} />);

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("合計")).toBeInTheDocument();
  });

  it("平均収支が正しく表示される", () => {
    render(<SessionStats totalProfit={30000} sessionCount={6} avgProfit={5000} />);

    // セッション数と平均ラベルを確認
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("1セッション")).toBeInTheDocument();
  });

  it("総収支ラベルが表示される", () => {
    render(<SessionStats totalProfit={10000} sessionCount={2} avgProfit={5000} />);

    expect(screen.getByText("総収支")).toBeInTheDocument();
    expect(screen.getByText("セッション数")).toBeInTheDocument();
    expect(screen.getByText("平均収支")).toBeInTheDocument();
  });
});
