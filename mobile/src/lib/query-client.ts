import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import Storage from "expo-sqlite/kv-store";
import { QUERY_CACHE_MAX_AGE_MS } from "@/lib/constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: QUERY_CACHE_MAX_AGE_MS, retry: 1, networkMode: "offlineFirst" },
    mutations: { networkMode: "always" },
  },
});

export const queryPersister = createAsyncStoragePersister({ storage: Storage, key: "wildx-query-cache" });
