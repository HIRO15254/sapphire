"use client";

import { useDisclosure } from "@mantine/hooks";

/**
 * セッションモーダルの開閉状態を管理するhook
 *
 * @returns {Object} モーダル制御用のオブジェクト
 * @returns {boolean} opened - モーダルが開いているかどうか
 * @returns {function} open - モーダルを開く関数
 * @returns {function} close - モーダルを閉じる関数
 */
export function useSessionModal() {
  const [opened, { open, close }] = useDisclosure(false);

  return {
    opened,
    open,
    close,
  };
}
