"use client";

import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DispatchActions } from "@/components/dispatch/dispatch-actions";
import { IncidentFacts } from "@/components/incidents/incident-facts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { useDispatchTask } from "@/hooks/use-dispatch-task";
import { apiErrorMessage } from "@/lib/api/client";
import { useDispatchTaskPage, type TaskAction } from "@/lib/dispatch/store";

const LocationPicker = dynamic(() => import("@/components/incidents/location-picker"), { ssr: false });

export default function DispatchTaskPage() {
  const id = Number(useParams<{ id: string }>().id);
  const { isPending, error, view, incident, photoUrl, photoError, sectors, acknowledge, complete, decline } = useDispatchTask(id);
  const { open, openAction, close } = useDispatchTaskPage();
  const action = open?.dispatchId === id ? open.action : null;
  const setAction = (next: TaskAction | null) => (next === null ? close() : openAction(id, next));

  return (
    <>
      <Link href="/ranger/tasks" className="inline-flex min-h-12 items-center gap-1.5 self-start text-field-label text-ink-body">
        <ArrowLeft className="size-4" strokeWidth={1.8} />
        Tasks
      </Link>
      {isPending && <p className="m-0 text-body text-ink-muted">Loading dispatch…</p>}
      {error && <p className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      {view && (
        <>
          <PageHeader title={view.title} badge={<Chip tone={view.status.tone}>{view.status.label}</Chip>} />
          <FactList facts={view.facts} />
          <DispatchActions
            view={view}
            openAction={action}
            onOpenAction={setAction}
            acknowledge={acknowledge}
            complete={complete}
            decline={decline}
          />
          {incident && (
            <>
              <Card label="Location" className="px-4 py-4">
                <CardTitle>Location</CardTitle>
                <LocationPicker value={incident.position} sectors={sectors} />
              </Card>
              <Card label="Incident" className="px-4 py-4">
                <CardTitle>Incident</CardTitle>
                <IncidentFacts facts={incident.facts} hasPhoto={incident.hasPhoto} photoUrl={photoUrl} photoError={photoError} />
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
