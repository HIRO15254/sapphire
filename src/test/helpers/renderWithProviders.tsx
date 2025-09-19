import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { type RenderOptions, render } from "@testing-library/react";
import type React from "react";

// Wrapper component for Mantine provider with notifications
const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <Notifications />
    {children}
  </MantineProvider>
);

// Custom render with providers
const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { renderWithProviders as render };
