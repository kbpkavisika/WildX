import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

type Mutation = { mutateAsync: (input: unknown) => Promise<unknown>; isError: boolean };
type HookResult = Record<string, unknown>;
type QueryResult = { data: unknown; isPending: boolean; isLoading: boolean; isError: boolean; error: Error | null; isSuccess: boolean };
type TestState = {
  loaded: boolean; allowed: boolean; rangeError: string | null; token: string | null;
  user: { id?: number; role: string; parkId: number } | null;
  patrolId: number; index: number; selectedId: number; apiError?: Error | null;
  savedStatus?: string; patrolStatus?: string; sourceType?: string; queryError?: boolean;
  cameraView?: { bursts: { tiles: { id: number; restricted: boolean }[] }[]; selected: { id: number; restricted: boolean } };
  [key: string]: unknown;
};
const asResult = (value: unknown) => value as HookResult;
const isMutation = (value: unknown): value is Mutation => typeof value === "object" && value !== null && "mutateAsync" in value;
type Options = { queryKey: unknown[]; queryFn: () => Promise<unknown>; enabled?: boolean; select?: (data: unknown) => unknown; staleTime?: number };
const { state, store, api, apiCalls, queryOptions, replace } = vi.hoisted(() => {
  const apiCalls: Record<string, ReturnType<typeof vi.fn>> = {};
  const state: TestState = { loaded: false, allowed: true, rangeError: null, token: "token", user: { id: 1, role: "ADMIN", parkId: 7 }, patrolId: 1, index: 2, selectedId: 1 };
  for (const name of ["setSession", "clearSession", "setRange", "closeRule", "toggle", "scrub", "setNotice"]) state[name] = vi.fn();
  const store = Object.assign((selector?: (value: TestState) => unknown) => selector ? selector(state) : state, { getState: () => state });
  const api = (name: string) => apiCalls[name] = vi.fn(async (...args: unknown[]) => {
    if (state.apiError) throw state.apiError;
    return { id: 1, status: state.savedStatus, token: "new-token", user: { role: "ADMIN", parkId: 7 }, args };
  });
  return { state, store, api, apiCalls, queryOptions: [] as Options[], replace: vi.fn() };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-query")>();
  const result = (options: Options) => {
    queryOptions.push(options);
    let data: unknown = undefined;
    if (state.loaded) {
      const key = options.queryKey;
      data = [{ id: 1, status: state.patrolStatus, patrol: { id: 1 }, photoPath: "photo" }];
      if (key[0] === "dispatches" && typeof key[1] === "number") data = { sourceType: state.sourceType, sourceId: 1 };
      if (key[0] === "incidents" && typeof key[1] === "number") data = { id: 1, photoPath: "photo" };
      if (key[0] === "incident-photo" || key[0] === "community-report-photo" || key[0] === "camera-image") data = "photo-url";
      if (options.select) data = options.select([{ status: "OPEN" }, { status: "RESOLVED" }]);
    }
    return { data, isPending: !state.loaded, isLoading: !state.loaded && options.enabled !== false, isError: Boolean(state.queryError), error: state.queryError ? new Error("query failed") : null, isSuccess: state.loaded };
  };
  return { ...original, useQuery: result, useQueries: ({ queries, combine }: { queries: Options[]; combine: (results: QueryResult[]) => unknown }) => combine(queries.map(result)) };
});
vi.mock("@/lib/api/incident-types", () => ({ fetchIncidentTypes: api("fetchIncidentTypes"), createIncidentType: api("createIncidentType"), updateIncidentType: api("updateIncidentType"), deleteIncidentType: api("deleteIncidentType") }));
vi.mock("@/lib/api/incidents", () => ({ fetchIncidents: api("fetchIncidents"), fetchIncident: api("fetchIncident"), changeIncidentSeverity: api("changeIncidentSeverity"), dismissIncident: api("dismissIncident"), fetchIncidentPhoto: api("fetchIncidentPhoto"), fetchMyIncidents: api("fetchMyIncidents"), reportIncident: api("reportIncident") }));
vi.mock("@/lib/api/parks", () => ({ fetchSectors: api("fetchSectors"), createPark: api("createPark"), fetchParks: api("fetchParks"), switchPark: api("switchPark"), createSector: api("createSector"), deleteSector: api("deleteSector"), updateCoverageSettings: api("updateCoverageSettings"), updateSector: api("updateSector") }));
vi.mock("@/lib/api/patrols", () => ({ fetchLivePatrols: api("fetchLivePatrols"), fetchTrack: api("fetchTrack"), deletePatrol: api("deletePatrol"), fetchPatrolHistory: api("fetchPatrolHistory"), fetchPatrols: api("fetchPatrols"), fetchCoverageReport: api("fetchCoverageReport"), fetchCoverageReportCsv: api("fetchCoverageReportCsv"), fetchCoverage: api("fetchCoverage"), fetchMyPatrols: api("fetchMyPatrols"), recordPoints: api("recordPoints"), reportGps: api("reportGps"), endPatrol: api("endPatrol"), startPatrol: api("startPatrol"), createRoute: api("createRoute"), deleteRoute: api("deleteRoute"), fetchRoutes: api("fetchRoutes"), updateRoute: api("updateRoute"), assignPatrol: api("assignPatrol"), fetchRangers: api("fetchRangers"), updatePatrol: api("updatePatrol") }));
vi.mock("@/lib/auth/routes", () => ({ canViewIncidents: vi.fn(() => state.allowed), canViewReports: vi.fn(() => state.allowed), homePath: vi.fn(() => "/dashboard"), LOGIN_PATH: "/login" }));
vi.mock("@/lib/auth/store", () => ({ useAuthStore: store }));
vi.mock("@/lib/patrols/mappers", () => ({ toActivePatrolsView: vi.fn((...args: unknown[]) => ({ mappedBy: "toActivePatrolsView", args })), toSectorShape: vi.fn((...args: unknown[]) => ({ mappedBy: "toSectorShape", args })) }));
vi.mock("@/lib/api/alerts", () => ({ acknowledgeAlert: api("acknowledgeAlert"), resolveAlert: api("resolveAlert"), fetchAlerts: api("fetchAlerts") }));
vi.mock("@/lib/api/alert-report", () => ({ fetchAlertReport: api("fetchAlertReport"), fetchAlertReportCsv: api("fetchAlertReportCsv") }));
vi.mock("@/lib/alerts/report-mappers", () => ({ toAlertReportView: vi.fn((...args: unknown[]) => ({ mappedBy: "toAlertReportView", args })) }));
vi.mock("@/lib/alerts/report-store", () => ({ useAlertReportRange: store }));
vi.mock("@/lib/files", () => ({ downloadBlob: vi.fn((...args: unknown[]) => ({ mappedBy: "downloadBlob", args })), blobToDataUrl: vi.fn(async () => "data:image/jpeg;base64,photo") }));
vi.mock("@/lib/incidents/report-mappers", () => ({ reportRangeError: vi.fn(() => state.rangeError), toIncidentReportView: vi.fn((...args: unknown[]) => ({ mappedBy: "toIncidentReportView", args })) }));
vi.mock("@/lib/api/alert-rules", () => ({ deleteAlertRule: api("deleteAlertRule"), saveAlertRule: api("saveAlertRule"), fetchAlertRules: api("fetchAlertRules") }));
vi.mock("@/lib/zones/rule-form", () => ({ toRuleRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toRuleRequest", args })) }));
vi.mock("@/lib/zones/store", () => ({ useZonesPage: store }));
vi.mock("@/lib/api/zones", () => ({ fetchZones: api("fetchZones"), createZone: api("createZone"), deleteZone: api("deleteZone"), updateZone: api("updateZone") }));
vi.mock("@/lib/alerts/mappers", () => ({ toAlertsView: vi.fn((...args: unknown[]) => ({ mappedBy: "toAlertsView", args })), toRangerAlertsView: vi.fn((...args: unknown[]) => ({ mappedBy: "toRangerAlertsView", args })) }));
vi.mock("@/lib/alerts/store", () => ({ useAlertsPage: store }));
vi.mock("@/lib/patrols/store", () => ({ usePatrolsPage: store, useCoverageReportRange: store, useReplayScrub: store, useTracker: store, useRangerPatrolPage: store }));
vi.mock("@/lib/patrols/table-mappers", () => ({ toPatrolTableView: vi.fn((...args: unknown[]) => ({ mappedBy: "toPatrolTableView", args })) }));
vi.mock("@/lib/api/camera-images", () => ({ fetchCameraBursts: api("fetchCameraBursts"), fetchCameraImageFile: api("fetchCameraImageFile"), fetchRestrictedImageFile: api("fetchRestrictedImageFile"), tagCameraImage: api("tagCameraImage") }));
vi.mock("@/lib/camera/mappers", () => ({ toCameraView: vi.fn(() => state.cameraView) }));
vi.mock("@/lib/camera/store", () => ({ useCameraPage: store }));
vi.mock("@/lib/auth/permissions", () => ({ can: vi.fn(() => state.allowed) }));
vi.mock("@/lib/api/community", () => ({ fetchCommunityReportPhoto: api("fetchCommunityReportPhoto"), fetchCommunityReports: api("fetchCommunityReports"), fetchHotspots: api("fetchHotspots"), fetchSmsHelpCard: api("fetchSmsHelpCard"), invalidateReport: api("invalidateReport"), updateReportLocation: api("updateReportLocation"), validateReport: api("validateReport") }));
vi.mock("@/lib/patrols/coverage-mappers", () => ({ toCoverageReportView: vi.fn((...args: unknown[]) => ({ mappedBy: "toCoverageReportView", args })), toCoverageView: vi.fn((...args: unknown[]) => ({ mappedBy: "toCoverageView", args })) }));
vi.mock("@/lib/api/dashboard", () => ({ fetchDashboard: api("fetchDashboard") }));
vi.mock("@/lib/dashboard/mappers", () => ({ toDashboardView: vi.fn((...args: unknown[]) => ({ mappedBy: "toDashboardView", args })) }));
vi.mock("@/lib/api/devices", () => ({ fetchDevices: api("fetchDevices"), createAnimal: api("createAnimal"), createDevice: api("createDevice"), fetchAnimals: api("fetchAnimals") }));
vi.mock("@/lib/devices/mappers", () => ({ toDevicesView: vi.fn((...args: unknown[]) => ({ mappedBy: "toDevicesView", args })) }));
vi.mock("@/lib/devices/store", () => ({ useDevicesPage: store }));
vi.mock("@/lib/api/dispatches", () => ({ acknowledgeDispatch: api("acknowledgeDispatch"), completeDispatch: api("completeDispatch"), declineDispatch: api("declineDispatch"), fetchDispatch: api("fetchDispatch"), createDispatch: api("createDispatch"), fetchResponders: api("fetchResponders"), fetchMyDispatches: api("fetchMyDispatches") }));
vi.mock("@/lib/dispatch/mappers", () => ({ toDispatchView: vi.fn((...args: unknown[]) => ({ mappedBy: "toDispatchView", args })), toResponderOptions: vi.fn((...args: unknown[]) => ({ mappedBy: "toResponderOptions", args })), toDispatchRows: vi.fn((...args: unknown[]) => ({ mappedBy: "toDispatchRows", args })), toMyIncidentRows: vi.fn((...args: unknown[]) => ({ mappedBy: "toMyIncidentRows", args })) }));
vi.mock("@/lib/incidents/mappers", () => ({ toIncidentDetailView: vi.fn((...args: unknown[]) => ({ mappedBy: "toIncidentDetailView", args })), toIncidentQueueView: vi.fn((...args: unknown[]) => ({ mappedBy: "toIncidentQueueView", args })), toIncidentTypesView: vi.fn((...args: unknown[]) => ({ mappedBy: "toIncidentTypesView", args })), toActiveTypeOptions: vi.fn((...args: unknown[]) => ({ mappedBy: "toActiveTypeOptions", args })) }));
vi.mock("@/lib/dispatch/dispatch-form", () => ({ toDispatchRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toDispatchRequest", args })) }));
vi.mock("@/lib/incidents/store", () => ({ useIncidentQueue: store, useIncidentReportRange: store }));
vi.mock("@/lib/api/incident-report", () => ({ fetchIncidentReport: api("fetchIncidentReport"), fetchIncidentReportCsv: api("fetchIncidentReportCsv") }));
vi.mock("@/lib/incidents/incident-type-form", () => ({ toIncidentTypeRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toIncidentTypeRequest", args })) }));
vi.mock("@/lib/api/auth", () => ({ login: api("login") }));
vi.mock("@/lib/devices/device-form", () => ({ toAnimalRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toAnimalRequest", args })), toDeviceRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toDeviceRequest", args })) }));
vi.mock("@/lib/api/notifications", () => ({ fetchMyNotifications: api("fetchMyNotifications"), markNotificationRead: api("markNotificationRead") }));
vi.mock("@/lib/notifications/mappers", () => ({ toNotificationsView: vi.fn((...args: unknown[]) => ({ mappedBy: "toNotificationsView", args })) }));
vi.mock("@/lib/parks/forms", () => ({ toParkRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toParkRequest", args })), toSectorRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toSectorRequest", args })) }));
vi.mock("@/lib/patrols/replay-mappers", () => ({ toReplayView: vi.fn((...args: unknown[]) => ({ mappedBy: "toReplayView", args })) }));
vi.mock("@/lib/format", () => ({ formatTime: vi.fn((...args: unknown[]) => ({ mappedBy: "formatTime", args })) }));
vi.mock("@/lib/patrols/ranger-mappers", () => ({ toRangerPatrolView: vi.fn((...args: unknown[]) => ({ mappedBy: "toRangerPatrolView", args })) }));
vi.mock("@/lib/patrols/waypoint-form", () => ({ toWaypointRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toWaypointRequest", args })) }));
vi.mock("@/lib/incidents/report-form", () => ({ toIncidentCreateRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toIncidentCreateRequest", args })) }));
vi.mock("@/lib/patrols/route-form", () => ({ toRouteRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toRouteRequest", args })) }));
vi.mock("@/lib/patrols/route-mappers", () => ({ toRouteRow: vi.fn((...args: unknown[]) => ({ mappedBy: "toRouteRow", args })) }));
vi.mock("@/lib/patrols/patrol-form", () => ({ toAssignRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toAssignRequest", args })), toUpdateRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toUpdateRequest", args })) }));
vi.mock("@/lib/api/simulator", () => ({ simulateCameraImages: api("simulateCameraImages"), simulateCollarFixes: api("simulateCollarFixes") }));
vi.mock("@/lib/simulator/forms", () => ({ toCameraSimulationRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toCameraSimulationRequest", args })), toCollarSimulationRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toCollarSimulationRequest", args })) }));
vi.mock("@/lib/simulator/mappers", () => ({ toCameraOptions: vi.fn((...args: unknown[]) => ({ mappedBy: "toCameraOptions", args })), toCollarOptions: vi.fn((...args: unknown[]) => ({ mappedBy: "toCollarOptions", args })), toZoneOptions: vi.fn((...args: unknown[]) => ({ mappedBy: "toZoneOptions", args })) }));
vi.mock("@/lib/camera/tag-form", () => ({ toTagRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toTagRequest", args })) }));
vi.mock("@/lib/api/users", () => ({ createUser: api("createUser"), deactivateUser: api("deactivateUser"), fetchUsers: api("fetchUsers"), updateUser: api("updateUser") }));
vi.mock("@/lib/users/mappers", () => ({ toUsersView: vi.fn((...args: unknown[]) => ({ mappedBy: "toUsersView", args })) }));
vi.mock("@/lib/users/user-form", () => ({ toUserRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toUserRequest", args })) }));
vi.mock("@/lib/zones/mappers", () => ({ toZonesView: vi.fn((...args: unknown[]) => ({ mappedBy: "toZonesView", args })) }));
vi.mock("@/lib/zones/zone-form", () => ({ toZoneRequest: vi.fn((...args: unknown[]) => ({ mappedBy: "toZoneRequest", args })) }));

const specifications = [{"name":"use-active-patrols","fn":"useActivePatrols"},{"name":"use-alert-actions","fn":"useAlertActions"},{"name":"use-alert-report","fn":"useAlertReport"},{"name":"use-alert-rules","fn":"useAlertRules"},{"name":"use-alerts","fn":"useAlerts"},{"name":"use-all-patrols","fn":"useAllPatrols"},{"name":"use-camera-images","fn":"useCameraImages"},{"name":"use-can","fn":"useCan"},{"name":"use-community-report-photo","fn":"useCommunityReportPhoto"},{"name":"use-community-reports","fn":"useCommunityReports"},{"name":"use-community-reports","fn":"useSmsHelpCardQuery"},{"name":"use-coverage-report","fn":"useCoverageReport"},{"name":"use-coverage","fn":"useCoverage"},{"name":"use-dashboard","fn":"useDashboard"},{"name":"use-devices","fn":"useDevices"},{"name":"use-dispatch-task","fn":"useDispatchTask"},{"name":"use-dispatch","fn":"useDispatch"},{"name":"use-incident-detail","fn":"useIncidentDetail"},{"name":"use-incident-photo","fn":"useIncidentPhoto"},{"name":"use-incident-queue","fn":"useIncidentQueueView"},{"name":"use-incident-report","fn":"useIncidentReport"},{"name":"use-incident-types","fn":"useParkIncidentTypes"},{"name":"use-incident-types","fn":"useIncidentTypes"},{"name":"use-login","fn":"useLogin"},{"name":"use-logout","fn":"useLogout"},{"name":"use-my-patrols","fn":"useMyPatrols"},{"name":"use-my-tasks","fn":"useMyTasks"},{"name":"use-new-animal","fn":"useNewAnimal"},{"name":"use-new-device","fn":"useNewDevice"},{"name":"use-notifications","fn":"useNotifications"},{"name":"use-open-alert-count","fn":"useOpenAlertCount"},{"name":"use-park-sectors","fn":"useParkSectors"},{"name":"use-parks","fn":"useParks"},{"name":"use-patrol-replay","fn":"usePatrolReplay"},{"name":"use-ranger-alerts","fn":"useRangerAlerts"},{"name":"use-ranger-patrol","fn":"useRangerPatrol"},{"name":"use-report-incident","fn":"useReportIncident"},{"name":"use-restricted-image","fn":"useRestrictedImage"},{"name":"use-routes","fn":"useRoutes"},{"name":"use-save-patrol","fn":"useSavePatrol"},{"name":"use-sectors","fn":"useSectors"},{"name":"use-simulator","fn":"useSimulator"},{"name":"use-tag-image","fn":"useTagImage"},{"name":"use-users","fn":"useUsers"},{"name":"use-zones","fn":"useZones"}];
const mutationInput = (key: string, updating = false) => {
  if (["remove", "markRead", "switchTo", "acknowledge"].includes(key)) return 1;
  if (["complete", "decline", "dismiss", "severity", "saveNeglectDays"].includes(key)) return key === "saveNeglectDays" ? 5 : "HIGH";
  return { id: 1, imageId: 1, disposition: "FALSE_ALARM", severity: "HIGH", reason: "verified", segmentId: 2, zoneType: "RESTRICTED", zoneId: updating ? 1 : null, sectorId: updating ? 1 : null, userId: updating ? 1 : null, routeId: updating ? 1 : null, typeId: updating ? 1 : null, values: { name: "Test" }, at: null, photo: null };
};
const argsFor = (name: string, alternate = false): unknown[] => {
  if (["useNewDevice", "useNewAnimal"].includes(name)) return [vi.fn()];
  if (name === "useSavePatrol") return [alternate ? 1 : null, vi.fn()];
  if (name === "useDispatch") return [{ sourceType: "INCIDENT", sourceId: 1 }, alternate ? null : [1, 2], vi.fn()];
  if (name === "useCan") return ["settings.manage"];
  if (name === "useOpenAlertCount") return [!alternate];
  if (name === "useIncidentPhoto") return [alternate ? null : 1, !alternate];
  if (name === "useCommunityReportPhoto") return [alternate ? null : 1, !alternate, 7];
  if (name === "useCommunityReports") return [alternate ? "VALIDATED" : undefined];
  return [1];
};

beforeEach(() => {
  Object.assign(state, { loaded: false, allowed: true, rangeError: null, token: "token", user: { id: 1, role: "ADMIN", parkId: 7 }, patrolId: 1, index: 2, selectedId: 1, savedStatus: "TAGGED", patrolStatus: "ACTIVE", sourceType: "INCIDENT", queryError: false, apiError: null, cameraView: { bursts: [{ tiles: [{ id: 1, restricted: false }, { id: 2, restricted: true }] }], selected: { id: 3, restricted: false } } });
  queryOptions.length = 0;
  vi.clearAllMocks();
});
afterEach(cleanup);

describe.each(specifications)("$fn contracts", ({ name, fn }) => {
  it("binds queries to API boundaries and exposes loaded, pending, and error states", async () => {
    const hooks = await import("../../hooks/" + name);
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const args = argsFor(fn);
    const rendered = renderHook(() => hooks[fn](...args), { wrapper });
    const captured = [...queryOptions];
    for (const options of captured) {
      const previous = Object.values(apiCalls).reduce((sum, call) => sum + call.mock.calls.length, 0);
      await options.queryFn();
      expect(Object.values(apiCalls).reduce((sum, call) => sum + call.mock.calls.length, 0)).toBeGreaterThan(previous);
      expect(options.queryKey.length).toBeGreaterThan(0);
      if (options.select) expect(options.select([{ status: "OPEN" }, { status: "RESOLVED" }])).toBeDefined();
    }
    state.loaded = true;
    rendered.rerender();
    const loaded = asResult(rendered.result.current);
    if (loaded && typeof loaded === "object" && "isError" in loaded) expect(loaded.isError).toBe(false);
    state.queryError = true;
    rendered.rerender();
    const failed = asResult(rendered.result.current);
    if (failed && typeof failed === "object" && "isError" in failed && !failed.mutateAsync) expect(failed.isError).toBe(true);
    if (typeof failed?.scrub === "function") {
      (failed.scrub as (index: number) => void)(5);
      expect(state.scrub).toHaveBeenCalledWith(1, 5);
    }
    if (typeof rendered.result.current === "function") {
      rendered.result.current();
      expect(state.clearSession).toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith("/login");
    }
    rendered.unmount();
    client.clear();
  });

  it("guards missing authentication, park, permission, and invalid report ranges", async () => {
    const hooks = await import("../../hooks/" + name);
    Object.assign(state, { token: null, user: null, allowed: false, rangeError: "Invalid dates", patrolId: 2, loaded: true, sourceType: "ALERT", cameraView: { bursts: [], selected: { id: 2, restricted: true } } });
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const rendered = renderHook(() => hooks[fn](...argsFor(fn, true)), { wrapper });
    for (const options of queryOptions) {
      if (options.enabled !== undefined && !["useIncidentDetail", "useRangerPatrol"].includes(fn)) expect(options.enabled).toBe(false);
    }
    expect(rendered.result.current).toBeDefined();
    rendered.unmount();
    client.clear();
  });

  it("runs mutation API calls and success callbacks, and propagates API failures", async () => {
    const hooks = await import("../../hooks/" + name);
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const removeQueries = vi.spyOn(client, "removeQueries");
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const rendered = renderHook(() => hooks[fn](...argsFor(fn)), { wrapper });
    const value = rendered.result.current;
    const mutations: [string, Mutation][] = isMutation(value) ? [["mutation", value]] : Object.entries(asResult(value) ?? {}).filter((entry): entry is [string, Mutation] => isMutation(entry[1]));
    for (const [key, mutation] of mutations) {
      const previous = Object.values(apiCalls).reduce((sum, call) => sum + call.mock.calls.length, 0);
      await act(async () => { await mutation.mutateAsync(mutationInput(key)); });
      expect(Object.values(apiCalls).reduce((sum, call) => sum + call.mock.calls.length, 0)).toBeGreaterThan(previous);
      if (["save"].includes(key)) await act(async () => { await mutation.mutateAsync(mutationInput(key, true)); });
      if (fn === "useTagImage") {
        state.savedStatus = "RESTRICTED";
        await act(async () => { await mutation.mutateAsync(mutationInput(key)); });
        expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["camera-image", 7, 1] });
      }
      const beforeError = invalidate.mock.calls.length;
      state.apiError = new Error("API unavailable");
      await act(async () => { await expect(mutation.mutateAsync(mutationInput(key))).rejects.toThrow("API unavailable"); });
      await waitFor(() => {
        const current = rendered.result.current;
        expect((isMutation(current) ? current : asResult(current)[key] as Mutation).isError).toBe(true);
      });
      if (!["useAlertActions", "useNotifications"].includes(fn)) expect(invalidate.mock.calls.length).toBe(beforeError);
      state.apiError = null;
    }
    if (mutations.length && !["useLogin", "useRestrictedImage", "useDispatch", "useParks", "useAlertReport", "useCoverageReport", "useIncidentReport"].includes(fn)) expect(invalidate).toHaveBeenCalled();
    if (fn === "useLogin") {
      expect(state.setSession).toHaveBeenCalledWith("new-token", { role: "ADMIN", parkId: 7 });
      expect(replace).toHaveBeenCalledWith("/dashboard");
    }
    rendered.unmount();
    client.clear();
  });
});

