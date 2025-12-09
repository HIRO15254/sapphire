"use client";

import { useDisclosure } from "@mantine/hooks";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { AppLayout } from "../components/AppLayout";
import { Navbar } from "../components/Navbar";

interface AppLayoutContainerProps {
  /** メインコンテンツ */
  children: ReactNode;
  /** 認証セッション情報 */
  session: Session;
}

/**
 * AppLayoutのContainer コンポーネント
 *
 * 責務:
 * - モバイルのサイドバー開閉状態の管理
 * - 認証状態に基づくユーザー情報の提供
 * - ログアウト処理の実行
 * - モバイルナビゲーション時のサイドバー自動クローズ
 *
 * 注: デスクトップでは常にサイドバーが展開表示される（FR-001）
 */
export function AppLayoutContainer({ children, session }: AppLayoutContainerProps) {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const pathname = usePathname();

  // モバイルでページ遷移時にサイドバーを自動的に閉じる
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const handleNavigate = () => {
    // モバイルの場合、ナビゲーション後にサイドバーを閉じる
    closeMobile();
  };

  return (
    <AppLayout
      navbar={
        <Navbar
          userName={session.user?.name || undefined}
          userEmail={session.user?.email || undefined}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      }
      mobileOpened={mobileOpened}
      onMobileToggle={toggleMobile}
    >
      {children}
    </AppLayout>
  );
}
