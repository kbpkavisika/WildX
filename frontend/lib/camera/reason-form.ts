import { z } from "zod";

const REASON_MAX_LENGTH = 500;

export const reasonSchema = z.object({
  reason: z.string().trim().min(1, "Enter a reason").max(REASON_MAX_LENGTH, `Keep it under ${REASON_MAX_LENGTH} characters`),
});

export type ReasonValues = z.infer<typeof reasonSchema>;

export const EMPTY_REASON: ReasonValues = { reason: "" };
