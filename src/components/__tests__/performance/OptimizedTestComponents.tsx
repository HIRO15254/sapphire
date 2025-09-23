import { memo, useCallback, useMemo } from "react";

// useMemo テスト用コンポーネント
export const OptimizedCalculationComponent = memo<{ items: { active: boolean }[] }>(({ items }) => {
  const activeCount = useMemo(() => {
    // 重い計算をシミュレート
    return items.filter((item) => item.active).length;
  }, [items]);

  return <div data-testid="active-count">{activeCount}</div>;
});

OptimizedCalculationComponent.displayName = "OptimizedCalculationComponent";

// useCallback テスト用コンポーネント
export const OptimizedCallbackParent = memo<{ count: number }>(({ count }) => {
  const handleClick = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("clicked");
  }, []); // 空の依存配列で関数参照を安定化

  return (
    <div>
      <div>{count}</div>
      <OptimizedCallbackChild onClick={handleClick} />
    </div>
  );
});

OptimizedCallbackParent.displayName = "OptimizedCallbackParent";

const OptimizedCallbackChild = memo<{ onClick: () => void }>(({ onClick }) => {
  return (
    <button type="button" onClick={onClick}>
      Click
    </button>
  );
});

OptimizedCallbackChild.displayName = "OptimizedCallbackChild";
