import { formatCurrency } from "@/lib/utils/currency";
import { ActionIcon, Badge, Button, Card, Collapse, Group, Stack, Text } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconFileText,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";

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
  const [expanded, setExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
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
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        {/* コンパクト表示: 場所、日時、収支、展開ボタン */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600} size="md" truncate>
                {session.location.name}
              </Text>
              <Text size="xs" c="dimmed">
                {formatDate(session.date)} · {formatDuration(session.durationMinutes)}
              </Text>
            </Stack>
            <Badge size="lg" color={profitColor} variant="filled">
              {profitSign}
              {formatCurrency(session.profit)}
            </Badge>
          </Group>
          <ActionIcon
            variant="subtle"
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            aria-label={expanded ? "詳細を閉じる" : "詳細を表示"}
          >
            {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </ActionIcon>
        </Group>

        {/* 展開時の詳細表示 */}
        <Collapse in={expanded}>
          <Stack gap="md" pt="xs">
            <Group gap="xl" align="flex-start" wrap="wrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  バイイン
                </Text>
                <Text fw={500} size="sm">
                  {formatCurrency(Number.parseFloat(session.buyIn))}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  キャッシュアウト
                </Text>
                <Text fw={500} size="sm">
                  {formatCurrency(Number.parseFloat(session.cashOut))}
                </Text>
              </Stack>
              {session.tags && session.tags.length > 0 && (
                <Group gap="xs" style={{ flex: 1 }}>
                  {session.tags.map((tag) => (
                    <Badge key={tag.id} variant="light" size="sm">
                      {tag.name}
                    </Badge>
                  ))}
                </Group>
              )}
            </Group>

            {showActions && (
              <Group gap="xs">
                {session.notes && (
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<IconFileText size={16} />}
                    onClick={() => setNotesExpanded(!notesExpanded)}
                  >
                    {notesExpanded ? "メモを閉じる" : "メモを表示"}
                  </Button>
                )}
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

            {session.notes && (
              <Collapse in={notesExpanded}>
                <div
                  className="prose prose-sm max-w-none"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                  dangerouslySetInnerHTML={{ __html: session.notes }}
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    fontSize: "0.875rem",
                    color: "var(--mantine-color-dimmed)",
                  }}
                />
              </Collapse>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
