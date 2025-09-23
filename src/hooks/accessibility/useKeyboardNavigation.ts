import { useEffect, useRef } from "react";

interface UseKeyboardNavigationOptions {
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

export const useKeyboardNavigation = (
  options: UseKeyboardNavigationOptions,
  isActive: boolean = true
) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          options.onArrowDown?.();
          break;
        case "ArrowUp":
          e.preventDefault();
          options.onArrowUp?.();
          break;
        case "Home":
          e.preventDefault();
          options.onHome?.();
          break;
        case "End":
          e.preventDefault();
          options.onEnd?.();
          break;
        case "Enter":
          options.onEnter?.();
          break;
        case "Escape":
          options.onEscape?.();
          break;
        default:
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [isActive, options]);

  return containerRef;
};
