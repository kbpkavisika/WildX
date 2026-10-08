"use client";

import { DispatchForm } from "@/components/dispatch/dispatch-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { SOURCE_TYPES, type Severity } from "@/lib/enums";
import { SEVERITY_DISPLAY, toSeverityFilter } from "@/lib/incidents/mappers";
import type { TriageAction } from "@/lib/incidents/store";
import { ALL, type IncidentDetailView } from "@/lib/incidents/types";
import { DismissForm } from "./dismiss-form";

interface TriagePanelProps {
  view: IncidentDetailView;
  openAction: TriageAction | null;
  severitySaving: boolean;
  severityError: Error | null;
  dismissSaving: boolean;
  dismissError: Error | null;
  onSeverityChange: (severity: Severity) => void;
  onOpenAction: (action: TriageAction | null) => void;
  onDismiss: (reason: string) => void;
  onDispatched: () => void;
}

export function TriagePanel(props: TriagePanelProps) {
  const { view, openAction, onOpenAction } = props;

  const changeSeverity = (value: string) => {
    const severity = toSeverityFilter(value);
    if (severity !== ALL) props.onSeverityChange(severity);
  };

  if (!view.canChangeSeverity && !view.canDispatchOrDismiss) {
    return <p className="m-0 text-body text-ink-muted">This incident is closed.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {view.canChangeSeverity && (
        <Field label="Severity" error={props.severityError ? apiErrorMessage(props.severityError) : undefined}>
          <select
            value={view.severity}
            disabled={props.severitySaving}
            onChange={(event) => changeSeverity(event.target.value)}
            className={fieldClass(!!props.severityError)}
          >
            {Object.entries(SEVERITY_DISPLAY).map(([value, display]) => (
              <option key={value} value={value}>{display.label}</option>
            ))}
          </select>
        </Field>
      )}
      {view.canDispatchOrDismiss && openAction === null && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onOpenAction("dispatch")} className="h-10 px-[18px]">Dispatch responder</Button>
          <SecondaryButton onClick={() => onOpenAction("dismiss")}>Dismiss incident</SecondaryButton>
        </div>
      )}
      {view.canDispatchOrDismiss && openAction === "dispatch" && (
        <DispatchForm
          source={{ type: SOURCE_TYPES.INCIDENT, id: view.id }}
          position={view.position}
          onDispatched={props.onDispatched}
          onCancel={() => onOpenAction(null)}
        />
      )}
      {view.canDispatchOrDismiss && openAction === "dismiss" && (
        <DismissForm
          saving={props.dismissSaving}
          error={props.dismissError}
          onSubmit={props.onDismiss}
          onCancel={() => onOpenAction(null)}
        />
      )}
    </div>
  );
}
