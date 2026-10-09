import type { DeviceResponse } from "@/lib/api/devices";
import type { ZoneResponse } from "@/lib/api/zones";
import { DEVICE_TYPES } from "@/lib/enums";
import { ZONE_TYPE_LABELS } from "@/lib/zones/labels";

export interface PickOption {
  value: string;
  label: string;
}

export function toCollarOptions(devices: DeviceResponse[]): PickOption[] {
  return devices
    .filter((device) => device.type === DEVICE_TYPES.COLLAR)
    .map((device) => ({ value: device.code, label: device.animal ? `${device.code} · ${device.animal.name}` : device.code }));
}

export function toCameraOptions(devices: DeviceResponse[]): PickOption[] {
  return devices.filter((device) => device.type === DEVICE_TYPES.CAMERA).map((device) => ({ value: device.code, label: device.code }));
}

export function toZoneOptions(zones: ZoneResponse[]): PickOption[] {
  return zones.map((zone) => ({ value: String(zone.id), label: `${zone.name} · ${ZONE_TYPE_LABELS[zone.type]}` }));
}
