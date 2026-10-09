"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { ChoiceRow } from "@/components/forms/choice-row";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import type { SimulationResponse } from "@/lib/api/simulator";
import {
  collarResultText,
  collarSimulationSchema,
  EMPTY_COLLAR_SIMULATION,
  needsZone,
  SCENARIO_OPTIONS,
  type CollarSimulationValues,
} from "@/lib/simulator/forms";
import type { PickOption } from "@/lib/simulator/mappers";
import { SimulationResult } from "./simulation-result";

interface CollarSimulationFormProps {
  collars: PickOption[];
  zones: PickOption[];
  send: UseMutationResult<SimulationResponse, Error, CollarSimulationValues>;
}

export function CollarSimulationForm({ collars, zones, send }: CollarSimulationFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CollarSimulationValues>({
    resolver: zodResolver(collarSimulationSchema),
    defaultValues: EMPTY_COLLAR_SIMULATION,
  });
  const scenario = useWatch({ control, name: "scenario" });

  return (
    <Card label="Collar fixes" className="flex-[3_1_420px]">
      <CardTitle>Collar fixes</CardTitle>
      <form noValidate aria-label="Send collar fixes" onSubmit={handleSubmit((values) => send.mutate(values))} className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <Field label="Collar" error={errors.collarCode?.message}>
            <select {...register("collarCode")} aria-invalid={!!errors.collarCode} className={fieldClass(!!errors.collarCode)}>
              <option value="">Choose a collar</option>
              {collars.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          {needsZone(scenario) ? (
            <Field label="Zone" error={errors.zoneId?.message}>
              <select {...register("zoneId")} aria-invalid={!!errors.zoneId} className={fieldClass(!!errors.zoneId)}>
                <option value="">Choose a zone</option>
                {zones.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Latitude" error={errors.lat?.message}>
                <input {...register("lat")} inputMode="decimal" placeholder="e.g. 6.3700" aria-invalid={!!errors.lat} className={fieldClass(!!errors.lat)} />
              </Field>
              <Field label="Longitude" error={errors.lng?.message}>
                <input {...register("lng")} inputMode="decimal" placeholder="e.g. 81.4300" aria-invalid={!!errors.lng} className={fieldClass(!!errors.lng)} />
              </Field>
            </>
          )}
        </div>
        {collars.length === 0 && <p className="m-0 text-caption text-ink-muted">No collars yet. Register one on the Devices page.</p>}
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1.5 p-0 text-field-label text-ink-body">Scenario</legend>
          {SCENARIO_OPTIONS.map((option) => (
            <ChoiceRow key={option.value} label={option.label} caption={option.caption} value={option.value} {...register("scenario")} />
          ))}
        </fieldset>
        <SimulationResult result={send.data ? collarResultText(send.data) : null} error={send.isError ? apiErrorMessage(send.error) : null}>
          <Button type="submit" disabled={send.isPending} className="h-10 px-[18px] disabled:opacity-60">
            {send.isPending ? "Sending…" : "Send fixes"}
          </Button>
        </SimulationResult>
      </form>
    </Card>
  );
}
