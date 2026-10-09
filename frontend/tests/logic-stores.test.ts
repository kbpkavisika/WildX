import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/lib/auth/store";
import { useUsersPage } from "@/lib/users/store";
import { useZonesPage } from "@/lib/zones/store";
import { useDevicesPage } from "@/lib/devices/store";
import { useCameraPage } from "@/lib/camera/store";
import { useAlertsPage } from "@/lib/alerts/store";
import { useAlertReportRange } from "@/lib/alerts/report-store";
import { useNavStore } from "@/lib/layout/store";
import { useDispatchTaskPage } from "@/lib/dispatch/store";
import { useIncidentDetailPage, useIncidentQueue, useIncidentReportRange, useIncidentTypesPage } from "@/lib/incidents/store";
import { useCoverageReportRange, useCoverageSelection, usePatrolSelection, usePatrolsPage, useRangerPatrolPage, useReplayScrub, useRoutesPage, useTracker } from "@/lib/patrols/store";
import { ALERT_FILTERS } from "@/lib/alerts/types";
import { CAMERA_FILTERS } from "@/lib/camera/types";
import { DEVICE_FILTERS } from "@/lib/devices/types";
import { PATROL_FILTERS } from "@/lib/patrols/types";
import { INCIDENT_STATUSES, ROLES, ZONE_TYPES } from "@/lib/enums";

const resetters: (() => void)[] = [];
function resetAfterEach<T>(store: { getInitialState: () => T; setState: (state: T, replace: true) => unknown }) {
  resetters.push(() => store.setState(store.getInitialState(), true));
}
resetAfterEach(useAuthStore);
resetAfterEach(useUsersPage);
resetAfterEach(useZonesPage);
resetAfterEach(useDevicesPage);
resetAfterEach(useCameraPage);
resetAfterEach(useAlertsPage);
resetAfterEach(useAlertReportRange);
resetAfterEach(useNavStore);
resetAfterEach(useDispatchTaskPage);
resetAfterEach(useIncidentDetailPage);
resetAfterEach(useIncidentQueue);
resetAfterEach(useIncidentReportRange);
resetAfterEach(useIncidentTypesPage);
resetAfterEach(useCoverageReportRange);
resetAfterEach(useCoverageSelection);
resetAfterEach(usePatrolSelection);
resetAfterEach(usePatrolsPage);
resetAfterEach(useRangerPatrolPage);
resetAfterEach(useReplayScrub);
resetAfterEach(useRoutesPage);
resetAfterEach(useTracker);
afterEach(() => { for (const reset of resetters) reset(); });

