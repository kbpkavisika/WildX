"use client";

import { SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import type { Severity } from "@/lib/enums";
import { SEVERITY_DISPLAY, toSeverityFilter } from "@/lib/incidents/mappers";
import { ALL } from "@/lib/incidents/types";
import { DismissForm } from "./dismiss-form";

interface TriagePanelProps {
  severity: Severity;
  canChangeSeverity: boolean;
  canDismiss: boolean;
  severitySaving: boolean;
  severityError: Error | null;
  onSeverityChange: (severity: Severity) => void;
  dismissOpen: boolean;
  dismissSaving: boolean;
  dismissError: Error | null;
  onDismissOpen: (open: boolean) => void;
  onDismiss: (reason: string) => void;
}

export function TriagePanel(props: TriagePanelProps) {
  const changeSeverity = (value: string) => {
    const severity = toSeverityFilter(value);
    if (severity !== ALL) props.onSeverityChange(severity);
  };

  if (!props.canChangeSeverity && !props.canDismiss) {
    return <p className="m-0 text-body text-ink-muted">This incident is closed.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {props.canChangeSeverity && (
        <Field label="Severity" error={props.severityError ? apiErrorMessage(props.severityError) : undefined}>
          <select
            value={props.severity}
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
      {props.canDismiss && !props.dismissOpen && (
        <SecondaryButton onClick={() => props.onDismissOpen(true)} className="self-start">
          Dismiss incident
        </SecondaryButton>
      )}
      {props.canDismiss && props.dismissOpen && (
        <DismissForm
          saving={props.dismissSaving}
          error={props.dismissError}
          onSubmit={props.onDismiss}
          onCancel={() => props.onDismissOpen(false)}
        />
      )}
    </div>
  );
}
