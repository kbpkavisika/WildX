import { useCallback, useEffect, useRef, useState } from "react";
import { GPS_TIMEOUT_MS } from "@/lib/constants";
import type { LatLng } from "@/lib/patrols/types";

export type GpsStatus = "locating" | "found" | "failed";

export function useGpsFix(onFix: (position: LatLng) => void) {
  const [status, setStatus] = useState<GpsStatus>("locating");
  const onFixRef = useRef(onFix);

  useEffect(() => {
    onFixRef.current = onFix;
  });

  const request = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setStatus("found");
        onFixRef.current([coords.latitude, coords.longitude]);
      },
      () => setStatus("failed"),
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  const retry = () => {
    setStatus("locating");
    request();
  };

  return { status, retry };
}
