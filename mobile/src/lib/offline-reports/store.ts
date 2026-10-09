import { create } from "zustand";
import { useSession } from "@/lib/auth/store";
import { reportsOf, type OfflineReport } from "./repository";

interface OfflineReportsState {
  reports: OfflineReport[];
}

export const useOfflineReports = create<OfflineReportsState>()(() => ({ reports: [] }));

export function refreshOfflineReports(): void {
  const user = useSession.getState().user;
  useOfflineReports.setState({ reports: user ? reportsOf(user.id) : [] });
}
