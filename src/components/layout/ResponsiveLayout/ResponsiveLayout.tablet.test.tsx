import { MantineProvider } from "@mantine/core";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "../../../test/helpers/renderWithProviders";
import { ResponsiveLayout } from "./ResponsiveLayout";
import type { NavigationConfig } from "./types";

// モックの設定
const mockNavConfig: NavigationConfig = {
  primary: [
    { id: "home", label: "ホーム", path: "/", icon: undefined },
    { id: "about", label: "About", path: "/about", icon: undefined },
  ],
  secondary: [
    { id: "settings", label: "設定", path: "/settings", icon: undefined },
    { id: "profile", label: "プロフィール", path: "/profile", icon: undefined },
  ],
};

describe("ResponsiveLayout - タブレットサイズでのナビゲーション問題", () => {
  const _originalMatchMedia = window.matchMedia;

  beforeAll(() => {
    // matchMediaのモック
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn(),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMatchMedia = (width: number) => {
    const matches = width <= 992; // 62em = 992px (Mantineのmdブレークポイント)
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  };

  test("修正後: 992px以下ではハンバーガーメニューが表示される", () => {
    // 900px幅をシミュレート（900px < 992px なのでモバイル扱い）
    setupMatchMedia(900);

    const { container } = render(
      <MantineProvider>
        <ResponsiveLayout navigationConfig={mockNavConfig}>
          <div>コンテンツ</div>
        </ResponsiveLayout>
      </MantineProvider>
    );

    // デバッグ情報
    console.log("isMobile should be true at 900px:", 900 <= 992);

    // ヘッダーは表示されている
    expect(screen.getByText("Sapphire")).toBeInTheDocument();

    // ハンバーガーメニューボタンが表示されることを確認
    const burgerButton =
      container.querySelector("button[data-burger]") ||
      container.querySelector(".mantine-Burger-root") ||
      screen.queryByRole("button", { name: /menu/i });

    console.log("Burger button found:", !!burgerButton);
    console.log("DOM structure:", container.innerHTML.slice(0, 500));

    expect(burgerButton).toBeTruthy();

    // サイドバー項目は直接表示されないことを確認
    const settingsLink = screen.queryByText("設定");
    const profileLink = screen.queryByText("プロフィール");
    expect(settingsLink).toBeNull();
    expect(profileLink).toBeNull();
  });

  test("モバイル（992px以下）ではハンバーガーメニューが表示される", () => {
    setupMatchMedia(500);

    const { container } = render(
      <MantineProvider>
        <ResponsiveLayout navigationConfig={mockNavConfig}>
          <div>コンテンツ</div>
        </ResponsiveLayout>
      </MantineProvider>
    );

    // ハンバーガーメニューボタンが存在することを確認
    const burgerButton =
      container.querySelector("button[data-burger]") ||
      container.querySelector(".mantine-Burger-root") ||
      screen.queryByRole("button", { name: /menu/i });
    expect(burgerButton).toBeTruthy();
  });

  test("デスクトップ（992px以上）ではサイドバーが表示される", () => {
    setupMatchMedia(1200);

    render(
      <MantineProvider>
        <ResponsiveLayout navigationConfig={mockNavConfig}>
          <div>コンテンツ</div>
        </ResponsiveLayout>
      </MantineProvider>
    );

    // サイドバー項目が表示されることを確認
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByText("プロフィール")).toBeInTheDocument();
  });

  test("タブレットサイズ（900px）でハンバーガーメニュー経由でナビゲーション項目にアクセス可能", async () => {
    setupMatchMedia(900);
    const user = userEvent.setup();

    const { container } = render(
      <MantineProvider>
        <ResponsiveLayout navigationConfig={mockNavConfig}>
          <div>コンテンツ</div>
        </ResponsiveLayout>
      </MantineProvider>
    );

    // ハンバーガーメニューボタンが表示されることを確認
    const burgerButton =
      container.querySelector("button[data-burger]") ||
      container.querySelector(".mantine-Burger-root") ||
      screen.queryByRole("button", { name: /menu/i });
    expect(burgerButton).toBeTruthy();

    // ハンバーガーメニューをクリック
    await user.click(burgerButton!);

    // ドロワー内の項目を確認
    const settingsInDrawer = await screen.findByText("設定");
    expect(settingsInDrawer).toBeInTheDocument();
  });
});
