"use client";

import { DispatchForm } from "@/components/dispatch/dispatch-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { StatusDot } from "@/components/ui/status-dot";
import { useAlertActions } from "@/hooks/use-alert-actions";
import { apiErrorMessage } from "@/lib/api/client";
import { useAlertsPage } from "@/lib/alerts/store";
import type { AlertDetailView } from "@/lib/alerts/types";
import { SOURCE_TYPES } from "@/lib/enums";
import { ResolveForm } from "./resolve-form";

function ActionButtons({ view }: { view: AlertDetailView }) {
  const setAction = useAlertsPage((state) => state.setAction);
  const { acknowledge } = useAlertActions();
  const acknowledging = acknowledge.isPending && acknowledge.variables === view.id;
  const acknowledgeError = acknowledge.isError && acknowledge.variables === view.id ? acknowledge.error : null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {view.canAcknowledge && (
          <Button onClick={() => acknowledge.mutate(view.id)} disabled={acknowledging} className="h-10 px-[18px] disabled:opacity-60">
            {acknowledging ? "Acknowledging…" : "Acknowledge"}
          </Button>
        )}
        {view.canResolve && <SecondaryButton onClick={() => setAction("resolve")}>Resolve</SecondaryButton>}
        {view.canDispatch && <SecondaryButton onClick={() => setAction("dispatch")}>Dispatch ranger</SecondaryButton>}
      </div>
      {acknowledgeError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(acknowledgeError)}</p>}
    </>
  );
}

function AlertActions({ view }: { view: AlertDetailView }) {
  const { action, notice, setAction, setNotice } = useAlertsPage();
  const { resolve, refresh } = useAlertActions();
  const resolveError = resolve.isError && resolve.variables?.id === view.id ? resolve.error : null;

  return (
    <>
      {notice && <p role="status" className="m-0 text-body text-positive">{notice}</p>}
      {action === null && <ActionButtons view={view} />}
      {action === "resolve" && view.canResolve && (
        <ResolveForm
          saving={resolve.isPending}
          onSubmit={(disposition) => resolve.mutate({ id: view.id, disposition }, { onSuccess: () => setAction(null) })}
          onCancel={() => setAction(null)}
        />
      )}
      {action === "dispatch" && view.canDispatch && (
        <DispatchForm
          source={{ type: SOURCE_TYPES.ALERT, id: view.id }}
          position={view.position}
          onDispatched={(dispatch) => {
            setNotice(`Dispatched to ${dispatch.responderName}.`);
            void refresh();
          }}
          onCancel={() => setAction(null)}
        />
      )}
      {resolveError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(resolveError)}</p>}
    </>
  );
}

export function AlertDetail({ view }: { view: AlertDetailView | null }) {
  if (!view) {
    return (
      <Card label="Alert detail">
        <p className="m-0 text-body text-ink-muted">Select an alert to see its detail.</p>
      </Card>
    );
  }

  return (
    <Card label="Alert detail">
      <div className="flex flex-col gap-2">
        <CardTitle>{view.title}</CardTitle>
        <span className="inline-flex flex-wrap items-center gap-2.5">
          <Chip tone={view.severity.tone}>{view.severity.label}</Chip>
          <StatusDot tone={view.status.tone}>{view.status.label}</StatusDot>
        </span>
      </div>
      <FactList facts={view.facts} />
      <AlertActions view={view} />
    </Card>
  );
}
