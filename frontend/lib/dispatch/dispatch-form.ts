import { z } from "zod";
import type { DispatchCreateRequest } from "@/lib/api/dispatches";
import type { SourceType } from "@/lib/enums";

const NOTE_MAX_LENGTH = 1000;

export const dispatchFormSchema = z.object({
  responderId: z.string().min(1, "Choose a ranger"),
  note: z.string().trim().max(NOTE_MAX_LENGTH, `Keep it under ${NOTE_MAX_LENGTH} characters`),
});

export type DispatchFormValues = z.infer<typeof dispatchFormSchema>;

export const EMPTY_DISPATCH: DispatchFormValues = { responderId: "", note: "" };

export interface DispatchSource {
  type: SourceType;
  id: number;
}

export function toDispatchRequest(source: DispatchSource, values: DispatchFormValues): DispatchCreateRequest {
  return {
    sourceType: source.type,
    sourceId: source.id,
    responderId: Number(values.responderId),
    note: values.note === "" ? null : values.note,
  };
}
