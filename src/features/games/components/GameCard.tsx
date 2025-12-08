import { formatBlinds, formatBuyInRange } from "@/lib/utils/game";
import { ActionIcon, Badge, Card, Group, Menu, Stack, Text } from "@mantine/core";
import { IconArchive, IconArchiveOff, IconDots, IconEdit, IconTrash } from "@tabler/icons-react";

interface GameCardProps {
  game: {
    id: number;
    name: string;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    minBuyIn: number;
    maxBuyIn: number;
    isArchived: boolean;
    location?: { id: number; name: string };
    currency: { id: number; name: string };
    _count: { sessions: number };
  };
  onEdit: (id: number) => void;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  onDelete: (id: number) => void;
}

export function GameCard({ game, onEdit, onArchive, onUnarchive, onDelete }: GameCardProps) {
  const canDelete = game._count.sessions === 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={500}>{game.name}</Text>
            {game.isArchived && (
              <Badge size="sm" color="gray">
                アーカイブ済み
              </Badge>
            )}
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(game.id)}>
                編集
              </Menu.Item>
              {game.isArchived ? (
                <Menu.Item
                  leftSection={<IconArchiveOff size={14} />}
                  onClick={() => onUnarchive(game.id)}
                >
                  アーカイブ解除
                </Menu.Item>
              ) : (
                <Menu.Item
                  leftSection={<IconArchive size={14} />}
                  onClick={() => onArchive(game.id)}
                >
                  アーカイブ
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                disabled={!canDelete}
                onClick={() => onDelete(game.id)}
              >
                削除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            ブラインド:
          </Text>
          <Text size="sm" fw={500}>
            {formatBlinds(game.smallBlind, game.bigBlind, game.ante)}
          </Text>
        </Group>

        <Group gap="xs">
          <Text size="sm" c="dimmed">
            バイイン:
          </Text>
          <Text size="sm">{formatBuyInRange(game.minBuyIn, game.maxBuyIn)}</Text>
        </Group>

        <Group gap="xs">
          <Text size="sm" c="dimmed">
            通貨:
          </Text>
          <Badge size="sm" variant="light">
            {game.currency.name}
          </Badge>
        </Group>

        {game.location && (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              店舗:
            </Text>
            <Text size="sm">{game.location.name}</Text>
          </Group>
        )}

        <Group gap="xs">
          <Text size="sm" c="dimmed">
            セッション数:
          </Text>
          <Text size="sm">{game._count.sessions}件</Text>
        </Group>
      </Stack>
    </Card>
  );
}
