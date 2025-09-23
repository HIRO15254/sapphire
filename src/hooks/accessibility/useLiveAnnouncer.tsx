import { useCallback, useRef } from "react";

export const useLiveAnnouncer = () => {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute("aria-live", priority);
      announcementRef.current.textContent = message;

      // Clear the message after a short delay to allow re-announcing the same message
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = "";
        }
      }, 100);
    }
  }, []);

  const LiveRegion = useCallback(
    () => (
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />
    ),
    []
  );

  return { announce, LiveRegion };
};
