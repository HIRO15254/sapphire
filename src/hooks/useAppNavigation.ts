import { useCallback, useState } from "react";
import type { AppNavigationHookReturn } from "../types/responsive";

// ナビゲーション状態管理フック
export const useAppNavigation = (): AppNavigationHookReturn => {
  const [hamburgerOpened, setHamburgerOpened] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleHamburger = useCallback(() => {
    setHamburgerOpened((prev) => !prev);
  }, []);

  const closeHamburger = useCallback(() => {
    setHamburgerOpened(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return {
    hamburgerOpened,
    toggleHamburger,
    closeHamburger,
    sidebarCollapsed,
    toggleSidebar,
  };
};
