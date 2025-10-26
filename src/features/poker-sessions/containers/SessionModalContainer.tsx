"use client";

import { SessionModal } from "@/features/poker-sessions/components/SessionModal";
import { SessionFormContainer } from "@/features/poker-sessions/containers/SessionFormContainer";
import { useSessionModal } from "@/features/poker-sessions/hooks/useSessionModal";

export interface SessionModalContainerProps {
  trigger: (props: { onClick: () => void }) => React.ReactNode;
  title?: string;
}

/**
 * SessionModalとSessionFormContainerを統合したContainer
 *
 * @remarks
 * - モーダルの開閉状態を管理
 * - トリガー要素（ボタンなど）を受け取り、クリック時にモーダルを開く
 * - セッション保存成功時にモーダルを閉じる
 */
export function SessionModalContainer({
  trigger,
  title = "新規セッション",
}: SessionModalContainerProps) {
  const { opened, open, close } = useSessionModal();

  return (
    <>
      {trigger({ onClick: open })}
      <SessionModal opened={opened} onClose={close} title={title}>
        <SessionFormContainer onSuccess={close} onCancel={close} />
      </SessionModal>
    </>
  );
}
