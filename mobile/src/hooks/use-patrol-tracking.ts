import { hasServicesEnabledAsync } from "expo-location";
import { useEffect } from "react";
import { reportGps } from "@/lib/api/patrols";
import { useSession } from "@/lib/auth/store";
import { GPS_CHECK_MS, GPS_LOST_MS } from "@/lib/constants";
import { useConnection } from "@/lib/outbox/store";
import { activePatrolOf } from "@/lib/patrols/mappers";
import { useTracker } from "@/lib/tracking/store";
import { startTracking, stopTracking } from "@/lib/tracking/task";
import { useMyPatrols } from "./use-my-patrols";

async function isGpsLost(sinceAt: number): Promise<boolean> {
  const enabled = await hasServicesEnabledAsync().catch(() => false);
  const lastAt = useTracker.getState().fix?.at ?? sinceAt;
  return !enabled || Date.now() - lastAt > GPS_LOST_MS;
}

export function usePatrolTracking() {
  const { patrols } = useMyPatrols();
  const userId = useSession((state) => state.user?.id ?? null);
  const active = patrols && activePatrolOf(patrols);
  const activeId = active?.id ?? null;
  const startedAt = active?.startedAt ? Date.parse(active.startedAt) : null;
  const loaded = patrols !== undefined;

  useEffect(() => {
    if (!loaded || userId === null) return;
    if (activeId === null) {
      void stopTracking();
      return;
    }
    void startTracking(activeId, userId, startedAt ?? Date.now()).then((granted) => {
      if (!granted) useTracker.getState().setGpsLost(true);
    });
  }, [loaded, activeId, userId, startedAt]);

  useEffect(() => {
    if (activeId === null) return;
    const watchingSince = Date.now();
    const check = setInterval(async () => {
      const lost = await isGpsLost(watchingSince);
      const { gpsLost, setGpsLost } = useTracker.getState();
      if (lost === gpsLost) return;
      setGpsLost(lost);
      if (useConnection.getState().online) reportGps(activeId, !lost).catch(() => undefined);
    }, GPS_CHECK_MS);
    return () => {
      clearInterval(check);
      useTracker.getState().setGpsLost(false);
    };
  }, [activeId]);
}