describe("page state transitions", () => {
  it("opens, edits and resets reusable editor state", () => {
    for (const store of [useUsersPage, useZonesPage, useIncidentTypesPage, usePatrolsPage, useRoutesPage]) {
      store.getState().openEdit(7);
      expect(store.getState()).toMatchObject({ formOpen: true, editingId: 7 });
      store.getState().openNew();
      expect(store.getState()).toMatchObject({ formOpen: true, editingId: null });
      store.getState().close();
      expect(store.getState()).toMatchObject({ formOpen: false, editingId: null });
    }
  });
  it("toggles selection and clears zone drafts and rules", () => {
    for (const store of [useZonesPage, useCameraPage, useAlertsPage, usePatrolSelection, useCoverageSelection]) {
      store.getState().toggle(4);
      expect(store.getState().selectedId).toBe(4);
      store.getState().toggle(4);
      expect(store.getState().selectedId).toBeNull();
    }
    useZonesPage.getState().setDraft([[[6, 80]]]);
    expect(useZonesPage.getState().draft).toEqual([[[6, 80]]]);
    useZonesPage.getState().openEdit(1);
    expect(useZonesPage.getState()).toMatchObject({ selectedId: 1, draft: null });
    useZonesPage.getState().openRule(ZONE_TYPES.ROAD);
    expect(useZonesPage.getState().ruleType).toBe(ZONE_TYPES.ROAD);
    useZonesPage.getState().closeRule();
    expect(useZonesPage.getState().ruleType).toBeNull();
  });
  it("updates filters and cancels stale selection actions", () => {
    useCameraPage.getState().focus(9);
    expect(useCameraPage.getState()).toMatchObject({ filter: CAMERA_FILTERS.ALL, selectedId: 9 });
    useCameraPage.getState().setFilter(CAMERA_FILTERS.PENDING);
    expect(useCameraPage.getState().selectedId).toBeNull();
    useDevicesPage.getState().setFilter(DEVICE_FILTERS.COLLAR);
    useDevicesPage.getState().setForm("animal");
    expect(useDevicesPage.getState()).toMatchObject({ filter: DEVICE_FILTERS.COLLAR, form: "animal" });
    usePatrolsPage.getState().setFilter(PATROL_FILTERS.ACTIVE);
    expect(usePatrolsPage.getState().filter).toBe(PATROL_FILTERS.ACTIVE);
    useAlertsPage.getState().setNotice("Saved");
    useAlertsPage.getState().setAction("resolve");
    expect(useAlertsPage.getState()).toMatchObject({ action: "resolve", notice: null });
    useAlertsPage.getState().setNotice("Saved");
    expect(useAlertsPage.getState().action).toBeNull();
    useAlertsPage.getState().toggle(1);
    useAlertsPage.getState().setFilter(ALERT_FILTERS.ALL);
    expect(useAlertsPage.getState()).toMatchObject({ selectedId: null, action: null, notice: null, filter: ALERT_FILTERS.ALL });
    useIncidentQueue.getState().setFilter({ status: INCIDENT_STATUSES.RESOLVED });
    useIncidentQueue.getState().select(2);
    expect(useIncidentQueue.getState()).toMatchObject({ selectedId: 2, filters: { status: INCIDENT_STATUSES.RESOLVED, typeId: "ALL", severity: "ALL" } });
  });
  it("preserves the other report bound and navigation group", () => {
    for (const store of [useAlertReportRange, useIncidentReportRange, useCoverageReportRange]) {
      store.getState().setRange({ from: "2026-01-01", to: "2026-02-01" });
      store.getState().setRange({ from: "2026-01-02" });
      expect(store.getState()).toMatchObject({ from: "2026-01-02", to: "2026-02-01" });
    }
    useNavStore.getState().setExpanded("reports", true);
    useNavStore.getState().setExpanded("settings", false);
    expect(useNavStore.getState().expanded).toEqual({ reports: true, settings: false });
  });
  it("opens and closes incident and dispatch actions", () => {
    useIncidentDetailPage.getState().openAction(2, "dismiss");
    expect(useIncidentDetailPage.getState().open).toEqual({ incidentId: 2, action: "dismiss" });
    useIncidentDetailPage.getState().close();
    expect(useIncidentDetailPage.getState().open).toBeNull();
    useDispatchTaskPage.getState().openAction(3, "complete");
    expect(useDispatchTaskPage.getState().open).toEqual({ dispatchId: 3, action: "complete" });
    useDispatchTaskPage.getState().close();
    expect(useDispatchTaskPage.getState().open).toBeNull();
  });
  it("tracks GPS, replay scrub and exclusive ranger notices", () => {
    const fix = { position: [6, 80] as [number, number], at: 1000, accuracyM: 2 };
    useTracker.getState().setFix(fix);
    useTracker.getState().setGpsLost(true);
    expect(useTracker.getState()).toMatchObject({ fix, gpsLost: true });
    useReplayScrub.getState().scrub(4, 8);
    expect(useReplayScrub.getState()).toMatchObject({ patrolId: 4, index: 8 });
    useRangerPatrolPage.getState().setNotice("Done");
    useRangerPatrolPage.getState().setPanel("end");
    expect(useRangerPatrolPage.getState()).toMatchObject({ panel: "end", notice: null });
    useRangerPatrolPage.getState().setNotice("Ended");
    expect(useRangerPatrolPage.getState()).toMatchObject({ panel: null, notice: "Ended" });
  });
  it("persists and clears authenticated sessions", () => {
    const user = { id: 1, name: "Alice", email: "alice@example.com", role: ROLES.MANAGER, parkId: 1 };
    useAuthStore.getState().setSession("token", user);
    expect(useAuthStore.getState()).toMatchObject({ token: "token", user });
    expect(JSON.parse(localStorage.getItem("wildx-auth")!).state).toMatchObject({ token: "token", user });
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null });
  });
});
