"use client";

import type { SessionFormValues } from "@/features/poker-sessions/components/SessionForm";
import { SessionModal } from "@/features/poker-sessions/components/SessionModal";
import { SessionFormContainer } from "@/features/poker-sessions/containers/SessionFormContainer";
import { useSessionModal } from "@/features/poker-sessions/hooks/useSessionModal";

export interface SessionModalContainerProps {
  trigger: (props: { onClick: () => void }) => React.ReactNode;
  title?: string;
  sessionId?: number;
  initialValues?: Partial<SessionFormValues>;
  mode?: "create" | "edit";
}

/**
 * SessionModalとSessionFormContainerを統合したContainer
 *
 * @remarks
 * - モーダルの開閉状態を管理
 * - トリガー要素（ボタンなど）を受け取り、クリック時にモーダルを開く
 * - セッション保存成功時にモーダルを閉じる
 * - 新規作成モードと編集モードをサポート
 */
export function SessionModalContainer({
  trigger,
  title,
  sessionId,
  initialValues,
  mode = "create",
}: SessionModalContainerProps) {
  const { opened, open, close } = useSessionModal();

  const defaultTitle = mode === "edit" ? "セッション編集" : "新規セッション";
  const submitLabel = mode === "edit" ? "更新" : "保存";

  return (
    <>
      {trigger({ onClick: open })}
      <SessionModal opened={opened} onClose={close} title={title ?? defaultTitle}>
        <SessionFormContainer
          onSuccess={close}
          onCancel={close}
          sessionId={sessionId}
          initialValues={initialValues}
          submitLabel={submitLabel}
        />
      </SessionModal>
    </>
  );
}
