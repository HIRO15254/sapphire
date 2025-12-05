"use client";

import type { Session } from "next-auth";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppLayoutContainer } from "./AppLayoutContainer";

interface LayoutClientWrapperProps {
  /** メインコンテンツ */
  children: ReactNode;
  /** 認証セッション情報（null の場合は未認証） */
  session: Session | null;
}

/**
 * レイアウトのクライアントサイドラッパー
 *
 * 責務:
 * - 現在のパスに基づいてAppShellを表示するかどうかを判定
 * - 認証状態に基づいてレイアウトを切り替え
 *
 * FR-005: サイドバーは認証済みユーザーにのみ表示
 * FR-016: /auth/signin, /auth/signup はサイドバーなしで表示
 */
export function LayoutClientWrapper({ children, session }: LayoutClientWrapperProps) {
  const pathname = usePathname();

  // 認証ページかどうかを判定
  const isAuthPage = pathname.startsWith("/auth");
  // オフラインページかどうかを判定
  const isOfflinePage = pathname === "/offline";

  // 認証ページ、オフラインページ、未認証の場合はサイドバーなし
  const shouldShowAppShell = session && !isAuthPage && !isOfflinePage;

  if (shouldShowAppShell) {
    return <AppLayoutContainer session={session}>{children}</AppLayoutContainer>;
  }

  // サイドバーなしのシンプルなレイアウト
  return <>{children}</>;
}
