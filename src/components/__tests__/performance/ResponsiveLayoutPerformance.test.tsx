import { MantineProvider } from "@mantine/core";
import { render } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { PerformanceMonitor } from "../../../utils/performance";
import { ResponsiveLayout } from "../../layout/ResponsiveLayout/ResponsiveLayout";

describe("ResponsiveLayout Performance Tests (Red Phase)", () => {
  const monitor = PerformanceMonitor.getInstance();

  beforeEach(() => {
    monitor.clearMetrics();
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <MantineProvider>{children}</MantineProvider>
    </BrowserRouter>
  );

  // TC-301-001: React.memo効果測定
  test("should prevent unnecessary re-renders with React.memo", () => {
    const renderSpy = vi.fn();

    // カスタムコンポーネントでレンダリング回数をカウント
    const SpyComponent = React.memo(() => {
      renderSpy();
      return <div data-testid="spy-component">Test</div>;
    });

    const TestParent = ({ prop: _prop }: { prop: number }) => (
      <TestWrapper>
        <ResponsiveLayout>
          <SpyComponent />
        </ResponsiveLayout>
      </TestWrapper>
    );

    const { rerender } = render(<TestParent prop={1} />);

    // 初回レンダリング
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // propsが同じ場合の再レンダリング
    rerender(<TestParent prop={1} />);

    // FAILING: 現在のResponsiveLayoutはReact.memoされていないため、再レンダリングが発生
    expect(renderSpy).toHaveBeenCalledTimes(1); // 期待値: 1回のまま
  });

  // TC-301-002: useMemo効果測定
  test("should memoize expensive calculations", () => {
    const expensiveCalculation = vi.fn((items: any[]) => {
      // 重い計算をシミュレート
      return items.filter((item) => item.active).length;
    });

    const TestComponent = ({ items }: { items: any[] }) => {
      const activeCount = React.useMemo(() => expensiveCalculation(items), [items]);
      return <div data-testid="active-count">{activeCount}</div>;
    };

    const items = [{ active: true }, { active: false }, { active: true }];

    const { rerender } = render(
      <TestWrapper>
        <TestComponent items={items} />
      </TestWrapper>
    );

    expect(expensiveCalculation).toHaveBeenCalledTimes(1);

    // 同じpropsで再レンダリング
    rerender(
      <TestWrapper>
        <TestComponent items={items} />
      </TestWrapper>
    );

    // PASSING: useMemoを使用しているため、再計算されない
    expect(expensiveCalculation).toHaveBeenCalledTimes(1); // 期待値: 1回のまま
  });

  // TC-301-003: useCallback効果測定
  test("should stabilize function references with useCallback", () => {
    const childRenderSpy = vi.fn();

    const Child = React.memo(({ onClick }: { onClick: () => void }) => {
      childRenderSpy();
      return (
        <button type="button" onClick={onClick}>
          Click
        </button>
      );
    });

    const Parent = ({ count }: { count: number }) => {
      const handleClick = React.useCallback(() => console.log("clicked"), []);
      return (
        <div>
          <div>{count}</div>
          <Child onClick={handleClick} />
        </div>
      );
    };

    const { rerender } = render(
      <TestWrapper>
        <Parent count={1} />
      </TestWrapper>
    );

    expect(childRenderSpy).toHaveBeenCalledTimes(1);

    // countを変更して再レンダリング
    rerender(
      <TestWrapper>
        <Parent count={2} />
      </TestWrapper>
    );

    // PASSING: useCallbackを使用しているため、Child は再レンダリングされない
    expect(childRenderSpy).toHaveBeenCalledTimes(1); // 期待値: 1回のまま
  });

  // TC-301-004: レイアウト切り替え速度
  test("should switch layout within 200ms", async () => {
    // MediaQuery モックを設定
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: !query.includes("48em"), // デスクトップ
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    monitor.startMeasurement("layout-switch");

    render(
      <TestWrapper>
        <ResponsiveLayout>
          <div>Test content</div>
        </ResponsiveLayout>
      </TestWrapper>
    );

    // モバイルに切り替え
    (window.matchMedia as any).mockImplementation((query) => ({
      matches: !!query.includes("48em"), // モバイル
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // レイアウト切り替えをトリガー
    window.dispatchEvent(new Event("resize"));

    const metrics = monitor.endMeasurement("layout-switch");

    // FAILING: 最適化されていないため、200ms以内での切り替えができない
    expect(metrics.renderTime).toBeLessThan(200); // 期待値: 200ms以内
  });
});
