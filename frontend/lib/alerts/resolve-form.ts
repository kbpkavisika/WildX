import { z } from "zod";
import { DISPOSITIONS } from "@/lib/enums";

export const resolveSchema = z.object({
  disposition: z.enum(DISPOSITIONS, "Choose an outcome"),
});

export type ResolveValues = z.infer<typeof resolveSchema>;
