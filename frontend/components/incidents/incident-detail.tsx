"use client";

import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { IncidentFacts } from "@/components/incidents/incident-facts";
import { TriagePanel } from "@/components/incidents/triage-panel";
import { QuietButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useIncidentDetail } from "@/hooks/use-incident-detail";
import { apiErrorMessage } from "@/lib/api/client";
import { useIncidentDetailPage, type TriageAction } from "@/lib/incidents/store";

const LocationPicker = dynamic(() => import("@/components/incidents/location-picker"), { ssr: false });

interface IncidentDetailProps {
  id: number;
  onClose?: () => void;
  className?: string;
}

export function IncidentDetail({ id, onClose, className }: IncidentDetailProps) {
  const { isPending, error, view, photoUrl, photoError, sectors, severity, dismiss, refresh } = useIncidentDetail(id);
  const { open, openAction, close } = useIncidentDetailPage();
  const action = open?.incidentId === id ? open.action : null;
  const setAction = (next: TriageAction | null) => (next === null ? close() : openAction(id, next));

  return (
    <Card label="Incident detail" className={className}>
      {isPending && <p className="m-0 text-body text-ink-muted">Loading incident…</p>}
      {error && <p className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      {view && (
        <>
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 grow flex-col gap-1.5">
              <span className="inline-flex flex-wrap items-center gap-2.5">
                <CardTitle>{view.title}</CardTitle>
                <Chip tone={view.status.tone}>{view.status.label}</Chip>
              </span>
              <span className="text-caption text-ink-muted">{view.subtitle}</span>
            </div>
            {onClose && (
              <QuietButton aria-label="Close" onClick={onClose} className="px-0">
                <X />
              </QuietButton>
            )}
          </div>
          <TriagePanel
            view={view}
            openAction={action}
            severitySaving={severity.isPending}
            severityError={severity.error}
            dismissSaving={dismiss.isPending}
            dismissError={dismiss.error}
            onSeverityChange={(value) => severity.mutate(value)}
            onOpenAction={setAction}
            onDismiss={(reason) => dismiss.mutate(reason, { onSuccess: close })}
            onDispatched={() => {
              close();
              void refresh();
            }}
          />
          <LocationPicker value={view.position} sectors={sectors} />
          <IncidentFacts facts={view.facts} hasPhoto={view.hasPhoto} photoUrl={photoUrl} photoError={photoError} />
        </>
      )}
    </Card>
  );
}
