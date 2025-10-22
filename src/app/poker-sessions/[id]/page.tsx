import { notFound, redirect } from "next/navigation";

import { SessionDetailPage } from "@/features/poker-sessions/pages/SessionDetailPage";
import { auth } from "@/server/auth";
import { HydrateClient, api } from "@/trpc/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  // 認証チェック
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // パラメータ取得
  const { id } = await params;
  const sessionId = Number.parseInt(id, 10);

  // サーバーサイドでデータ取得
  const pokerSession = await api.sessions.getById({ id: sessionId });

  // セッションが見つからない、または他のユーザーのセッション
  if (!pokerSession) {
    notFound();
  }

  return (
    <HydrateClient>
      <SessionDetailPage session={pokerSession} />
    </HydrateClient>
  );
}
