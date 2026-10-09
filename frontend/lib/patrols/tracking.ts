import type { TrackPointRequest } from "@/lib/api/patrols";
import { GPS_INTERVAL_S, GPS_SAMPLE_METRES } from "@/lib/constants";
import { distanceM } from "./geo";
import type { LatLng } from "./types";

const MS_PER_SECOND = 1000;

export interface GpsFix {
  position: LatLng;
  accuracyM: number | null;
  at: number;
}

export function toGpsFix(position: GeolocationPosition, now: number): GpsFix {
  return {
    position: [position.coords.latitude, position.coords.longitude],
    accuracyM: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
    at: Math.min(position.timestamp, now),
  };
}

export function shouldRecord(last: GpsFix | null, next: GpsFix): boolean {
  return last === null
    || next.at - last.at >= GPS_INTERVAL_S * MS_PER_SECOND
    || distanceM(last.position, next.position) >= GPS_SAMPLE_METRES;
}

export function toPointRequest(fix: GpsFix): TrackPointRequest {
  return { lat: fix.position[0], lng: fix.position[1], accuracyM: fix.accuracyM, recordedAt: new Date(fix.at).toISOString() };
}
