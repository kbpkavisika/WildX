import { z } from "zod";
import { DISPATCH_STATUSES, SOURCE_TYPES, type SourceType } from "@/lib/enums";
import type { LatLng } from "@/lib/patrols/types";
import { apiGet, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const responderSchema = z.object({
  id: z.number(),
  name: z.string(),
  distanceM: z.number().nullable(),
  offline: z.boolean(),
  lastSeenAt: timestamp.nullable(),
});

const dispatchSchema = z.object({
  id: z.number(),
  sourceType: z.enum(SOURCE_TYPES),
  sourceId: z.number(),
  responderId: z.number(),
  responderName: z.string(),
  assignedByName: z.string().nullable(),
  status: z.enum(DISPATCH_STATUSES),
  assignedAt: timestamp,
  acknowledgedAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  outcome: z.string().nullable(),
  note: z.string().nullable(),
});

export type ResponderResponse = z.infer<typeof responderSchema>;
export type DispatchResponse = z.infer<typeof dispatchSchema>;

export interface DispatchCreateRequest {
  sourceType: SourceType;
  sourceId: number;
  responderId: number;
  note: string | null;
}

export function fetchResponders(position: LatLng | null): Promise<ResponderResponse[]> {
  const query = position ? `?lat=${position[0]}&lng=${position[1]}` : "";
  return apiGet(`/responders${query}`, z.array(responderSchema));
}

export function createDispatch(request: DispatchCreateRequest): Promise<DispatchResponse> {
  return apiPost("/dispatches", request, dispatchSchema);
}
