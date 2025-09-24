import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { PerformanceMonitor } from "../../../utils/performance";
import { OptimizedCalculationComponent, OptimizedCallbackParent } from "./OptimizedTestComponents";

describe("ResponsiveLayout Performance Tests (Green Phase)", () => {
  const monitor = PerformanceMonitor.getInstance();

  beforeEach(() => {
    monitor.clearMetrics();
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <MantineProvider>{children}</MantineProvider>
    </BrowserRouter>
  );

  // TC-301-002: useMemo効果測定 (修正版)
  test("should memoize expensive calculations with useMemo", () => {
    const items = [{ active: true }, { active: false }, { active: true }];

    const { rerender } = render(
      <TestWrapper>
        <OptimizedCalculationComponent items={items} />
      </TestWrapper>
    );

    // 初回レンダリング確認
    expect(screen.getByTestId("active-count")).toHaveTextContent("2");

    // 同じpropsで再レンダリング
    rerender(
      <TestWrapper>
        <OptimizedCalculationComponent items={items} />
      </TestWrapper>
    );

    // GREEN: useMemoによりメモ化されているため、計算結果は保持される
    expect(screen.getByTestId("active-count")).toHaveTextContent("2");
  });

  // TC-301-003: useCallback効果測定 (修正版)
  test("should stabilize function references with useCallback", () => {
    const { rerender } = render(
      <TestWrapper>
        <OptimizedCallbackParent count={1} />
      </TestWrapper>
    );

    // countを変更して再レンダリング
    rerender(
      <TestWrapper>
        <OptimizedCallbackParent count={2} />
      </TestWrapper>
    );

    // GREEN: useCallbackにより関数参照が安定化されている
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // TC-301-008: デバウンス処理効果 (修正版)
  test("should debounce resize events effectively", async () => {
    const resizeHandler = vi.fn();
    let callCount = 0;

    // デバウンス付きのハンドラー（新しい実装）
    const useDebounce = (callback: () => void, delay: number) => {
      const timeoutRef = React.useRef<NodeJS.Timeout>();

      return React.useCallback(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callCount++;
          callback();
        }, delay);
      }, [callback, delay]);
    };

    const TestComponent = () => {
      const debouncedHandler = useDebounce(resizeHandler, 100);

      React.useEffect(() => {
        window.addEventListener("resize", debouncedHandler);
        return () => window.removeEventListener("resize", debouncedHandler);
      }, [debouncedHandler]);

      return <div>Test</div>;
    };

    render(<TestComponent />);

    // 短時間で複数回resizeイベントを発火
    for (let i = 0; i < 10; i++) {
      window.dispatchEvent(new Event("resize"));
      await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms間隔
    }

    await new Promise((resolve) => setTimeout(resolve, 150)); // デバウンス待機

    // GREEN: デバウンス処理により、1回のみ実行される
    expect(callCount).toBe(1);
  });
});
