"use client";

import { Button, Group, Modal, NumberInput, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { CurrencyList } from "../components/CurrencyList";
import { useCurrencies, useDeleteCurrency, useUpdateCurrencyBalance } from "../hooks/useCurrencies";
import { CurrencyFormContainer } from "./CurrencyFormContainer";

export function CurrencyListContainer() {
  const { currencies, isLoading } = useCurrencies();
  const deleteCurrency = useDeleteCurrency();
  const updateBalance = useUpdateCurrencyBalance();

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [balanceOpened, { open: openBalance, close: closeBalance }] = useDisclosure(false);

  const [selectedCurrency, setSelectedCurrency] = useState<{
    id: number;
    name: string;
    prefix: string;
    balance: number;
    _count: { games: number };
  } | null>(null);

  const [balanceValue, setBalanceValue] = useState<number | string>(0);

  const handleEdit = (id: number) => {
    const currency = currencies.find((c) => c.id === id);
    if (currency) {
      setSelectedCurrency(currency);
      openEdit();
    }
  };

  const handleDelete = (id: number) => {
    const currency = currencies.find((c) => c.id === id);
    if (currency) {
      setSelectedCurrency(currency);
      openDelete();
    }
  };

  const handleUpdateBalance = (id: number) => {
    const currency = currencies.find((c) => c.id === id);
    if (currency) {
      setSelectedCurrency(currency);
      setBalanceValue(currency.balance);
      openBalance();
    }
  };

  const confirmUpdateBalance = async () => {
    if (!selectedCurrency) return;

    const numericBalance = typeof balanceValue === "string" ? Number.parseFloat(balanceValue) : balanceValue;
    if (Number.isNaN(numericBalance)) {
      notifications.show({
        title: "エラー",
        message: "有効な数値を入力してください",
        color: "red",
      });
      return;
    }

    try {
      await updateBalance.mutateAsync({ id: selectedCurrency.id, balance: numericBalance });
      notifications.show({
        title: "保有量を更新しました",
        message: `「${selectedCurrency.name}」の保有量を${numericBalance.toLocaleString()}に更新しました`,
        color: "green",
      });
      closeBalance();
      setSelectedCurrency(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      notifications.show({
        title: "保有量の更新に失敗しました",
        message,
        color: "red",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedCurrency) return;

    try {
      await deleteCurrency.mutateAsync({ id: selectedCurrency.id });
      notifications.show({
        title: "通貨を削除しました",
        message: `「${selectedCurrency.name}」を削除しました`,
        color: "green",
      });
      closeDelete();
      setSelectedCurrency(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      notifications.show({
        title: "通貨の削除に失敗しました",
        message,
        color: "red",
      });
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>通貨管理</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
          通貨を追加
        </Button>
      </Group>

      <CurrencyList
        currencies={currencies}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateBalance={handleUpdateBalance}
      />

      {/* 新規作成モーダル */}
      <Modal opened={createOpened} onClose={closeCreate} title="通貨を追加" centered>
        <CurrencyFormContainer mode="create" onSuccess={closeCreate} onCancel={closeCreate} />
      </Modal>

      {/* 編集モーダル */}
      <Modal opened={editOpened} onClose={closeEdit} title="通貨を編集" centered>
        {selectedCurrency && (
          <CurrencyFormContainer
            mode="edit"
            currencyId={selectedCurrency.id}
            initialValues={{ name: selectedCurrency.name, prefix: selectedCurrency.prefix }}
            onSuccess={() => {
              closeEdit();
              setSelectedCurrency(null);
            }}
            onCancel={closeEdit}
          />
        )}
      </Modal>

      {/* 削除確認モーダル */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="通貨を削除" centered>
        <Stack gap="md">
          <Text>「{selectedCurrency?.name}」を削除しますか？</Text>
          {selectedCurrency && selectedCurrency._count.games > 0 && (
            <Text c="red" size="sm">
              この通貨は{selectedCurrency._count.games}
              件のゲームで使用されているため削除できません。
            </Text>
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeDelete}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={deleteCurrency.isPending}
              disabled={selectedCurrency ? selectedCurrency._count.games > 0 : false}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 保有量編集モーダル */}
      <Modal opened={balanceOpened} onClose={closeBalance} title="保有量を編集" centered>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            「{selectedCurrency?.name}」の保有量を更新します
          </Text>
          <NumberInput
            label="保有量"
            value={balanceValue}
            onChange={setBalanceValue}
            decimalScale={2}
            thousandSeparator=","
            allowNegative
            size="md"
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeBalance}>
              キャンセル
            </Button>
            <Button color="teal" onClick={confirmUpdateBalance} loading={updateBalance.isPending}>
              更新
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
