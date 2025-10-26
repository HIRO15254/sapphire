"use client";

import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

import type { SessionFormValues } from "@/features/poker-sessions/components/SessionForm";
import { SessionForm } from "@/features/poker-sessions/components/SessionForm";
import { api } from "@/trpc/react";

export interface SessionFormContainerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: Partial<SessionFormValues>;
  submitLabel?: string;
}

/**
 * SessionFormコンポーネントのContainer
 *
 * @remarks
 * - tRPC mutationを使用してセッションを作成
 * - 成功時にキャッシュを無効化してモーダルを閉じる
 * - エラー時に通知を表示
 */
export function SessionFormContainer({
  onSuccess,
  onCancel,
  initialValues,
  submitLabel = "保存",
}: SessionFormContainerProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const createSession = api.sessions.create.useMutation({
    onSuccess: async () => {
      // キャッシュ無効化
      await utils.sessions.getAll.invalidate();
      await utils.sessions.getStats.invalidate();

      notifications.show({
        title: "成功",
        message: "セッションを保存しました",
        color: "green",
      });

      onSuccess?.();
      router.refresh();
    },
    onError: (error) => {
      notifications.show({
        title: "エラー",
        message: error.message || "セッションの保存に失敗しました",
        color: "red",
      });
    },
  });

  const handleSubmit = (values: SessionFormValues) => {
    // Phase 2: location文字列をそのまま送信
    // Phase 3でlocationId/newLocationNameに対応予定
    createSession.mutate({
      date: values.date,
      // TODO Phase 3: locationId または newLocationName に変更
      newLocationName: values.location,
      buyIn: values.buyIn,
      cashOut: values.cashOut,
      durationMinutes: values.durationMinutes,
      notes: values.notes,
    });
  };

  return (
    <SessionForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={createSession.isPending}
      submitLabel={submitLabel}
    />
  );
}
