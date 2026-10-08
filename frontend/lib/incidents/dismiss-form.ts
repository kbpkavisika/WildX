import { z } from "zod";

const REASON_MAX_LENGTH = 1000;

export const dismissSchema = z.object({
  reason: z.string().trim().min(1, "Enter a reason").max(REASON_MAX_LENGTH, `Keep it under ${REASON_MAX_LENGTH} characters`),
});

export type DismissValues = z.infer<typeof dismissSchema>;

export const EMPTY_DISMISS: DismissValues = { reason: "" };
