import { redirect } from "next/navigation";

import { NewSessionPage } from "@/features/poker-sessions/pages/NewSessionPage";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export default async function Page() {
  // 認証チェック
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <HydrateClient>
      <NewSessionPage />
    </HydrateClient>
  );
}
