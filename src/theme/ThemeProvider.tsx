import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { useHotkeys, useLocalStorage } from "@mantine/hooks";
import { cssVariablesResolver } from "./cssVariables";
import { appTheme } from "./index";

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [colorScheme, setColorScheme] = useLocalStorage<"light" | "dark" | "auto">({
    key: "app-color-scheme",
    defaultValue: "auto",
  });

  // キーボードショートカット (Ctrl/Cmd + J でテーマ切り替え)
  useHotkeys([["mod+J", () => setColorScheme((c) => (c === "dark" ? "light" : "dark"))]]);

  return (
    <>
      <ColorSchemeScript defaultColorScheme={colorScheme} />
      <MantineProvider
        theme={appTheme}
        defaultColorScheme={colorScheme}
        cssVariablesResolver={cssVariablesResolver}
      >
        {children}
      </MantineProvider>
    </>
  );
}
