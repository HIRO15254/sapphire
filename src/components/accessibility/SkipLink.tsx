import { Anchor } from "@mantine/core";
import type React from "react";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <Anchor
      href={href}
      style={{
        position: "absolute",
        left: "-10000px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        zIndex: 1000,
        padding: "8px 16px",
        backgroundColor: "#000",
        color: "#fff",
        textDecoration: "none",
        border: "2px solid #fff",
        borderRadius: "4px",
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = "6px";
        e.currentTarget.style.top = "6px";
        e.currentTarget.style.width = "auto";
        e.currentTarget.style.height = "auto";
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = "-10000px";
        e.currentTarget.style.top = "auto";
        e.currentTarget.style.width = "1px";
        e.currentTarget.style.height = "1px";
      }}
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          (target as HTMLElement).focus();
          (target as HTMLElement).scrollIntoView({ behavior: "smooth" });
        }
      }}
    >
      {children}
    </Anchor>
  );
};
