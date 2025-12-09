import { notFound, redirect } from "next/navigation";

import { SessionDetailContainer } from "@/features/poker-sessions/containers/SessionDetailContainer";
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

  // 不正なID
  if (Number.isNaN(sessionId) || sessionId <= 0) {
    notFound();
  }

  // サーバーサイドでデータをプリフェッチ
  const pokerSession = await api.sessions.getById({ id: sessionId });

  // セッションが見つからない場合は404
  if (!pokerSession) {
    notFound();
  }

  return (
    <HydrateClient>
      <SessionDetailContainer sessionId={sessionId} />
    </HydrateClient>
  );
}
