import { TaskList } from "@/components/dispatch/task-list";
import { PageHeader } from "@/components/ui/page-header";
import { Screen } from "@/components/ui/screen";
import { useMyTasks } from "@/hooks/use-my-tasks";

export default function RangerTasksScreen() {
  const { dispatches, incidents, refreshing, refetch } = useMyTasks();

  return (
    <Screen refreshing={refreshing} onRefresh={() => void refetch()}>
      <PageHeader title="Tasks" subtitle="Dispatches sent to you and incidents you reported." />
      <TaskList title="My dispatches" {...dispatches} emptyText="No dispatches yet." />
      <TaskList title="My incidents" {...incidents} emptyText="You have not reported any incidents." />
    </Screen>
  );
}
