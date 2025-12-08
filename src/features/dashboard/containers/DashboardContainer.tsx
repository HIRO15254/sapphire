"use client";

import { Center, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { IconLayoutDashboard } from "@tabler/icons-react";

import { DashboardStats } from "@/features/dashboard/components/DashboardStats";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentSessions } from "@/features/dashboard/components/RecentSessions";
import { api } from "@/trpc/react";

/**
 * ダッシュボードコンテナ
 *
 * 責務:
 * - tRPCを使用して統計情報と最近のセッションを取得
 * - ローディング状態とエラー状態の管理
 * - 子コンポーネントにデータを渡す
 * - コンパクトなレイアウト
 */
export function DashboardContainer() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = api.sessions.getStats.useQuery();
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = api.sessions.getAll.useQuery();

  const isLoading = statsLoading || sessionsLoading;
  const error = statsError || sessionsError;

  if (isLoading) {
    return (
      <Center h={300}>
        <Stack align="center" gap="sm">
          <Loader size="md" />
          <Text c="dimmed" size="sm">
            データを読み込み中...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h={300}>
        <Stack align="center" gap="sm">
          <Title order={4} c="red">
            エラーが発生しました
          </Title>
          <Text c="dimmed" size="sm">
            {error.message}
          </Text>
        </Stack>
      </Center>
    );
  }

  // 最近のセッションを最大5件取得
  const recentSessions = (sessions ?? []).slice(0, 5).map((session) => ({
    id: session.id,
    date: session.date,
    location: session.location,
    profit: session.profit,
    durationMinutes: session.durationMinutes,
  }));

  return (
    <Stack gap="md">
      <Group gap="xs" align="center">
        <IconLayoutDashboard size={24} />
        <Title order={3}>ダッシュボード</Title>
      </Group>

      <DashboardStats
        totalProfit={stats?.totalProfit ?? 0}
        sessionCount={stats?.sessionCount ?? 0}
        avgProfit={stats?.avgProfit ?? 0}
        totalDurationMinutes={stats?.totalDurationMinutes ?? 0}
        totalProfitBB={stats?.totalProfitBB}
        avgProfitBB={stats?.avgProfitBB}
        sessionsWithGameCount={stats?.sessionsWithGameCount ?? 0}
      />

      <QuickActions />

      <RecentSessions sessions={recentSessions} maxCount={5} />
    </Stack>
  );
}
