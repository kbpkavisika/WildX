"use client";

import { TriangleAlert } from "lucide-react";
import { TaskList } from "@/components/dispatch/task-list";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { useMyPatrols } from "@/hooks/use-my-patrols";

export default function RangerPatrolsPage() {
  const patrols = useMyPatrols();

  return (
    <>
      <PageHeader title="Patrols" subtitle="Today's assigned patrols." />
      <ButtonLink href="/ranger/incident/new" className="w-full justify-center">
        <TriangleAlert className="size-5" strokeWidth={1.8} />
        Report incident
      </ButtonLink>
      <TaskList title="Today's patrols" {...patrols} emptyText="No patrols assigned for today." />
    </>
  );
}
