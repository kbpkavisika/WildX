import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ApiError } from "@/lib/api/client";
import { recordPoints, reportGps, type TrackPointRequest } from "@/lib/api/patrols";
import { GPS_INTERVAL_S, GPS_TIMEOUT_MS } from "@/lib/constants";
import { PATROL_STATUSES } from "@/lib/enums";
import { useTracker } from "@/lib/patrols/store";
import { shouldRecord, toGpsFix, toPointRequest, type GpsFix } from "@/lib/patrols/tracking";
import { useMyPatrols } from "./use-my-patrols";

const SERVER_ERROR = 500;
const MS_PER_SECOND = 1000;
const GPS_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 0 };

function isRejected(error: unknown): boolean {
  return error instanceof ApiError && error.status < SERVER_ERROR;
}

export function usePatrolTracker() {
  const queryClient = useQueryClient();
  const patrols = useMyPatrols();
  const patrolId = patrols.data?.find((patrol) => patrol.status === PATROL_STATUSES.ACTIVE)?.id ?? null;

  useEffect(() => {
    if (patrolId === null || !("geolocation" in navigator)) return;
    const { setFix, setGpsLost } = useTracker.getState();
    const queue: TrackPointRequest[] = [];
    let last: GpsFix | null = null;
    let sending = false;
    let lost = false;

    const flush = async () => {
      if (sending || queue.length === 0) return;
      sending = true;
      const batch = queue.slice();
      try {
        await recordPoints(patrolId, batch);
        queue.splice(0, batch.length);
        await queryClient.invalidateQueries({ queryKey: ["patrols", patrolId, "track"] });
      } catch (error) {
        if (isRejected(error)) queue.splice(0, batch.length);
      } finally {
        sending = false;
      }
    };

    const setLost = (next: boolean) => {
      if (lost === next) return;
      lost = next;
      setGpsLost(next);
      reportGps(patrolId, !next).catch(() => undefined);
    };

    const onFix = (position: GeolocationPosition) => {
      const fix = toGpsFix(position, Date.now());
      setFix(fix);
      setLost(false);
      if (shouldRecord(last, fix)) {
        last = fix;
        queue.push(toPointRequest(fix));
      }
      void flush();
    };

    const onError = () => setLost(true);

    const watchId = navigator.geolocation.watchPosition(onFix, onError, GPS_OPTIONS);
    const timer = setInterval(() => navigator.geolocation.getCurrentPosition(onFix, onError, GPS_OPTIONS), GPS_INTERVAL_S * MS_PER_SECOND);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(timer);
      void flush();
      setFix(null);
      setGpsLost(false);
    };
  }, [patrolId, queryClient]);
}
