import { z } from "zod";
import type { CameraSimulationRequest, CollarSimulationRequest, SimulationResponse } from "@/lib/api/simulator";
import { isLatitude, isLongitude, LATITUDE_ERROR, LONGITUDE_ERROR } from "@/lib/devices/device-form";
import { counted } from "@/lib/devices/mappers";
import { SIMULATION_SCENARIOS, type SimulationScenario } from "@/lib/enums";

const DEFAULT_IMAGE_COUNT = "3";
export const IMAGE_COUNTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

export const SCENARIO_OPTIONS: { value: SimulationScenario; label: string; caption: string }[] = [
  { value: SIMULATION_SCENARIOS.WALK_INTO_ZONE, label: "Walk into zone", caption: "Six fixes over 25 min, ending inside the zone." },
  { value: SIMULATION_SCENARIOS.NIGHT_WALK_INTO_ZONE, label: "Night walk into zone", caption: "The same walk between 18:00 and 06:00. Severity goes up one level." },
  { value: SIMULATION_SCENARIOS.SINGLE_FIX, label: "Single fix", caption: "One fix at the position below." },
  { value: SIMULATION_SCENARIOS.LOW_BATTERY, label: "Low battery", caption: "One fix with the battery at 10%. Device health is checked every minute." },
  { value: SIMULATION_SCENARIOS.NOT_MOVING, label: "Not moving", caption: "Seven hourly fixes within 30 m over 6 h. Raises a critical mortality alert within a minute, unless the collar moved in that time." },
  { value: SIMULATION_SCENARIOS.DUPLICATE, label: "Duplicate fix", caption: "The same fix sent twice. The second one is ignored." },
];

const ZONE_SCENARIOS = new Set<SimulationScenario>([SIMULATION_SCENARIOS.WALK_INTO_ZONE, SIMULATION_SCENARIOS.NIGHT_WALK_INTO_ZONE]);

export function needsZone(scenario: SimulationScenario): boolean {
  return ZONE_SCENARIOS.has(scenario);
}

export const collarSimulationSchema = z
  .object({
    collarCode: z.string().min(1, "Choose a collar"),
    scenario: z.enum(SIMULATION_SCENARIOS),
    zoneId: z.string(),
    lat: z.string().trim(),
    lng: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (needsZone(values.scenario)) {
      if (values.zoneId === "") ctx.addIssue({ code: "custom", path: ["zoneId"], message: "Choose a zone" });
      return;
    }
    if (!isLatitude(values.lat)) ctx.addIssue({ code: "custom", path: ["lat"], message: LATITUDE_ERROR });
    if (!isLongitude(values.lng)) ctx.addIssue({ code: "custom", path: ["lng"], message: LONGITUDE_ERROR });
  });

export type CollarSimulationValues = z.infer<typeof collarSimulationSchema>;

export const EMPTY_COLLAR_SIMULATION: CollarSimulationValues = {
  collarCode: "",
  scenario: SIMULATION_SCENARIOS.WALK_INTO_ZONE,
  zoneId: "",
  lat: "",
  lng: "",
};

export function toCollarSimulationRequest(values: CollarSimulationValues): CollarSimulationRequest {
  const zone = needsZone(values.scenario);
  return {
    collarCode: values.collarCode,
    scenario: values.scenario,
    zoneId: zone ? Number(values.zoneId) : null,
    lat: zone ? null : Number(values.lat),
    lng: zone ? null : Number(values.lng),
  };
}

export const cameraSimulationSchema = z.object({
  cameraCode: z.string().min(1, "Choose a camera"),
  count: z.enum(IMAGE_COUNTS),
});

export type CameraSimulationValues = z.infer<typeof cameraSimulationSchema>;

export const EMPTY_CAMERA_SIMULATION: CameraSimulationValues = { cameraCode: "", count: DEFAULT_IMAGE_COUNT };

export function toCameraSimulationRequest(values: CameraSimulationValues): CameraSimulationRequest {
  return { cameraCode: values.cameraCode, count: Number(values.count) };
}

export function collarResultText(result: SimulationResponse): string {
  return `Sent ${counted(result.sent, "fix", "fixes")} · ${result.stored} stored · ${counted(result.duplicates, "duplicate", "duplicates")}.`;
}

export function cameraResultText(result: SimulationResponse): string {
  return `Sent ${counted(result.sent, "image", "images")} · ${result.stored} stored.`;
}
