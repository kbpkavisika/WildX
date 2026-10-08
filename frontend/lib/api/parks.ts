import { z } from "zod";
import { apiGet } from "./client";

const sectorSchema = z.object({
  id: z.number(),
  name: z.string(),
  polygonGeojson: z.string(),
});

export type SectorResponse = z.infer<typeof sectorSchema>;

export function fetchSectors(parkId: number): Promise<SectorResponse[]> {
  return apiGet(`/parks/${parkId}/sectors`, z.array(sectorSchema));
}
