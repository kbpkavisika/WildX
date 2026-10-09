import { createElement, type ReactNode, type ComponentType } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Props = Record<string, unknown> & { children?: ReactNode };
const { state, actions, hookCalls, seen, router, mockChild } = vi.hoisted(() => {
  const state: { result: Record<string, unknown>; store: Record<string, unknown>; allowed: boolean } = { result: {}, store: {}, allowed: true };
  const actions: Record<string, ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>> = {};
  const hookCalls: Record<string, ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>> = {};
  const seen: Record<string, Props[]> = {};
  const router = { replace: vi.fn() };
  const mockChild = (name: string) => async () => {
    const { createElement } = await import("react");
    return (props: Props) => {
      (seen[name] ??= []).push(props);
      const children = [props.title, props.subtitle, props.action, props.badge, props.media, props.children].filter((value) => typeof value !== "object" || value === null || "$$typeof" in value).filter((value) => value !== undefined) as ReactNode[];
      const buttons = Object.entries(props).filter(([key, value]) => key.startsWith("on") && typeof value === "function").map(([key, callback]) => createElement("button", { key, type: "button", onClick: () => {
        const input = key === "onDelete" || key === "onDeactivate" ? { id: 1, name: "Test", code: "P-1", title: "Patrol", leaderName: "Ranger" } : key === "onSubmit" ? { name: "Saved" } : key === "onOpenAction" ? "complete" : key === "onClose" ? undefined : 1;
        (callback as (input: unknown) => void)(input);
      } }, `${name}:${key}`));
      if (props.onOpenAction) buttons.push(createElement("button", { key: "closeAction", type: "button", onClick: () => (props.onOpenAction as (input: null) => void)(null) }, `${name}:closeAction`));
      return createElement("section", { "data-testid": name }, ...children, ...buttons);
    };
  };
  return { state, actions, hookCalls, seen, router, mockChild };
});
vi.mock("@/lib/patrols/ranger-mappers", () => ({ toRangerPatrolCards: (data: unknown[]) => data.map(() => ({ title: "Patrol" })) }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "1" }), useRouter: () => router }));
vi.mock("@/components/patrols/ranger-patrol-map", () => ({ default: () => null }));
vi.mock("@/components/incidents/location-picker", () => ({ default: () => null }));
vi.mock("@/components/alerts/alert-map", () => ({ default: () => null }));
vi.mock("@/components/patrols/coverage-map", () => ({ default: () => null }));
vi.mock("@/components/zones/zone-map", () => ({ default: () => null }));
vi.mock("@/components/incidents/incident-points-map", () => ({ default: () => null }));
vi.mock("@/components/patrols/live-map", () => ({ default: () => null }));
vi.mock("@/components/patrols/replay-map", () => ({ default: () => null }));
vi.mock("next/dynamic", () => ({ default: (load: () => Promise<unknown>) => { void load(); return () => createElement("div", { "data-testid": "Map" }); } }));
vi.mock("next/image", () => ({ default: (props: Props) => createElement("span", { role: "img", "aria-label": props.alt as string }) }));
vi.mock("@/components/dashboard/conflict-chart", async () => ({ ConflictChart: await mockChild("ConflictChart")() }));
vi.mock("@/components/dashboard/park-activity", async () => ({ ParkActivity: await mockChild("ParkActivity")() }));
vi.mock("@/components/dashboard/patrol-schedule", async () => ({ PatrolSchedule: await mockChild("PatrolSchedule")() }));
vi.mock("@/components/layout/page-header", async () => ({ PageHeader: await mockChild("PageHeader")() }));
vi.mock("@/components/auth/sign-in-form", async () => ({ SignInForm: await mockChild("SignInForm")() }));
vi.mock("@/components/patrols/ranger-patrol-list", async () => ({ RangerPatrolList: await mockChild("RangerPatrolList")() }));
vi.mock("@/components/alerts/ranger-alert-list", async () => ({ RangerAlertList: await mockChild("RangerAlertList")() }));
vi.mock("@/components/notifications/notifications-card", async () => ({ NotificationsCard: await mockChild("NotificationsCard")() }));
vi.mock("@/components/dispatch/task-list", async () => ({ TaskList: await mockChild("TaskList")() }));
vi.mock("@/components/patrols/no-gps-banner", async () => ({ NoGpsBanner: await mockChild("NoGpsBanner")() }));
vi.mock("@/components/patrols/ranger-patrol-actions", async () => ({ RangerPatrolActions: await mockChild("RangerPatrolActions")() }));
vi.mock("@/components/incidents/report-incident-form", async () => ({ ReportIncidentForm: await mockChild("ReportIncidentForm")() }));
vi.mock("@/components/dispatch/dispatch-actions", async () => ({ DispatchActions: await mockChild("DispatchActions")() }));
vi.mock("@/components/incidents/incident-facts", async () => ({ IncidentFacts: await mockChild("IncidentFacts")() }));
vi.mock("@/components/alerts/alert-detail", async () => ({ AlertDetail: await mockChild("AlertDetail")() }));
vi.mock("@/components/alerts/alert-list", async () => ({ AlertList: await mockChild("AlertList")() }));
vi.mock("@/components/devices/secondary-link", async () => ({ SecondaryLink: await mockChild("SecondaryLink")() }));
vi.mock("@/components/devices/animal-form", async () => ({ AnimalForm: await mockChild("AnimalForm")() }));
vi.mock("@/components/devices/device-form", async () => ({ DeviceForm: await mockChild("DeviceForm")() }));
vi.mock("@/components/devices/devices-table", async () => ({ DevicesTable: await mockChild("DevicesTable")() }));
vi.mock("@/components/devices/form-panel", async () => ({ FormPanel: await mockChild("FormPanel")() }));
vi.mock("@/components/camera/image-picture", async () => ({ ImageFrame: await mockChild("ImageFrame")(), ImagePicture: await mockChild("ImagePicture")() }));
vi.mock("@/components/camera/image-queue", async () => ({ ImageQueue: await mockChild("ImageQueue")() }));
vi.mock("@/components/camera/image-review", async () => ({ ImageReview: await mockChild("ImageReview")() }));
vi.mock("@/components/camera/restricted-image", async () => ({ RestrictedImage: await mockChild("RestrictedImage")() }));
vi.mock("@/components/camera/tag-image-form", async () => ({ TagImageForm: await mockChild("TagImageForm")() }));
vi.mock("@/components/incidents/incident-detail", async () => ({ IncidentDetail: await mockChild("IncidentDetail")() }));
vi.mock("@/components/incidents/incident-filters", async () => ({ IncidentFilters: await mockChild("IncidentFilters")() }));
vi.mock("@/components/incidents/incidents-table", async () => ({ IncidentsTable: await mockChild("IncidentsTable")() }));
vi.mock("@/components/patrols/patrol-form", async () => ({ PatrolForm: await mockChild("PatrolForm")() }));
vi.mock("@/components/patrols/patrols-table", async () => ({ PatrolsTable: await mockChild("PatrolsTable")() }));
vi.mock("@/components/auth/can", async () => ({ Can: (props: Props) => state.allowed ? props.children : null }));
vi.mock("@/components/patrols/route-form", async () => ({ RouteForm: await mockChild("RouteForm")() }));
vi.mock("@/components/patrols/routes-table", async () => ({ RoutesTable: await mockChild("RoutesTable")() }));
vi.mock("@/components/simulator/camera-simulation-form", async () => ({ CameraSimulationForm: await mockChild("CameraSimulationForm")() }));
vi.mock("@/components/simulator/collar-simulation-form", async () => ({ CollarSimulationForm: await mockChild("CollarSimulationForm")() }));
vi.mock("@/components/users/user-form", async () => ({ UserForm: await mockChild("UserForm")() }));
vi.mock("@/components/users/users-table", async () => ({ UsersTable: await mockChild("UsersTable")() }));
vi.mock("@/components/incidents/incident-type-form", async () => ({ IncidentTypeForm: await mockChild("IncidentTypeForm")() }));
vi.mock("@/components/incidents/incident-types-table", async () => ({ IncidentTypesTable: await mockChild("IncidentTypesTable")() }));
vi.mock("@/components/parks/park-form", async () => ({ ParkForm: await mockChild("ParkForm")() }));
vi.mock("@/components/parks/park-list", async () => ({ ParkList: await mockChild("ParkList")() }));
vi.mock("@/components/parks/neglect-form", async () => ({ NeglectForm: await mockChild("NeglectForm")() }));
vi.mock("@/components/parks/sector-form", async () => ({ SectorForm: await mockChild("SectorForm")() }));
vi.mock("@/components/parks/sector-list", async () => ({ SectorList: await mockChild("SectorList")() }));
vi.mock("@/components/zones/rules-card", async () => ({ RulesCard: await mockChild("RulesCard")() }));
vi.mock("@/components/zones/zone-form", async () => ({ ZoneForm: await mockChild("ZoneForm")() }));
vi.mock("@/components/zones/zone-list", async () => ({ ZoneList: await mockChild("ZoneList")() }));
vi.mock("@/components/alerts/alert-report-summary", async () => ({ AlertReportSummary: await mockChild("AlertReportSummary")() }));
vi.mock("@/components/alerts/alert-report-table", async () => ({ AlertReportTable: await mockChild("AlertReportTable")() }));
vi.mock("@/components/patrols/coverage-report-table", async () => ({ CoverageReportTable: await mockChild("CoverageReportTable")() }));
vi.mock("@/components/incidents/count-bars", async () => ({ CountBars: await mockChild("CountBars")() }));
vi.mock("@/components/patrols/waypoint-list", async () => ({ WaypointList: await mockChild("WaypointList")() }));
vi.mock("@/hooks/use-dashboard", () => ({ useDashboard: (...args: unknown[]) => { (hookCalls["useDashboard"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-parks", () => ({ useParks: (...args: unknown[]) => { (hookCalls["useParks"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-my-patrols", () => ({ useMyPatrols: () => ({ ...state.result, data: state.result.patrols }) }));
vi.mock("@/hooks/use-ranger-alerts", () => ({ useRangerAlerts: (...args: unknown[]) => { (hookCalls["useRangerAlerts"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-my-tasks", () => ({ useMyTasks: (...args: unknown[]) => { (hookCalls["useMyTasks"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-ranger-patrol", () => ({ useRangerPatrol: (...args: unknown[]) => { (hookCalls["useRangerPatrol"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-report-incident", () => ({ useReportIncident: (...args: unknown[]) => { (hookCalls["useReportIncident"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-dispatch-task", () => ({ useDispatchTask: (...args: unknown[]) => { (hookCalls["useDispatchTask"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-alerts", () => ({ useAlerts: (...args: unknown[]) => { (hookCalls["useAlerts"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-can", () => ({ useCan: () => state.allowed }));
vi.mock("@/hooks/use-coverage", () => ({ useCoverage: (...args: unknown[]) => { (hookCalls["useCoverage"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-devices", () => ({ useDevices: (...args: unknown[]) => { (hookCalls["useDevices"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-camera-images", () => ({ useCameraImages: (...args: unknown[]) => { (hookCalls["useCameraImages"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-incident-queue", () => ({ useIncidentQueueView: (...args: unknown[]) => { (hookCalls["useIncidentQueueView"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-all-patrols", () => ({ useAllPatrols: (...args: unknown[]) => { (hookCalls["useAllPatrols"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-routes", () => ({ useRoutes: (...args: unknown[]) => { (hookCalls["useRoutes"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-simulator", () => ({ useSimulator: (...args: unknown[]) => { (hookCalls["useSimulator"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-users", () => ({ useUsers: (...args: unknown[]) => { (hookCalls["useUsers"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-incident-types", () => ({ useIncidentTypes: (...args: unknown[]) => { (hookCalls["useIncidentTypes"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-sectors", () => ({ useSectors: (...args: unknown[]) => { (hookCalls["useSectors"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-zones", () => ({ useZones: (...args: unknown[]) => { (hookCalls["useZones"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-alert-report", () => ({ useAlertReport: (...args: unknown[]) => { (hookCalls["useAlertReport"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-coverage-report", () => ({ useCoverageReport: (...args: unknown[]) => { (hookCalls["useCoverageReport"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-incident-report", () => ({ useIncidentReport: (...args: unknown[]) => { (hookCalls["useIncidentReport"] ??= vi.fn())(...args); return state.result; }, useIncidentReportCsv: () => state.result.csv }));
vi.mock("@/hooks/use-park-sectors", () => ({ useParkSectors: () => [] }));
vi.mock("@/hooks/use-active-patrols", () => ({ useActivePatrols: (...args: unknown[]) => { (hookCalls["useActivePatrols"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/hooks/use-patrol-replay", () => ({ usePatrolReplay: (...args: unknown[]) => { (hookCalls["usePatrolReplay"] ??= vi.fn())(...args); return state.result; } }));
vi.mock("@/lib/dispatch/store", () => ({ useDispatchTaskPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
vi.mock("@/lib/alerts/store", () => ({ useAlertsPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
vi.mock("@/lib/devices/store", () => ({ useDevicesPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
vi.mock("@/lib/camera/store", () => ({ useCameraPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
vi.mock("@/lib/incidents/store", () => ({ useIncidentQueue: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store, useIncidentTypesPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
vi.mock("@/lib/patrols/store", () => ({ usePatrolsPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store, useRoutesPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
vi.mock("@/lib/users/store", () => ({ useUsersPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
vi.mock("@/lib/zones/store", () => ({ useZonesPage: (selector?: (value: Record<string, unknown>) => unknown) => selector ? selector(state.store) : state.store }));
const mutation = () => ({ mutate: vi.fn((input?: unknown, callbacks?: { onSuccess?: () => void }) => callbacks?.onSuccess?.()), reset: vi.fn(), isPending: false, isError: false, isSuccess: false, error: new Error("Failed"), data: { id: 1, typeName: "Conflict", sectorName: "North" }, variables: 1 });
const entity = { id: 1, name: "Test", status: "ACTIVE", pathGeojson: '{"type":"LineString","coordinates":[[80,7],[81,8]]}', boundaryGeojson: '{"type":"Polygon","coordinates":[[[80,7],[81,7],[81,8],[80,7]]]}', defaultSeverity: "HIGH", active: true, email: "test@example.com", role: "RANGER", phone: null, parkId: 1, parkName: "Test park" };
function reset() {
  vi.clearAllMocks();
  for (const key of Object.keys(seen)) delete seen[key];
  state.allowed = true;
  const view = { title: "Test patrol", subtitle: "North", total: 2, inactiveCount: 1, activeCount: 1, scheduledCount: 1, newCount: 1, openCount: 1, escalatedCount: 1, acknowledgedCount: 1, neglectedCount: 1, visitedCount: 1, sectorCount: 2, collarCount: 1, cameraCount: 1, attentionCount: 1, pendingCount: 1, pendingBurstCount: 1, zoneCount: 1, ruleCount: 1, typeCount: 1, filters: [{ value: "ALL", label: "All", count: 1 }], statusOptions: [{ value: "ALL", label: "All", count: 1 }], rows: [entity], rules: [], bursts: [], selected: { id: 1, restricted: false, title: "Camera", tag: {} }, metrics: [], track: [[7,80],[8,81]], walked: [[7,80]], maxIndex: 1, scrubTime: "10:00", endTime: "11:00", waypoints: [], facts: [], status: { tone: "positive", label: "Active" }, patrols: [entity], byType: [], bySector: [], byMonth: [], points: [] };
  state.result = { signedIn: true, hasPark: true, parkId: 1, canManage: true, canView: true, canTag: true, canSimulate: true, allowed: true, isPending: false, isError: false, notFound: false, rangeError: null, from: "2026-01-01", to: "2026-01-31", view, patrols: [entity], routes: [entity], users: [entity], zones: [entity], rules: [], types: [entity], sectors: [entity], parks: [entity], current: { ...entity, neglectDays: 7 }, collars: [], cameras: [], typeOptions: [], rows: [entity], pictures: new Map([[1,"photo"]]), data: { greeting: "Hello", today: "2026-01-01", metrics: [], conflict: {}, schedule: [] }, dispatches: {}, incidents: {}, gpsLost: true, incident: { position: [7,80], facts: [] }, setRange: vi.fn(), scrub: vi.fn() };
  for (const key of ["save", "remove", "saveNeglectDays", "create", "switchTo", "csv", "submit", "collar", "camera", "acknowledge", "complete", "decline"]) state.result[key] = mutation();
  state.store = { filter: "ALL", filters: { status: "ALL" }, selectedId: 1, formOpen: true, editingId: 1, form: "device", open: { dispatchId: 1, action: "complete" }, user: { role: "MANAGER", parkId: 1 } };
  for (const key of ["openNew", "openEdit", "close", "setFilter", "select", "setForm", "openAction"]) {
    actions[key] = vi.fn((input?: unknown) => {
      if (key === "openNew") Object.assign(state.store, { formOpen: true, editingId: null });
      if (key === "openEdit") Object.assign(state.store, { formOpen: true, editingId: input });
      if (key === "close") state.store.formOpen = false;
      if (key === "setForm") state.store.form = input;
    });
    state.store[key] = actions[key];
  }
  vi.spyOn(window, "confirm").mockReturnValue(true);
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { callback(0); return 1; });
}
beforeEach(reset);
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const specifications = [{"path": "app/dashboard/page.tsx", "title": "Dashboard"}, {"path": "app/login/page.tsx", "title": "SignInForm"}, {"path": "app/ranger/page.tsx", "title": "Patrols"}, {"path": "app/ranger/alerts/page.tsx", "title": "Alerts"}, {"path": "app/ranger/tasks/page.tsx", "title": "Tasks"}, {"path": "app/ranger/patrol/[id]/page.tsx", "title": null}, {"path": "app/ranger/incident/new/page.tsx", "title": "Report incident"}, {"path": "app/ranger/dispatch/[id]/page.tsx", "title": null}, {"path": "app/dashboard/alerts/page.tsx", "title": "Alerts"}, {"path": "app/dashboard/coverage/page.tsx", "title": "Coverage"}, {"path": "app/dashboard/devices/page.tsx", "title": "Devices"}, {"path": "app/dashboard/images/page.tsx", "title": "Camera traps"}, {"path": "app/dashboard/incidents/page.tsx", "title": "Incidents"}, {"path": "app/dashboard/patrols/page.tsx", "title": "All patrols"}, {"path": "app/dashboard/routes/page.tsx", "title": "Routes"}, {"path": "app/dashboard/simulator/page.tsx", "title": "Simulator"}, {"path": "app/dashboard/users/page.tsx", "title": "Users"}, {"path": "app/dashboard/settings/incident-types/page.tsx", "title": "Incident types"}, {"path": "app/dashboard/settings/parks/page.tsx", "title": "Parks"}, {"path": "app/dashboard/settings/sectors/page.tsx", "title": "Sectors"}, {"path": "app/dashboard/settings/zones/page.tsx", "title": "Zones and rules"}, {"path": "app/dashboard/reports/alerts/page.tsx", "title": "Alert report"}, {"path": "app/dashboard/reports/coverage/page.tsx", "title": "Patrol coverage report"}, {"path": "app/dashboard/reports/incidents/page.tsx", "title": "Incident report"}, {"path": "app/dashboard/patrols/active/page.tsx", "title": "Active patrols"}, {"path": "app/dashboard/patrols/[id]/page.tsx", "title": null}, {"path": "app/dashboard/incidents/[id]/page.tsx", "title": null}];
describe.each(specifications)("$path page wiring", ({ path, title }) => {
  it("renders loaded content and forwards callbacks to stores and mutations", async () => {
    const page = await import("../../" + path);
    const rendered = render(createElement(page.default as ComponentType));
    if (title === "SignInForm") expect(screen.getByTestId(title)).toBeDefined();
    else if (title) expect(rendered.container.textContent).toContain(title);
    expect(rendered.container.textContent?.length).toBeGreaterThan(0);
    for (const input of rendered.container.querySelectorAll<HTMLInputElement>('input[type="date"]')) {
      fireEvent.change(input, { target: { value: "2026-01-02" } });
      expect(state.result.setRange).toHaveBeenCalledWith(input.max ? { from: "2026-01-02" } : { to: "2026-01-02" });
    }
    const slider = screen.queryByRole("slider");
    if (slider) { fireEvent.change(slider, { target: { value: "1" } }); expect(state.result.scrub).toHaveBeenCalledWith(1); }
    const initialButtons = [...screen.queryAllByRole("button")];
    for (const button of initialButtons) if (button.isConnected && !(button as HTMLButtonElement).disabled) fireEvent.click(button);
    rendered.rerender(createElement(page.default as ComponentType));
    for (const button of screen.queryAllByRole("button")) if (button.textContent?.includes(":onSubmit")) fireEvent.click(button);
    for (const calls of Object.values(hookCalls)) if (path.includes("[id]") && calls.mock.calls.length) expect(calls).toHaveBeenCalledWith(1);
    const changed = Object.values(actions).some((action) => action.mock.calls.length > 0) || Object.values(state.result).some((value) => typeof value === "object" && value !== null && "mutate" in value && (value.mutate as ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>).mock.calls.length > 0);
    if (initialButtons.length) expect(changed || path.includes("login")).toBe(true);
  });
  it("shows pending and failed states without loaded views", async () => {
    const page = await import("../../" + path);
    Object.assign(state.result, { isPending: true, isError: true, view: undefined, data: undefined, rows: undefined, error: new Error("Failed") });
    const rendered = render(createElement(page.default as ComponentType));
    expect(rendered.container.innerHTML.length).toBeGreaterThan(0);
    if (!path.includes("login") && !path.includes("tasks") && !path.includes("incident/new") && !path.includes("incidents/[id]") && !path.includes("simulator")) expect(rendered.container.textContent).toMatch(/Loading|Could not/);
  });
  it("handles missing permissions, park, selection, and form state", async () => {
    const page = await import("../../" + path);
    state.allowed = false;
    Object.assign(state.result, { patrols: [], signedIn: false, hasPark: false, parkId: null, canManage: false, canView: false, canTag: false, canSimulate: false, allowed: false, notFound: true, view: undefined, current: null, rangeError: "Invalid dates" });
    Object.assign(state.store, { selectedId: null, formOpen: false, editingId: null, form: null, open: null });
    const rendered = render(createElement(page.default as ComponentType));
    expect(rendered.container.innerHTML.length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button").filter((button) => button.textContent?.startsWith("New "))).toHaveLength(0);
  });
  it("supports new forms, empty collections, and cancelled deletion", async () => {
    const page = await import("../../" + path);
    Object.assign(state.store, { formOpen: true, editingId: null, selectedId: null, form: "animal", filter: "OPEN" });
    const view = state.result.view as Record<string, unknown>;
    Object.assign(view, { attentionCount: 0, escalatedCount: 0, neglectedCount: 0, visitedCount: 0, patrols: [], track: [], selected: null });
    vi.mocked(window.confirm).mockReturnValue(false);
    const rendered = render(createElement(page.default as ComponentType));
    for (const button of screen.queryAllByRole("button")) if (button.textContent?.includes(":onDelete") || button.textContent?.includes(":onDeactivate")) fireEvent.click(button);
    const remove = state.result.remove as ReturnType<typeof mutation>;
    expect(remove.mutate).not.toHaveBeenCalled();
    expect(rendered.container.textContent?.length).toBeGreaterThan(0);
  });
  it("shows mutation errors and waits, successful reports, and selected restricted media", async () => {
    const page = await import("../../" + path);
    Object.assign(state.result, { canView: false, canSimulate: false, isPending: true, isError: true, error: new Error("Failed"), gpsLost: false, incident: null, fix: { position: [7, 80] }, current: null });
    Object.assign(state.result.view as Record<string, unknown>, { selected: { id: 1, restricted: true, title: "Restricted" }, lastUpdate: "10:00", attentionCount: 2 });
    for (const value of Object.values(state.result)) if (value && typeof value === "object" && "mutate" in value) Object.assign(value, { isPending: true, isError: true, isSuccess: true });
    const rendered = render(createElement(page.default as ComponentType));
    expect(rendered.container.innerHTML.length).toBeGreaterThan(0);
    if (path.includes("incident/new")) expect(screen.getByRole("status").textContent).toContain("Conflict reported in North");
  });
});
const formCases = [
  { path: "app/dashboard/users/page.tsx", child: "UserForm", field: "userId" },
  { path: "app/dashboard/routes/page.tsx", child: "RouteForm", field: "routeId" },
  { path: "app/dashboard/settings/zones/page.tsx", child: "ZoneForm", field: "zoneId" },
  { path: "app/dashboard/settings/incident-types/page.tsx", child: "IncidentTypeForm", field: "typeId" },
];
describe.each(formCases)("$child submits page identity", ({ path, child, field }) => {
  it.each([1, null])("passes current editing identity %s and closes on success", async (id) => {
    state.store.editingId = id;
    const page = await import("../../" + path);
    render(createElement(page.default as ComponentType));
    fireEvent.click(screen.getByRole("button", { name: `${child}:onSubmit` }));
    expect((state.result.save as ReturnType<typeof mutation>).mutate).toHaveBeenCalledWith({ [field]: id, values: { name: "Saved" } }, { onSuccess: actions.close });
    expect(actions.close).toHaveBeenCalledOnce();
  });
});
describe("Specific page interactions", () => {
  it("resets patrol deletion errors before editing and opening a new patrol", async () => {
    const page = await import("../../app/dashboard/patrols/page");
    render(createElement(page.default));
    fireEvent.click(screen.getByRole("button", { name: "PatrolsTable:onEdit" }));
    expect(actions.openEdit).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: /New patrol/ }));
    expect(actions.openNew).toHaveBeenCalledOnce();
    expect((state.result.remove as ReturnType<typeof mutation>).reset).toHaveBeenCalledTimes(2);
  });
  it("selects and clears incidents and scrolls to the detail panel", async () => {
    const page = await import("../../app/dashboard/incidents/page");
    render(createElement(page.default));
    fireEvent.click(screen.getByRole("button", { name: "IncidentsTable:onSelect" }));
    expect(actions.select).toHaveBeenCalledWith(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
    fireEvent.click(screen.getByRole("button", { name: "IncidentDetail:onClose" }));
    expect(actions.select).toHaveBeenLastCalledWith(null);
  });
  it("creates a park and closes its local form after success", async () => {
    const page = await import("../../app/dashboard/settings/parks/page");
    render(createElement(page.default));
    fireEvent.click(screen.getByRole("button", { name: /New park/ }));
    expect(screen.getByTestId("ParkForm")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "ParkForm:onSubmit" }));
    expect((state.result.create as ReturnType<typeof mutation>).mutate).toHaveBeenCalledWith({ name: "Saved" }, expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(screen.queryByTestId("ParkForm")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /New park/ }));
    fireEvent.click(screen.getByRole("button", { name: "ParkForm:onClose" }));
    expect(screen.queryByTestId("ParkForm")).toBeNull();
  });
  it("opens and closes dispatch completion for its route identity", async () => {
    const page = await import("../../app/ranger/dispatch/[id]/page");
    render(createElement(page.default));
    fireEvent.click(screen.getByRole("button", { name: "DispatchActions:onOpenAction" }));
    expect(actions.openAction).toHaveBeenCalledWith(1, "complete");
    fireEvent.click(screen.getByRole("button", { name: "DispatchActions:closeAction" }));
    expect(actions.close).toHaveBeenCalledOnce();
  });
  it("renders the no-sector success report without a location suffix", async () => {
    const submit = state.result.submit as ReturnType<typeof mutation>;
    submit.isSuccess = true;
    submit.data.sectorName = "";
    const page = await import("../../app/ranger/incident/new/page");
    render(createElement(page.default));
    expect(screen.getByRole("status").textContent).toMatch(/^Saved . Conflict reported\.$/);
  });
  it("renders the empty ranger assignment message", async () => {
    state.result.patrols = [];
    const page = await import("../../app/ranger/page");
    render(createElement(page.default));
    expect(screen.getByTestId("PageHeader").textContent).toContain("No patrols assigned for today.");
  });
});
