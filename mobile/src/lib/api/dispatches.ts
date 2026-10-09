import { z } from "zod";
import { DISPATCH_STATUSES, SOURCE_TYPES } from "@/lib/enums";
import { apiGet, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const dispatchSchema = z.object({
  id: z.number(),
  sourceType: z.enum(SOURCE_TYPES),
  sourceId: z.number(),
  assignedByName: z.string().nullable(),
  status: z.enum(DISPATCH_STATUSES),
  assignedAt: timestamp,
  acknowledgedAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  outcome: z.string().nullable(),
  note: z.string().nullable(),
});

export type DispatchResponse = z.infer<typeof dispatchSchema>;

export function fetchMyDispatches(): Promise<DispatchResponse[]> {
  return apiGet("/me/dispatches", z.array(dispatchSchema));
}

export function fetchDispatch(id: number): Promise<DispatchResponse> {
  return apiGet(`/dispatches/${id}`, dispatchSchema);
}

export function acknowledgeDispatch(id: number): Promise<DispatchResponse> {
  return apiPost(`/dispatches/${id}/acknowledge`, {}, dispatchSchema);
}

export function completeDispatch(id: number, outcome: string): Promise<DispatchResponse> {
  return apiPost(`/dispatches/${id}/complete`, { outcome }, dispatchSchema);
}

export function declineDispatch(id: number, reason: string | null): Promise<DispatchResponse> {
  return apiPost(`/dispatches/${id}/decline`, { reason }, dispatchSchema);
}
