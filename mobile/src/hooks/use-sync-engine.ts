import { onlineManager } from "@tanstack/react-query";
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from "expo-network";
import { useEffect } from "react";
import { AppState } from "react-native";
import { SYNC_RETRY_MS } from "@/lib/constants";
import { pendingCount } from "@/lib/outbox/overlay";
import { refreshOutbox, useConnection, useOutbox } from "@/lib/outbox/store";
import { syncNow } from "@/lib/outbox/sync";

function applyNetworkState(state: NetworkState): void {
  const online = state.isConnected === true && state.isInternetReachable !== false;
  const wasOnline = useConnection.getState().online;
  useConnection.setState({ online });
  onlineManager.setOnline(online);
  if (online && !wasOnline) void syncNow();
}

export function useSyncEngine() {
  const waiting = useOutbox((state) => pendingCount(state.rows));

  useEffect(() => {
    refreshOutbox();
    void getNetworkStateAsync().then((state) => {
      applyNetworkState(state);
      return syncNow();
    });
    const network = addNetworkStateListener(applyNetworkState);
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncNow();
    });
    return () => {
      network.remove();
      app.remove();
    };
  }, []);

  useEffect(() => {
    if (waiting === 0) return;
    const timer = setInterval(() => void syncNow(), SYNC_RETRY_MS);
    return () => clearInterval(timer);
  }, [waiting]);
}
