import { MantineProvider } from "@mantine/core";
import { IconHome, IconUsers } from "@tabler/icons-react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { FooterNavigation } from "./components/FooterNavigation";
import type { NavigationItem } from "./types";

// ロケーション確認用のテストコンポーネント
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
}

// モックの設定
const mockNavItems: NavigationItem[] = [
  { id: "home", label: "ホーム", path: "/", icon: IconHome },
  { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
];

describe("FooterNavigation - ルーティング機能テスト", () => {
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

  test("フッターナビゲーションの項目をクリックするとルーティングが動作する", async () => {
    setupMatchMedia(375); // モバイル
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <MantineProvider>
          <FooterNavigation items={mockNavItems} />
          <LocationDisplay />
        </MantineProvider>
      </MemoryRouter>
    );

    // 現在の位置が / であることを確認
    expect(screen.getByTestId("current-location")).toHaveTextContent("/");

    // ユーザー項目をクリック
    const usersLink = screen.getByText("ユーザー");
    expect(usersLink).toBeInTheDocument();

    await user.click(usersLink);

    // URLが /users に変更されることを期待
    expect(screen.getByTestId("current-location")).toHaveTextContent("/users");
  });

  test("ホーム項目をクリックするとホームページに遷移する", async () => {
    setupMatchMedia(375); // モバイル
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/users"]}>
        <MantineProvider>
          <FooterNavigation items={mockNavItems} />
          <LocationDisplay />
        </MantineProvider>
      </MemoryRouter>
    );

    // 現在の位置が /users であることを確認
    expect(screen.getByTestId("current-location")).toHaveTextContent("/users");

    // ホーム項目をクリック
    const homeLink = screen.getByText("ホーム");
    expect(homeLink).toBeInTheDocument();

    await user.click(homeLink);

    // URLが / に変更されることを期待
    expect(screen.getByTestId("current-location")).toHaveTextContent("/");
  });

  test("フッターナビゲーション項目にLinkコンポーネントが適用されている", () => {
    setupMatchMedia(375); // モバイル

    render(
      <MemoryRouter>
        <MantineProvider>
          <FooterNavigation items={mockNavItems} />
        </MantineProvider>
      </MemoryRouter>
    );

    // Link要素（a要素）が正しく生成されていることを確認
    const homeElement = screen.getByText("ホーム").closest("a");
    const usersElement = screen.getByText("ユーザー").closest("a");

    console.log("Home element tag:", homeElement?.tagName);
    console.log("Users element tag:", usersElement?.tagName);

    // 修正後はa要素（Link）として機能することを確認
    expect(homeElement).toBeInTheDocument();
    expect(usersElement).toBeInTheDocument();

    // href属性が正しく設定されていることを確認
    expect(homeElement).toHaveAttribute("href", "/");
    expect(usersElement).toHaveAttribute("href", "/users");
  });
});
