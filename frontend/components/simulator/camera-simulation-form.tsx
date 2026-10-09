"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import type { SimulationResponse } from "@/lib/api/simulator";
import {
  cameraResultText,
  cameraSimulationSchema,
  EMPTY_CAMERA_SIMULATION,
  IMAGE_COUNTS,
  type CameraSimulationValues,
} from "@/lib/simulator/forms";
import type { PickOption } from "@/lib/simulator/mappers";
import { SimulationResult } from "./simulation-result";

interface CameraSimulationFormProps {
  cameras: PickOption[];
  send: UseMutationResult<SimulationResponse, Error, CameraSimulationValues>;
}

export function CameraSimulationForm({ cameras, send }: CameraSimulationFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CameraSimulationValues>({
    resolver: zodResolver(cameraSimulationSchema),
    defaultValues: EMPTY_CAMERA_SIMULATION,
  });

  return (
    <Card label="Camera images" className="flex-[2_1_340px]">
      <CardTitle>Camera images</CardTitle>
      <form noValidate aria-label="Send camera images" onSubmit={handleSubmit((values) => send.mutate(values))} className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          <Field label="Camera" error={errors.cameraCode?.message}>
            <select {...register("cameraCode")} aria-invalid={!!errors.cameraCode} className={fieldClass(!!errors.cameraCode)}>
              <option value="">Choose a camera</option>
              {cameras.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Images">
            <select {...register("count")} className={fieldClass(false)}>
              {IMAGE_COUNTS.map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </Field>
        </div>
        {cameras.length === 0 && <p className="m-0 text-caption text-ink-muted">No cameras yet. Register one on the Devices page.</p>}
        <p className="m-0 text-caption text-ink-muted">Placeholder images 20 s apart, ending now. They arrive as one burst waiting for review.</p>
        <SimulationResult result={send.data ? cameraResultText(send.data) : null} error={send.isError ? apiErrorMessage(send.error) : null}>
          <Button type="submit" disabled={send.isPending} className="h-10 px-[18px] disabled:opacity-60">
            {send.isPending ? "Sending…" : "Send images"}
          </Button>
        </SimulationResult>
      </form>
    </Card>
  );
}
