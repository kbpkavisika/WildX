"use client";

import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IncidentFacts } from "@/components/incidents/incident-facts";
import { TriagePanel } from "@/components/incidents/triage-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useIncidentDetail } from "@/hooks/use-incident-detail";
import { apiErrorMessage } from "@/lib/api/client";
import { useIncidentDetailPage } from "@/lib/incidents/store";

const LocationPicker = dynamic(() => import("@/components/incidents/location-picker"), { ssr: false });

export default function IncidentDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const { isPending, error, view, photoUrl, photoError, sectors, severity, dismiss } = useIncidentDetail(id);
  const { dismissingId, setDismissingId } = useIncidentDetailPage();
  const setDismissOpen = (open: boolean) => setDismissingId(open ? id : null);

  return (
    <>
      <Link href="/dashboard/incidents" className="inline-flex items-center gap-1.5 self-start text-field-label text-ink-body hover:text-ink">
        <ArrowLeft className="size-4" strokeWidth={1.8} />
        Incidents
      </Link>
      {isPending && <p className="text-body text-ink-muted">Loading incident…</p>}
      {error && <p className="text-body text-negative">{apiErrorMessage(error)}</p>}
      {view && (
        <>
          <PageHeader
            title={view.title}
            badge={<Chip tone={view.status.tone}>{view.status.label}</Chip>}
            subtitle={view.subtitle}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <Card label="Location">
              <CardTitle>Location</CardTitle>
              <LocationPicker value={view.position} sectors={sectors} />
            </Card>
            <Card label="Triage">
              <CardTitle>Triage</CardTitle>
              <TriagePanel
                severity={view.severity}
                canChangeSeverity={view.canChangeSeverity}
                canDismiss={view.canDismiss}
                severitySaving={severity.isPending}
                severityError={severity.error}
                onSeverityChange={(value) => severity.mutate(value)}
                dismissOpen={dismissingId === id}
                dismissSaving={dismiss.isPending}
                dismissError={dismiss.error}
                onDismissOpen={setDismissOpen}
                onDismiss={(reason) => dismiss.mutate(reason, { onSuccess: () => setDismissOpen(false) })}
              />
            </Card>
            <Card label="Details" className="lg:col-span-2">
              <CardTitle>Details</CardTitle>
              <IncidentFacts facts={view.facts} hasPhoto={view.hasPhoto} photoUrl={photoUrl} photoError={photoError} />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
