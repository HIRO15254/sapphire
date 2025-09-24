import { useCallback, useEffect, useRef } from "react";

export interface UseOptimizedResizeOptions {
  delay?: number;
  enabled?: boolean;
}

export function useOptimizedResize(callback: () => void, options: UseOptimizedResizeOptions = {}) {
  const { delay = 100, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("resize", debouncedCallback);
    return () => {
      window.removeEventListener("resize", debouncedCallback);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedCallback, enabled]);
}
