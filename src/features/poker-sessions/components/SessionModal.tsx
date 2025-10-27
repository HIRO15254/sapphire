"use client";

import { Modal } from "@mantine/core";
import type { ReactNode } from "react";

export interface SessionModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * セッション追加・編集用のモーダルコンポーネント
 *
 * @remarks
 * - Mantine Modalコンポーネントをラップし、統一されたスタイルを提供
 * - FR-003: ESCキーとモーダル外クリックで閉じる
 * - レスポンシブ対応（デスクトップ・タブレット・モバイル）
 */
export function SessionModal({ opened, onClose, title, children }: SessionModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      closeOnClickOutside
      closeOnEscape
      centered
    >
      {children}
    </Modal>
  );
}
