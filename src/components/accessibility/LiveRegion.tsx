import type React from "react";

interface LiveRegionProps {
  message?: string;
  priority?: "polite" | "assertive";
  atomic?: boolean;
  role?: "status" | "alert" | "log";
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message = "",
  priority = "polite",
  atomic = true,
  role = "status",
}) => {
  return (
    <div
      role={role}
      aria-live={priority}
      aria-atomic={atomic}
      style={{
        position: "absolute",
        left: "-10000px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      {message}
    </div>
  );
};
