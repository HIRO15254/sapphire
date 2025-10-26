import { formatCurrency } from "@/lib/utils/currency";
import { Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

export interface SessionCardProps {
  session: {
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
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function SessionCard({ session, onEdit, onDelete, showActions = true }: SessionCardProps) {
  const profitColor = session.profit > 0 ? "green" : session.profit < 0 ? "red" : "gray";
  const profitSign = session.profit > 0 ? "+" : "";

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}時間${mins}分`;
    }
    if (hours > 0) {
      return `${hours}時間`;
    }
    return `${mins}分`;
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text fw={600} size="lg">
              {session.location.name}
            </Text>
            <Text size="sm" c="dimmed">
              {formatDate(session.date)}
            </Text>
          </Stack>
          <Badge size="lg" color={profitColor} variant="filled">
            {profitSign}
            {formatCurrency(session.profit)}
          </Badge>
        </Group>

        <Group gap="xl">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              バイイン
            </Text>
            <Text fw={500}>{formatCurrency(Number.parseFloat(session.buyIn))}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              キャッシュアウト
            </Text>
            <Text fw={500}>{formatCurrency(Number.parseFloat(session.cashOut))}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              プレイ時間
            </Text>
            <Text fw={500}>{formatDuration(session.durationMinutes)}</Text>
          </Stack>
        </Group>

        {session.tags && session.tags.length > 0 && (
          <Group gap="xs">
            {session.tags.map((tag) => (
              <Badge key={tag.id} variant="light" size="sm">
                {tag.name}
              </Badge>
            ))}
          </Group>
        )}

        {session.notes && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {session.notes}
          </Text>
        )}

        {showActions && (
          <Group gap="xs">
            {onEdit && (
              <Button
                variant="light"
                size="sm"
                leftSection={<IconEdit size={16} />}
                onClick={() => onEdit(session.id)}
              >
                編集
              </Button>
            )}
            {onDelete && (
              <Button
                variant="light"
                color="red"
                size="sm"
                leftSection={<IconTrash size={16} />}
                onClick={() => onDelete(session.id)}
              >
                削除
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
}
