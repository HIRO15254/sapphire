import { ActionIcon, Tooltip } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useAppTheme } from "../../hooks/useAppTheme";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "filled" | "outline";
}

export function ThemeToggle({ size = "md", variant = "subtle" }: ThemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useAppTheme();

  return (
    <Tooltip
      label={colorScheme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      position="bottom"
    >
      <ActionIcon
        onClick={toggleColorScheme}
        variant={variant}
        size={size}
        aria-label="テーマを切り替える"
      >
        {colorScheme === "dark" ? <IconSun size="1.125rem" /> : <IconMoon size="1.125rem" />}
      </ActionIcon>
    </Tooltip>
  );
}
