import {
  IconBell,
  IconDashboard,
  IconHeart,
  IconHome,
  IconNotes,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ResponsiveLayout from "./components/layout/ResponsiveLayout";
import type { NavigationConfig } from "./components/layout/ResponsiveLayout/types";
import ComingSoonPage from "./pages/ComingSoonPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const navigationConfig: NavigationConfig = {
    primary: [
      {
        id: "home",
        label: "ホーム",
        path: "/",
        icon: IconHome,
      },
      {
        id: "users",
        label: "ユーザー",
        path: "/users",
        icon: IconUsers,
      },
      {
        id: "notes",
        label: "ノート",
        path: "/notes",
        icon: IconNotes,
      },
      {
        id: "search",
        label: "検索",
        path: "/search",
        icon: IconSearch,
      },
      {
        id: "notifications",
        label: "通知",
        path: "/notifications",
        icon: IconBell,
        badge: "3",
      },
    ],
    secondary: [
      {
        id: "dashboard",
        label: "ダッシュボード",
        path: "/dashboard",
        icon: IconDashboard,
        group: "main",
      },
      {
        id: "favorites",
        label: "お気に入り",
        path: "/favorites",
        icon: IconHeart,
        group: "main",
      },
      {
        id: "settings",
        label: "設定",
        path: "/settings",
        icon: IconSettings,
        group: "system",
      },
    ],
  };

  return (
    <BrowserRouter>
      <ResponsiveLayout navigationConfig={navigationConfig}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<ComingSoonPage />} />
          <Route path="/notes" element={<ComingSoonPage />} />
          <Route path="/search" element={<ComingSoonPage />} />
          <Route path="/notifications" element={<ComingSoonPage />} />
          <Route path="/dashboard" element={<ComingSoonPage />} />
          <Route path="/favorites" element={<ComingSoonPage />} />
          <Route path="/settings" element={<ComingSoonPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ResponsiveLayout>
    </BrowserRouter>
  );
}

export default App;
