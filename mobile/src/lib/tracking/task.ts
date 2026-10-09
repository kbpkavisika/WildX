import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { recordPoints } from "@/lib/api/patrols";
import { colors } from "@/lib/theme";
import { TRACKING_DISTANCE_M, TRACKING_UPDATE_MS } from "@/lib/constants";
import type { WaypointType } from "@/lib/enums";
import { shouldRecord, toGpsFix, toPointRequest, type GpsFix } from "./sampling";
import { useTracker } from "./store";

const TRACKING_TASK = "wildx-patrol-tracking";

interface TrackingState {
  patrolId: number;
  last: GpsFix | null;
  floorAt: number;
}

const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  timeInterval: TRACKING_UPDATE_MS,
  distanceInterval: TRACKING_DISTANCE_M,
};

let foregroundWatch: Location.LocationSubscription | null = null;
let trackingState: TrackingState | null = null;

function readState(): TrackingState | null {
  return trackingState;
}

function writeState(state: TrackingState | null): void {
  trackingState = state;
}

export function recordLocations(locations: Location.LocationObject[]): void {
  const state = readState();
  const now = Date.now();
  for (const location of locations) {
    const fix = toGpsFix(location, now);
    useTracker.getState().setFix(fix);
    if (!state || fix.at <= state.floorAt || !shouldRecord(state.last, fix)) continue;
    recordPoints(state.patrolId, [toPointRequest(fix)]).catch(() => undefined);
    state.last = fix;
    state.floorAt = fix.at;
  }
  if (state) writeState(state);
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TRACKING_TASK, async ({ data, error }) => {
  if (error || !data) return;
  recordLocations(data.locations);
});

export async function recordWaypoint(fix: Pick<GpsFix, "position" | "accuracyM">, waypointType: WaypointType | null, note: string | null): Promise<number> {
  const state = readState();
  if (!state) throw new Error("Start the patrol before adding a waypoint.");
  const at = Math.max(Date.now(), state.floorAt + 1);
  await recordPoints(state.patrolId, [{ ...toPointRequest({ ...fix, at }), isWaypoint: true, note, waypointType }]);
  writeState({ ...state, floorAt: at });
  return at;
}

async function hasBackgroundPermission(): Promise<boolean> {
  const current = await Location.getBackgroundPermissionsAsync();
  if (current.granted) return true;
  return (await Location.requestBackgroundPermissionsAsync()).granted;
}

async function startBackgroundUpdates(): Promise<boolean> {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK)) return true;
    if (!(await hasBackgroundPermission())) return false;
    await Location.startLocationUpdatesAsync(TRACKING_TASK, {
      ...LOCATION_OPTIONS,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.Fitness,
      foregroundService: {
        notificationTitle: "Patrol in progress",
        notificationBody: "WildX is recording your patrol track.",
        notificationColor: colors.primary,
        killServiceOnDestroy: false,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function startForegroundWatch(): Promise<void> {
  if (foregroundWatch) return;
  foregroundWatch = await Location.watchPositionAsync(LOCATION_OPTIONS, (location) => recordLocations([location]));
}

export async function startTracking(patrolId: number, startedAt: number): Promise<boolean> {
  const state = readState();
  if (state?.patrolId !== patrolId) writeState({ patrolId, last: null, floorAt: startedAt });
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return false;
  if (!(await startBackgroundUpdates())) await startForegroundWatch();
  return true;
}

export async function stopTracking(): Promise<void> {
  writeState(null);
  foregroundWatch?.remove();
  foregroundWatch = null;
  useTracker.getState().setFix(null);
  if (await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TRACKING_TASK);
  }
}
