import { Accuracy, getCurrentPositionAsync, getLastKnownPositionAsync, requestForegroundPermissionsAsync } from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { GPS_TIMEOUT_MS, RECENT_FIX_MS } from "@/lib/constants";
import type { LatLng } from "@/lib/geo";
import { useTracker } from "@/lib/tracking/store";

export type GpsStatus = "locating" | "found" | "failed";

function timeout(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

async function currentPosition(): Promise<LatLng | null> {
  const recent = useTracker.getState().fix;
  if (recent && Date.now() - recent.at < RECENT_FIX_MS) return recent.position;
  const permission = await requestForegroundPermissionsAsync();
  if (!permission.granted) return null;
  const location =
    (await Promise.race([getCurrentPositionAsync({ accuracy: Accuracy.High }).catch(() => null), timeout(GPS_TIMEOUT_MS)]))
    ?? (await getLastKnownPositionAsync().catch(() => null));
  return location ? [location.coords.latitude, location.coords.longitude] : null;
}

export function useGpsFix(onFix: (position: LatLng) => void) {
  const [status, setStatus] = useState<GpsStatus>("locating");
  const onFixRef = useRef(onFix);

  useEffect(() => {
    onFixRef.current = onFix;
  });

  const locate = useCallback(() => {
    void currentPosition().then((position) => {
      if (!position) {
        setStatus("failed");
        return;
      }
      setStatus("found");
      onFixRef.current(position);
    });
  }, []);

  const request = useCallback(() => {
    setStatus("locating");
    locate();
  }, [locate]);

  useEffect(() => {
    locate();
  }, [locate]);

  return { status, retry: request };
}
