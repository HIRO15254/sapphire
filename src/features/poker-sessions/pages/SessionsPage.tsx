"use client";

import { Button, Container, Divider, Group, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LocationStats } from "@/features/poker-sessions/components/LocationStats";
import { SessionFilters } from "@/features/poker-sessions/components/SessionFilters";
import { SessionList } from "@/features/poker-sessions/components/SessionList";
import { SessionModal } from "@/features/poker-sessions/components/SessionModal";
import { SessionStats } from "@/features/poker-sessions/components/SessionStats";
import { SessionFormContainer } from "@/features/poker-sessions/containers/SessionFormContainer";
import { SessionModalContainer } from "@/features/poker-sessions/containers/SessionModalContainer";
import { useSessionModal } from "@/features/poker-sessions/hooks/useSessionModal";
import { api } from "@/trpc/react";

interface SessionsPageProps {
  initialSessions: Array<{
    id: number;
    date: Date;
    location: {
      id: number;
      name: string;
    };
    buyIn: string;
    cashOut: string;
    durationMinutes: number;
    profit: number;
    tags: Array<{
      id: number;
      name: string;
    }>;
    notes: string | null;
  }>;
  initialStats: {
    totalProfit: number;
    sessionCount: number;
    avgProfit: number;
    byLocation: Array<{
      location: {
        id: number;
        name: string;
      };
      profit: number;
      count: number;
      avgProfit: number;
    }>;
  };
}

export function SessionsPage({ initialSessions, initialStats }: SessionsPageProps) {
  const router = useRouter();
  const { opened: editModalOpened, open: openEditModal, close: closeEditModal } = useSessionModal();
  const [filters, setFilters] = useState<{
    location?: string;
    tagIds?: number[];
    startDate?: Date;
    endDate?: Date;
  } | null>(null);
  const [editingSession, setEditingSession] = useState<
    SessionsPageProps["initialSessions"][0] | null
  >(null);

  // Fetch tags for filter dropdown
  const { data: tags = [] } = api.tags.getAll.useQuery({});

  // Open edit modal when editing session changes
  useEffect(() => {
    if (editingSession) {
      openEditModal();
    }
  }, [editingSession, openEditModal]);

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
    const session = displaySessions.find((s) => s.id === id);
    if (session) {
      setEditingSession(session);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("このセッションを削除してもよろしいですか？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleApplyFilters = (newFilters: {
    location?: string;
    tagIds?: number[];
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
    new Set(initialSessions.map((session) => session.location.name))
  ).sort();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={1}>ポーカーセッション</Title>
          <SessionModalContainer
            trigger={({ onClick }) => (
              <Button onClick={onClick} leftSection={<IconPlus size={20} />}>
                新規セッション
              </Button>
            )}
            title="新規セッション"
          />
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
          tags={tags}
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

        {editingSession && (
          <SessionModal
            opened={editModalOpened}
            onClose={() => {
              closeEditModal();
              setEditingSession(null);
            }}
            title="セッション編集"
          >
            <SessionFormContainer
              sessionId={editingSession.id}
              initialValues={{
                date: editingSession.date,
                location: editingSession.location.name,
                buyIn: Number.parseFloat(editingSession.buyIn),
                cashOut: Number.parseFloat(editingSession.cashOut),
                durationMinutes: editingSession.durationMinutes,
                tags: editingSession.tags.map((tag) => tag.name),
                notes: editingSession.notes ?? undefined,
              }}
              onSuccess={() => {
                closeEditModal();
                setEditingSession(null);
              }}
              onCancel={() => {
                closeEditModal();
                setEditingSession(null);
              }}
              submitLabel="更新"
            />
          </SessionModal>
        )}
      </Stack>
    </Container>
  );
}
