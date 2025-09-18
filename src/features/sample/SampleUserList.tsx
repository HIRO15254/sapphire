import { ActionIcon, Card, Table, Text, Title } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { SampleUser } from "./types";

interface SampleUserListProps {
  users: SampleUser[];
  onUserDeleted: (id: number) => void;
}

export function SampleUserList({ users, onUserDeleted }: SampleUserListProps) {
  const handleDeleteUser = (id: number) => {
    onUserDeleted(id);
  };

  return (
    <Card withBorder padding="lg">
      <Title order={3} mb="md">
        Sample Users ({users.length})
      </Title>
      {users.length > 0 ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.id}</Table.Td>
                <Table.Td>{user.name}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>{new Date(user.created_at).toLocaleDateString("ja-JP")}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    onClick={() => handleDeleteUser(user.id)}
                    aria-label={`Delete user ${user.name}`}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed">No users yet. Add one above!</Text>
      )}
    </Card>
  );
}
