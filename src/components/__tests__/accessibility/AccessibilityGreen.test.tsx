import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { BrowserRouter } from "react-router-dom";
import { LiveRegion } from "../../accessibility/LiveRegion";
import { SkipLink } from "../../accessibility/SkipLink";
import { HeaderNavigation } from "../../layout/ResponsiveLayout/components/HeaderNavigation";
import { SideNavigation } from "../../layout/ResponsiveLayout/components/SideNavigation";
import { ResponsiveLayout } from "../../layout/ResponsiveLayout/ResponsiveLayout";

// Setup jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock navigation data
const mockNavigationItems = [
  { id: "1", label: "Home", href: "/", path: "/", icon: () => <div>Home</div> },
  { id: "2", label: "About", href: "/about", path: "/about", icon: () => <div>About</div> },
  { id: "3", label: "Contact", href: "/contact", path: "/contact", icon: () => <div>Contact</div> },
];

const mockGroupedItems = {
  default: mockNavigationItems,
};

const mockNavigationConfig = {
  primary: mockNavigationItems,
  secondary: mockNavigationItems,
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <MantineProvider>{children}</MantineProvider>
  </BrowserRouter>
);

describe("Accessibility Tests - Green Phase (Implementation Working)", () => {
  // TC-302-GREEN-001: Skip Link Implementation
  describe("Skip Link Implementation (GREEN)", () => {
    test("Skip link component renders correctly", () => {
      render(
        <TestWrapper>
          <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>
        </TestWrapper>
      );

      const skipLink = screen.getByRole("link", { name: /メインコンテンツにスキップ/ });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute("href", "#main-content");
    });
  });

  // TC-302-GREEN-002: Live Regions Implementation
  describe("Live Regions Implementation (GREEN)", () => {
    test("Live region component renders correctly", () => {
      render(
        <TestWrapper>
          <LiveRegion message="テストメッセージ" />
        </TestWrapper>
      );

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
      expect(liveRegion).toHaveTextContent("テストメッセージ");
    });
  });

  // TC-302-GREEN-003: ARIA Attributes Enhancement
  describe("ARIA Attributes Enhancement (GREEN)", () => {
    test("HeaderNavigation has proper ARIA labels", () => {
      render(
        <TestWrapper>
          <HeaderNavigation
            items={mockNavigationItems}
            isMobile={false}
            hamburgerOpened={false}
            onHamburgerToggle={() => {}}
          />
        </TestWrapper>
      );

      const nav = screen.getByRole("navigation", { name: "メインナビゲーション" });
      expect(nav).toBeInTheDocument();

      const menubar = screen.getByRole("menubar");
      expect(menubar).toBeInTheDocument();
    });

    test("SideNavigation has proper ARIA attributes", () => {
      render(
        <TestWrapper>
          <SideNavigation
            items={mockNavigationItems}
            groupedItems={mockGroupedItems}
            collapsed={false}
          />
        </TestWrapper>
      );

      const nav = screen.getByRole("navigation", { name: "サイドナビゲーション" });
      expect(nav).toBeInTheDocument();

      // Check for navigation links (SideNavigation uses link semantics, not menu semantics)
      const navLinks = screen.getAllByRole("link");
      expect(navLinks.length).toBeGreaterThan(0);

      // Verify each link has proper aria-label
      navLinks.forEach((link) => {
        expect(link).toHaveAttribute("aria-label");
      });
    });
  });

  // TC-302-GREEN-004: ResponsiveLayout Integration
  describe("ResponsiveLayout Accessibility Integration (GREEN)", () => {
    test("ResponsiveLayout includes skip links and live regions", () => {
      render(
        <TestWrapper>
          <ResponsiveLayout navigationConfig={mockNavigationConfig}>
            <div>Test content</div>
          </ResponsiveLayout>
        </TestWrapper>
      );

      // Check for skip link
      const skipLink = screen.getByRole("link", { name: /メインコンテンツにスキップ/ });
      expect(skipLink).toBeInTheDocument();

      // Check for live regions (there may be multiple from different components)
      const liveRegions = screen.getAllByRole("status");
      expect(liveRegions.length).toBeGreaterThan(0);

      // Verify at least one live region has aria-live
      const liveRegion = liveRegions.find((region) => region.hasAttribute("aria-live"));
      expect(liveRegion).toBeDefined();

      // Check for main content with proper attributes
      const mainContent = screen.getByRole("main", { name: "メインコンテンツ" });
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute("id", "main-content");
      expect(mainContent).toHaveAttribute("tabIndex", "-1");
    });
  });

  // TC-302-GREEN-005: Basic axe-core Tests (Should Pass)
  describe("Basic axe-core Tests (GREEN)", () => {
    test("Skip link has no accessibility violations", async () => {
      const { container } = render(
        <TestWrapper>
          <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test("Live region has no accessibility violations", async () => {
      const { container } = render(
        <TestWrapper>
          <LiveRegion message="テスト" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
