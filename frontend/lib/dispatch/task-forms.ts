import { z } from "zod";

const TEXT_MAX_LENGTH = 1000;

export const DISPATCH_OUTCOMES = [
  "Resolved on site",
  "Evidence collected",
  "Handed to police",
  "Nothing found",
] as const;

const maxText = z.string().trim().max(TEXT_MAX_LENGTH, `Keep it under ${TEXT_MAX_LENGTH} characters`);

export const completeSchema = z.object({
  outcome: z.string().refine((value) => DISPATCH_OUTCOMES.some((outcome) => outcome === value), "Choose an outcome"),
  note: maxText,
});

export type CompleteValues = z.infer<typeof completeSchema>;

export const EMPTY_COMPLETE: CompleteValues = { outcome: "", note: "" };

export function toOutcomeText(values: CompleteValues): string {
  return values.note === "" ? values.outcome : `${values.outcome} · ${values.note}`;
}

export const declineSchema = z.object({ reason: maxText });

export type DeclineValues = z.infer<typeof declineSchema>;

export const EMPTY_DECLINE: DeclineValues = { reason: "" };
