import type { DeviceResponse } from "@/lib/api/devices";
import { COORDINATE_DECIMALS, LOW_BATTERY_PCT, NOT_REPORTING_FACTOR } from "@/lib/constants";
import { DEVICE_TYPES, type DeviceType } from "@/lib/enums";
import { formatDayTime } from "@/lib/format";
import type { ChipView } from "@/lib/incidents/types";
import { DEVICE_FILTERS, type DeviceFilter, type DeviceFilterOption, type DeviceRow, type DevicesView } from "./types";

const NO_VALUE = "—";
const MS_PER_MINUTE = 60_000;

const TYPE_LABELS: Record<DeviceType, string> = {
  [DEVICE_TYPES.COLLAR]: "Collar",
  [DEVICE_TYPES.CAMERA]: "Camera",
};

const FILTER_LABELS: Record<DeviceFilter, string> = {
  [DEVICE_FILTERS.ALL]: "All",
  [DEVICE_FILTERS.COLLAR]: "Collars",
  [DEVICE_FILTERS.CAMERA]: "Cameras",
};

const HEALTH = {
  reporting: { tone: "positive", label: "Reporting" },
  lowBattery: { tone: "negative", label: "Low battery" },
  notReporting: { tone: "negative", label: "Not reporting" },
  noData: { tone: "neutral", label: "No data yet" },
} satisfies Record<string, ChipView>;

function healthOf(device: DeviceResponse, now: Date): ChipView {
  if (!device.lastSeenAt) return HEALTH.noData;
  const silentMs = now.getTime() - new Date(device.lastSeenAt).getTime();
  if (silentMs > NOT_REPORTING_FACTOR * device.expectedIntervalMin * MS_PER_MINUTE) return HEALTH.notReporting;
  if (device.batteryPct !== null && device.batteryPct < LOW_BATTERY_PCT) return HEALTH.lowBattery;
  return HEALTH.reporting;
}

function placeOf(device: DeviceResponse): Pick<DeviceRow, "place" | "placeCaption"> {
  if (device.type === DEVICE_TYPES.COLLAR) {
    return device.animal ? { place: device.animal.name, placeCaption: device.animal.species } : { place: "No animal", placeCaption: "" };
  }
  if (device.lat === null || device.lng === null) return { place: NO_VALUE, placeCaption: "Camera location" };
  return { place: `${device.lat.toFixed(COORDINATE_DECIMALS)}, ${device.lng.toFixed(COORDINATE_DECIMALS)}`, placeCaption: "Camera location" };
}

function toDeviceRow(device: DeviceResponse, now: Date): DeviceRow {
  return {
    id: device.id,
    code: device.code,
    kind: TYPE_LABELS[device.type],
    ...placeOf(device),
    interval: `${device.expectedIntervalMin} min`,
    battery: device.batteryPct === null ? NO_VALUE : `${device.batteryPct}%`,
    lastSeen: device.lastSeenAt ? formatDayTime(new Date(device.lastSeenAt), now) : "Never",
    health: healthOf(device, now),
  };
}

function matches(device: DeviceResponse, filter: DeviceFilter): boolean {
  return filter === DEVICE_FILTERS.ALL || device.type === filter;
}

function filterOptions(devices: DeviceResponse[]): DeviceFilterOption[] {
  return Object.values(DEVICE_FILTERS).map((value) => ({
    value,
    label: FILTER_LABELS[value],
    count: devices.filter((device) => matches(device, value)).length,
  }));
}

export function toDevicesView(devices: DeviceResponse[], filter: DeviceFilter, now: Date): DevicesView {
  return {
    rows: devices.filter((device) => matches(device, filter)).map((device) => toDeviceRow(device, now)),
    filters: filterOptions(devices),
    collarCount: devices.filter((device) => device.type === DEVICE_TYPES.COLLAR).length,
    cameraCount: devices.filter((device) => device.type === DEVICE_TYPES.CAMERA).length,
    attentionCount: devices.filter((device) => healthOf(device, now).tone === "negative").length,
  };
}
