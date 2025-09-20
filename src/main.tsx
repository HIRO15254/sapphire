import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";
import { AppThemeProvider } from "./theme/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppThemeProvider>
      <Notifications />
      <App />
    </AppThemeProvider>
  </React.StrictMode>
);
