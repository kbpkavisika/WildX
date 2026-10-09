"use client";

import { Map as MapIcon } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { StatusDot } from "@/components/ui/status-dot";
import { useAlertActions } from "@/hooks/use-alert-actions";
import { apiErrorMessage } from "@/lib/api/client";
import { useAlertsPage } from "@/lib/alerts/store";
import type { AlertRow, RangerAlertDetail, RangerAlertsView } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";
import { ResolveForm } from "./resolve-form";

type AlertActions = ReturnType<typeof useAlertActions>;

const FULL = "h-12 w-full justify-center disabled:opacity-60";
const MAPS_LINK = "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-line bg-card px-4 text-label text-ink hover:bg-surface-muted";

function RangerActions({ detail, actions }: { detail: RangerAlertDetail; actions: AlertActions }) {
  const { action, setAction, setNotice } = useAlertsPage();
  const { acknowledge, resolve } = actions;
  const acknowledging = acknowledge.isPending && acknowledge.variables === detail.id;

  if (action === "resolve" && detail.canResolve) {
    return (
      <ResolveForm
        stacked
        saving={resolve.isPending}
        onSubmit={(disposition) => resolve.mutate({ id: detail.id, disposition }, { onSuccess: () => setNotice("Alert resolved.") })}
        onCancel={() => setAction(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {detail.canAcknowledge && (
        <Button onClick={() => acknowledge.mutate(detail.id)} disabled={acknowledging} className={FULL}>
          {acknowledging ? "Acknowledging…" : "Acknowledge"}
        </Button>
      )}
      {detail.canResolve && <SecondaryButton onClick={() => setAction("resolve")} className={FULL}>Resolve</SecondaryButton>}
      {detail.mapsUrl && (
        <a href={detail.mapsUrl} target="_blank" rel="noopener noreferrer" className={MAPS_LINK}>
          <MapIcon className="size-[18px]" strokeWidth={1.8} />
          Open in maps
        </a>
      )}
    </div>
  );
}

function RangerAlertItem({ row, detail, actions }: { row: AlertRow; detail: RangerAlertDetail | null; actions: AlertActions }) {
  const toggle = useAlertsPage((state) => state.toggle);
  const open = detail !== null;
  return (
    <div className={cn("rounded-lg", open && "bg-surface-sunken")}>
      <button
        aria-expanded={open}
        onClick={() => toggle(row.id)}
        className={cn("flex min-h-12 w-full cursor-pointer flex-col gap-1.5 rounded-lg p-3 text-left", !open && "hover:bg-surface-muted")}
      >
        <span className="text-label text-ink">{row.title}</span>
        <span className="text-caption text-ink-muted">{row.caption}</span>
        <span className="inline-flex items-center gap-2.5">
          <Chip tone={row.severity.tone}>{row.severity.label}</Chip>
          <StatusDot tone={row.status.tone}>{row.status.label}</StatusDot>
        </span>
      </button>
      {detail && (
        <div className="flex flex-col gap-3.5 px-3 pt-1 pb-3">
          <FactList facts={detail.facts} />
          <RangerActions detail={detail} actions={actions} />
        </div>
      )}
    </div>
  );
}

function actionError({ acknowledge, resolve }: AlertActions, selectedId: number | null): Error | null {
  if (acknowledge.isError && acknowledge.variables === selectedId) return acknowledge.error;
  if (resolve.isError && resolve.variables?.id === selectedId) return resolve.error;
  return null;
}

export function RangerAlertList({ view }: { view: RangerAlertsView }) {
  const selectedId = useAlertsPage((state) => state.selectedId);
  const notice = useAlertsPage((state) => state.notice);
  const actions = useAlertActions();
  const error = actionError(actions, selectedId);

  return (
    <Card label="Open alerts" className="px-4 py-4">
      <CardTitle>Open alerts</CardTitle>
      {notice && <p role="status" className="m-0 text-body text-positive">{notice}</p>}
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      {view.rows.length === 0 ? (
        <p className="m-0 text-body text-ink-muted">No open alerts. You will be notified when one is raised.</p>
      ) : (
        <div className="-mx-2 flex flex-col gap-1">
          {view.rows.map((row) => (
            <RangerAlertItem key={row.id} row={row} detail={view.selected?.id === row.id ? view.selected : null} actions={actions} />
          ))}
        </div>
      )}
    </Card>
  );
}
