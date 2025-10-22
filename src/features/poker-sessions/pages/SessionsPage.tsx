"use client";

import { Button, Container, Divider, Group, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LocationStats } from "@/features/poker-sessions/components/LocationStats";
import { SessionFilters } from "@/features/poker-sessions/components/SessionFilters";
import { SessionList } from "@/features/poker-sessions/components/SessionList";
import { SessionStats } from "@/features/poker-sessions/components/SessionStats";
import { api } from "@/trpc/react";

interface SessionsPageProps {
  initialSessions: Array<{
    id: number;
    date: Date;
    location: string;
    buyIn: string;
    cashOut: string;
    durationMinutes: number;
    profit: number;
    notes: string | null;
  }>;
  initialStats: {
    totalProfit: number;
    sessionCount: number;
    avgProfit: number;
    byLocation: Array<{
      location: string;
      profit: number;
      count: number;
      avgProfit: number;
    }>;
  };
}

export function SessionsPage({ initialSessions, initialStats }: SessionsPageProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<{
    location?: string;
    startDate?: Date;
    endDate?: Date;
  } | null>(null);

  // Use filtered query if filters are active, otherwise use initial data
  const { data: filteredSessions } = api.sessions.getFiltered.useQuery(filters!, {
    enabled: filters !== null,
  });

  const deleteMutation = api.sessions.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "削除成功",
        message: "セッションを削除しました",
        color: "green",
      });
      router.refresh(); // Server Componentを再フェッチ
    },
    onError: (error) => {
      notifications.show({
        title: "削除失敗",
        message: error.message,
        color: "red",
      });
    },
  });

  const handleEdit = (id: number) => {
    router.push(`/poker-sessions/${id}/edit`);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("このセッションを削除してもよろしいですか？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleApplyFilters = (newFilters: {
    location?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(null);
  };

  // Use filtered data if available, otherwise use initial data
  const displaySessions = filters !== null && filteredSessions ? filteredSessions : initialSessions;

  // Extract unique locations from initial sessions for filter dropdown
  const uniqueLocations = Array.from(
    new Set(initialSessions.map((session) => session.location))
  ).sort();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={1}>ポーカーセッション</Title>
          <Button component={Link} href="/poker-sessions/new" leftSection={<IconPlus size={20} />}>
            新規セッション
          </Button>
        </Group>

        <SessionStats
          totalProfit={initialStats.totalProfit}
          sessionCount={initialStats.sessionCount}
          avgProfit={initialStats.avgProfit}
        />

        {initialStats.byLocation.length > 0 && (
          <LocationStats byLocation={initialStats.byLocation} />
        )}

        <Divider />

        <SessionFilters
          locations={uniqueLocations}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          isFiltering={filters !== null}
        />

        {filters !== null && (
          <Group justify="space-between">
            <Title order={4} c="dimmed">
              {displaySessions.length}件のセッションを表示中（全{initialSessions.length}件）
            </Title>
          </Group>
        )}

        <SessionList sessions={displaySessions} onEdit={handleEdit} onDelete={handleDelete} />
      </Stack>
    </Container>
  );
}
