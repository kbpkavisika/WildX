"use client";

import { TaskList } from "@/components/dispatch/task-list";
import { PageHeader } from "@/components/layout/page-header";
import { useMyTasks } from "@/hooks/use-my-tasks";

export default function RangerTasksPage() {
  const { dispatches, incidents } = useMyTasks();

  return (
    <>
      <PageHeader title="Tasks" subtitle="Dispatches sent to you and incidents you reported." />
      <TaskList title="My dispatches" {...dispatches} emptyText="No dispatches yet." />
      <TaskList title="My incidents" {...incidents} emptyText="You have not reported any incidents." />
    </>
  );
}
