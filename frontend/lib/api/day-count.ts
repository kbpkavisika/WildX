import { z } from "zod";

export const dayCountSchema = z.object({
  date: z.iso.date(),
  count: z.number(),
});
