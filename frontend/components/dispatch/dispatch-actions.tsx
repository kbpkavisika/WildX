"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { Button, SecondaryButton } from "@/components/ui/button";
import type { DispatchResponse } from "@/lib/api/dispatches";
import { apiErrorMessage } from "@/lib/api/client";
import type { TaskAction } from "@/lib/dispatch/store";
import type { DispatchView } from "@/lib/dispatch/types";
import { CompleteForm } from "./complete-form";
import { DeclineForm } from "./decline-form";

interface DispatchActionsProps {
  view: DispatchView;
  openAction: TaskAction | null;
  onOpenAction: (action: TaskAction | null) => void;
  acknowledge: UseMutationResult<DispatchResponse, Error, void>;
  complete: UseMutationResult<DispatchResponse, Error, string>;
  decline: UseMutationResult<DispatchResponse, Error, string | null>;
}

const FULL = "h-12 w-full justify-center disabled:opacity-60";

export function DispatchActions({ view, openAction, onOpenAction, acknowledge, complete, decline }: DispatchActionsProps) {
  const close = () => onOpenAction(null);

  if (openAction === "complete") {
    return (
      <CompleteForm
        saving={complete.isPending}
        error={complete.error}
        onSubmit={(outcome) => complete.mutate(outcome, { onSuccess: close })}
        onCancel={close}
      />
    );
  }

  if (openAction === "decline") {
    return (
      <DeclineForm
        saving={decline.isPending}
        error={decline.error}
        onSubmit={(reason) => decline.mutate(reason, { onSuccess: close })}
        onCancel={close}
      />
    );
  }

  if (!view.canAcknowledge && !view.canComplete && !view.canDecline) return null;

  return (
    <div className="flex flex-col gap-3">
      {acknowledge.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(acknowledge.error)}</p>}
      {view.canAcknowledge && (
        <Button onClick={() => acknowledge.mutate()} disabled={acknowledge.isPending} className={FULL}>
          {acknowledge.isPending ? "Acknowledging…" : "Acknowledge"}
        </Button>
      )}
      {view.canComplete && (
        <Button onClick={() => onOpenAction("complete")} className={FULL}>Complete</Button>
      )}
      {view.canDecline && (
        <SecondaryButton onClick={() => onOpenAction("decline")} className={FULL}>Decline</SecondaryButton>
      )}
    </div>
  );
}
