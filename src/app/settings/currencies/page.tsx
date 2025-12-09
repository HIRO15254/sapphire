import { redirect } from "next/navigation";

import { CurrencyListContainer } from "@/features/currencies/containers/CurrencyListContainer";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "通貨管理 - Sapphire",
  description: "ポーカーで使用する通貨を管理します",
};

export default async function CurrenciesPage() {
  // 認証チェック
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <HydrateClient>
      <CurrencyListContainer />
    </HydrateClient>
  );
}
