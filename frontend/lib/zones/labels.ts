import { ZONE_TYPES, type ZoneType } from "@/lib/enums";

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  [ZONE_TYPES.FARMLAND]: "Farmland",
  [ZONE_TYPES.ROAD]: "Road",
  [ZONE_TYPES.VILLAGE_BUFFER]: "Village buffer",
  [ZONE_TYPES.RESTRICTED]: "Restricted",
};
