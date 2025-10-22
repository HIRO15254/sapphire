import { redirect } from "next/navigation";

import { SessionsPage } from "@/features/poker-sessions/pages/SessionsPage";
import { auth } from "@/server/auth";
import { HydrateClient, api } from "@/trpc/server";

export default async function Page() {
  // 認証チェック
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // サーバーサイドでデータ取得
  const sessions = await api.sessions.getAll();

  return (
    <HydrateClient>
      <SessionsPage initialSessions={sessions} />
    </HydrateClient>
  );
}
