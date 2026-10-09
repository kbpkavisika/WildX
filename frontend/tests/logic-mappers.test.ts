import { describe, expect, it } from "vitest";
import type { IncidentResponse } from "@/lib/api/incidents";
import type { DeviceResponse } from "@/lib/api/devices";
import type { PatrolResponse, TrackPointResponse } from "@/lib/api/patrols";
import type { AlertResponse } from "@/lib/api/alerts";
import * as incidents from "@/lib/incidents/mappers";
import * as report from "@/lib/incidents/report-mappers";
import * as patrols from "@/lib/patrols/mappers";
import * as table from "@/lib/patrols/table-mappers";
import { toReplayView } from "@/lib/patrols/replay-mappers";
import { toRouteRow } from "@/lib/patrols/route-mappers";
import { toRangerPatrolCards, toRangerPatrolView } from "@/lib/patrols/ranger-mappers";
import { toCoverageView, toCoverageReportView } from "@/lib/patrols/coverage-mappers";
import { toTrendView, trendChange } from "@/lib/reports/mappers";
import { toDevicesView } from "@/lib/devices/mappers";
import { toUsersView } from "@/lib/users/mappers";
import { toZonesView, zoneDeleteError } from "@/lib/zones/mappers";
import { toCollarOptions, toCameraOptions, toZoneOptions } from "@/lib/simulator/mappers";
import { toAlertsView, toRangerAlertsView } from "@/lib/alerts/mappers";
import { ApiError } from "@/lib/api/client";
import { ALL } from "@/lib/incidents/types";
import { PATROL_FILTERS } from "@/lib/patrols/types";
import { DEVICE_FILTERS } from "@/lib/devices/types";
import { ALERT_FILTERS } from "@/lib/alerts/types";
import { ALERT_STATUSES, ALERT_TYPES, DEVICE_TYPES, DISPOSITIONS, INCIDENT_STATUSES, LOCATION_SOURCES, PATROL_STATUSES, ROLES, SEVERITIES, WAYPOINT_TYPES, ZONE_TYPES } from "@/lib/enums";

const now = new Date("2026-10-09T12:00:00Z");
const stamp = "2026-10-09T11:00:00Z";
const polygonGeojson = JSON.stringify({ type: "Polygon", coordinates: [[[80, 6], [81, 6], [81, 7], [80, 6]]] });
const incident: IncidentResponse = { id: 1, typeId: 2, typeName: "Fire", reporterName: "Alice", patrolId: null, lat: 6, lng: 80, locationSource: LOCATION_SOURCES.GPS, sectorName: null, description: null, photoPath: null, severity: SEVERITIES.HIGH, status: INCIDENT_STATUSES.NEW, occurredAt: stamp, resolutionNote: null, responderName: null };
const device: DeviceResponse = { id: 1, parkId: 1, type: DEVICE_TYPES.COLLAR, code: "C1", expectedIntervalMin: 60, animal: null, lat: null, lng: null, batteryPct: null, lastSeenAt: null };
const patrol: PatrolResponse = { id: 1, route: { id: 2, name: "East", pathGeojson: JSON.stringify({ type: "LineString", coordinates: [[80, 6], [81, 7]] }) }, rangerId: 3, rangerName: "Alice Brown", scheduledDate: "2026-10-09", status: PATROL_STATUSES.PLANNED, startedAt: null, endedAt: null, gpsAvailable: true };
const point: TrackPointResponse = { id: 1, lat: 6, lng: 80, recordedAt: stamp, isWaypoint: false, note: null, waypointType: null, sectorId: 1 };
const alert: AlertResponse = { id: 1, type: ALERT_TYPES.ZONE_BREACH, severity: SEVERITIES.HIGH, status: ALERT_STATUSES.OPEN, deviceId: 1, collarCode: null, animalName: null, zoneId: 1, zoneName: null, lat: null, lng: null, occurredAt: stamp, slaDueAt: null, acknowledgedByName: null, acknowledgedAt: null, resolvedAt: null, disposition: null, escalationLevel: 0, cameraImageId: 4 };

describe("incident mapping and aggregates", () => {
  it("sorts active types and resolves filter choices", () => {
    const types = [{ id: 1, name: "Zebra", defaultSeverity: SEVERITIES.LOW, active: true }, { id: 2, name: "Ant", defaultSeverity: SEVERITIES.CRITICAL, active: true }, { id: 3, name: "Bat", defaultSeverity: SEVERITIES.MEDIUM, active: false }];
    expect(incidents.toActiveTypeOptions(types).map((type) => type.id)).toEqual([2, 1]);
    expect(incidents.toIncidentTypesView(types)).toMatchObject({ activeCount: 2, inactiveCount: 1 });
    expect(incidents.toIncidentTypesView(types).rows.map((row) => row.id)).toEqual([2, 1, 3]);
    expect(incidents.toTypeFilter(ALL)).toBe(ALL);
    expect(incidents.toTypeFilter("2")).toBe(2);
    expect(incidents.toSeverityFilter("unknown")).toBe(ALL);
    expect(incidents.toSeverityFilter(SEVERITIES.HIGH)).toBe(SEVERITIES.HIGH);
  });
  it("maps every incident status and filters type and severity before counts", () => {
    const list = Object.values(INCIDENT_STATUSES).map((status, index) => ({ ...incident, id: index + 1, status, responderName: "Bob", resolutionNote: "Safe", sectorName: index ? "East" : null }));
    const view = incidents.toIncidentQueueView(list, { status: ALL, typeId: ALL, severity: ALL, query: "" }, now);
    expect(view.rows.map((row) => row.statusNote)).toEqual([null, "To Bob", "Safe", "Safe"]);
    expect(view.statusOptions[0].count).toBe(4);
    expect(view.newCount).toBe(1);
    expect(incidents.toIncidentQueueView(list, { status: INCIDENT_STATUSES.NEW, typeId: 2, severity: SEVERITIES.HIGH, query: "" }, now).rows).toHaveLength(1);
    expect(incidents.toIncidentQueueView(list, { status: ALL, typeId: 99, severity: SEVERITIES.LOW, query: "" }, now).rows).toEqual([]);
    expect(incidents.toIncidentQueueView([{ ...incident, status: INCIDENT_STATUSES.ASSIGNED }], { status: ALL, typeId: ALL, severity: ALL, query: "" }, now).rows[0].statusNote).toBeNull();
    const search = (query: string) => incidents.toIncidentQueueView(list, { status: ALL, typeId: ALL, severity: ALL, query }, now);
    expect(search("  inc-3 ").rows.map((row) => row.id)).toEqual([3]);
    expect(search("EAST").statusOptions[0].count).toBe(3);
    expect(search("bob").rows).toHaveLength(4);
    expect(search("nothing matches").rows).toEqual([]);
    for (const status of Object.values(INCIDENT_STATUSES)) {
      const detail = incidents.toIncidentDetailView({ ...incident, status, resolutionNote: "Safe", description: "Smoke", patrolId: 4, photoPath: "photo", locationSource: LOCATION_SOURCES.MANUAL }, now);
      expect(detail.position).toEqual([6, 80]);
      expect(detail.hasPhoto).toBe(true);
      expect(detail.canDispatchOrDismiss).toBe(status === INCIDENT_STATUSES.NEW);
      expect(detail.canChangeSeverity).toBe(status === INCIDENT_STATUSES.NEW || status === INCIDENT_STATUSES.ASSIGNED);
      expect(detail.facts.at(-1)?.label).toBe(status === INCIDENT_STATUSES.DISMISSED ? "Dismissal reason" : "Outcome");
    }
    expect(incidents.toIncidentDetailView({ ...incident, lat: null }, now).position).toBeNull();
    expect(incidents.toIncidentDetailView({ ...incident, lng: null }, now).position).toBeNull();
  });
  it("scales aggregate bars, drops missing coordinates and checks ranges", () => {
    const view = report.toIncidentReportView({ from: "2026-10-01", to: "2026-10-09", total: 3, byType: [{ id: 1, name: "Fire", count: 2 }, { id: null, name: null, count: 1 }], bySector: [{ id: null, name: null, count: 0 }], byMonth: [{ id: null, name: "2026-10", count: 3 }], points: [{ ...incident }, { ...incident, id: 2, lat: null }, { ...incident, id: 3, lng: null }] });
    expect(view.byType.map((bar) => bar.widthPct)).toEqual([100, 50]);
    expect(view.bySector[0]).toMatchObject({ label: "Outside sectors", widthPct: 0, highlighted: false });
    expect(view.byMonth[0].label).toBe("Oct 2026");
    expect(view.points).toHaveLength(1);
    expect(report.defaultReportRange(new Date(2026, 0, 15))).toEqual({ from: "2025-08-01", to: "2026-01-15" });
    expect(report.reportRangeError("", "2026-10-09")).toBe("Choose both dates");
    expect(report.reportRangeError("2026-10-09", "")).toBe("Choose both dates");
    expect(report.reportRangeError("2026-10-10", "2026-10-09")).toContain("before");
    expect(report.reportRangeError("2026-10-09", "2026-10-09")).toBeNull();
  });
});

describe("device, user and zone views", () => {
  it("prioritizes stale reporting over low battery and supports camera locations", () => {
    const list = [device, { ...device, id: 2, lastSeenAt: stamp, batteryPct: 10, animal: { id: 1, parkId: 1, name: "Ella", species: "Elephant" } }, { ...device, id: 3, type: DEVICE_TYPES.CAMERA, lat: 6, lng: 80, lastSeenAt: stamp, batteryPct: 80 }, { ...device, id: 4, type: DEVICE_TYPES.CAMERA, lastSeenAt: "2026-10-08T00:00:00Z", batteryPct: 5 }, { ...device, id: 5, lastSeenAt: stamp }];
    const view = toDevicesView(list, DEVICE_FILTERS.ALL, now);
    expect(view.rows.map((row) => row.health.label)).toEqual(["No data yet", "Low battery", "Reporting", "Not reporting", "Reporting"]);
    expect(view).toMatchObject({ collarCount: 3, cameraCount: 2, attentionCount: 2 });
    expect(view.rows[1].place).toBe("Ella");
    expect(toDevicesView(list, DEVICE_FILTERS.CAMERA, now).rows).toHaveLength(2);
    expect(toCollarOptions(list)).toHaveLength(3);
    expect(toCollarOptions(list)[1].label).toContain("Ella");
    expect(toCameraOptions(list)).toHaveLength(2);
  });
  it("blocks self deactivation and joins zone rules with polygon captions", () => {
    const users = [{ id: 1, name: "Alice", email: "a@example.com", phone: null, role: ROLES.MANAGER, parkId: 1, parkName: "Yala", active: true }, { id: 2, name: "Bob", email: "b@example.com", phone: "123", role: ROLES.RANGER, parkId: 1, parkName: "Yala", active: true }, { id: 3, name: "Chris", email: "c@example.com", phone: null, role: ROLES.CLO, parkId: null, parkName: null, active: false }];
    expect(toUsersView(users, 1).rows.map((row) => row.canDeactivate)).toEqual([false, true, false]);
    expect(toUsersView(users, null)).toMatchObject({ inactiveCount: 1, total: 3 });
    const zones = [{ id: 1, parkId: 1, name: "Field", type: ZONE_TYPES.FARMLAND, polygonGeojson }, { id: 2, parkId: 1, name: "Road", type: ZONE_TYPES.ROAD, polygonGeojson: "bad" }];
    const rules = [{ id: 1, parkId: 1, zoneType: ZONE_TYPES.FARMLAND, severity: SEVERITIES.HIGH, cooldownMin: 10, ackSlaMin: 5 }];
    const view = toZonesView(zones, rules);
    expect(view.rows[0]).toMatchObject({ caption: "Farmland · 3 corners", rule: { caption: "Acknowledge within 5 min" } });
    expect(view.rows[1]).toMatchObject({ caption: "Road · 0 corners", rule: null, rings: [] });
    expect(toZoneOptions(zones)[0]).toEqual({ value: "1", label: "Field · Farmland" });
    expect(zoneDeleteError(new ApiError(409), "Field")).toContain("cannot be deleted");
    expect(zoneDeleteError(new ApiError(500, "Server"), "Field")).toBe("Server");
    expect(zoneDeleteError(new Error(), "Field")).toContain("Could not reach");
  });
});

describe("patrol map, table and replay views", () => {
  it("maps sector shapes, open incident markers and live contact states", () => {
    const sector = { id: 1, name: "East", polygonGeojson };
    expect(patrols.toSectorShape(sector)?.rings[0][0]).toEqual([6, 80]);
    expect(patrols.toSectorShape({ ...sector, polygonGeojson: "bad" })).toBeNull();
    expect(patrols.toSectorShape({ ...sector, polygonGeojson: "{}" })).toBeNull();
    expect(patrols.toTrack(undefined)).toEqual([]);
    expect(patrols.toIncidentMarkers([incident, { ...incident, id: 2, sectorName: "East" }, { ...incident, status: INCIDENT_STATUSES.RESOLVED }, { ...incident, lng: null }, { ...incident, lat: null }])).toHaveLength(2);
    const live = { patrol, lastPosition: point, lastSeenAt: stamp, offline: false };
    const view = patrols.toActivePatrolsView([live, { ...live, lastSeenAt: null, lastPosition: null }, { ...live, offline: true }], new Map([[1, [point]]]), [sector, { ...sector, polygonGeojson: "bad" }], [incident], now);
    expect(view.sectors).toHaveLength(1);
    expect(view.lastUpdate).toBeTruthy();
    expect(view.patrols[0].title).toBe("East · East");
    expect(view.patrols[1].caption).toContain("no contact");
    expect(view.patrols[2].status.label).toBe("Offline");
    expect(patrols.toActivePatrolsView([], new Map(), [], [], now).lastUpdate).toBeNull();
    expect(patrols.toLivePatrol({ ...live, lastPosition: { ...point, sectorId: null } }, 0, undefined, new Map(), now).title).toBe("East");
  });
  it("maps every patrol status and optional recorded history", () => {
    const list = Object.values(PATROL_STATUSES).map((status, index) => ({ ...patrol, id: index + 1, status, scheduledDate: index ? "2026-10-08" : "2026-10-09", startedAt: index ? stamp : null, endedAt: status === PATROL_STATUSES.COMPLETED ? "2026-10-09T12:00:00Z" : null }));
    const history = [{ patrol: { id: 3 }, distanceM: 1234, durationSeconds: 3600 }];
    const view = table.toPatrolTableView(list, history, PATROL_FILTERS.ALL, now);
    expect(view).toMatchObject({ activeCount: 1, scheduledCount: 1 });
    expect(view.rows[2]).toMatchObject({ distance: "1.2 km", duration: "1 h", canReplay: true });
    expect(table.toPatrolRow(list[2], undefined, now).duration).toBeNull();
    expect(table.toPatrolTableView(list, history, PATROL_FILTERS.ACTIVE, now).rows).toHaveLength(1);
    expect(table.timeRange(patrol)).toBeNull();
    expect(table.timeRange({ ...patrol, startedAt: stamp })).toContain("From");
    expect(toRouteRow(patrol.route).points).toBe(2);
    expect(toRouteRow({ ...patrol.route, pathGeojson: "bad" })).toMatchObject({ points: 0, length: "0.0 km" });
    expect(toRangerPatrolCards(list, now)[0].id).toBe(2);
    for (const item of list) {
      const detail = toRangerPatrolView(item, [point], now);
      expect(detail.canStart).toBe(item.status === PATROL_STATUSES.PLANNED);
      expect(detail.isActive).toBe(item.status === PATROL_STATUSES.ACTIVE);
      expect(detail.completedAt !== null).toBe(item.status === PATROL_STATUSES.COMPLETED);
    }
    expect(toRangerPatrolView({ ...patrol, route: { ...patrol.route, pathGeojson: "bad" } }, [], now).route).toEqual([]);
  });
  it("clamps replay bounds and identifies waypoints", () => {
    const points = [point, { ...point, id: 2, lat: 7, lng: 81, isWaypoint: true, waypointType: WAYPOINT_TYPES.REST, note: "Rest" }, { ...point, id: 3, isWaypoint: true }];
    expect(patrols.toWaypoints(points).map((entry) => entry.label)).toEqual([expect.stringContaining("Rest"), expect.stringContaining("Waypoint")]);
    const history = { patrol: { id: 1 }, distanceM: 1000, durationSeconds: 120 };
    expect(toReplayView(patrol, history, points, null)).toMatchObject({ maxIndex: 2, position: [6, 80] });
    expect(toReplayView(patrol, undefined, points, 100).walked).toHaveLength(3);
    expect(toReplayView(patrol, history, points, 0).walked).toHaveLength(1);
    expect(toReplayView(patrol, undefined, [], null)).toMatchObject({ maxIndex: 0, position: null, track: [] });
  });
  it("orders neglected sectors and summarizes visited report rows", () => {
    const sectors = [null, 0, 1, 3].map((daysSinceLastPatrol, index) => ({ sectorId: index + 1, sectorName: "East", polygonGeojson: index ? polygonGeojson : "bad", lastPatrolledAt: index ? stamp : null, daysSinceLastPatrol, neglected: index === 0 }));
    const view = toCoverageView(sectors);
    expect(view.neglectedCount).toBe(1);
    expect(view.sectors.map((sector) => sector.status.label)).toEqual(["Never", "Today", "1 day", "3 days"]);
    const rows = sectors.map((sector, index) => ({ ...sector, pointCount: index, patrolCount: index }));
    expect(toCoverageReportView(rows, now)).toMatchObject({ visitedCount: 3, sectorCount: 4 });
    expect(toCoverageReportView(rows, now).rows[0].unvisited).toBe(true);
    const report = toCoverageReportView(rows, now);
    expect(report.rows.map((row) => row.level)).toEqual(["none", "low", "medium", "high"]);
    expect(report.highlights.map((highlight) => highlight.value)).toEqual(["75%", "East", "1 sector"]);
    expect(report.byPatrols.map((bar) => bar.count)).toEqual([3, 2, 1]);
    expect(report.byPatrols[0].highlighted).toBe(true);
    expect(report.pointShares.map((share) => share.pct)).toEqual([50, 33, 17]);
  });
  it("buckets daily counts into weeks with change and moving average", () => {
    const days = ["2026-10-05", "2026-10-06", "2026-10-12", "2026-10-13"].map((date, index) => ({ date, count: index + 1 }));
    const view = toTrendView(days, "week");
    expect(view.bars.map((bar) => bar.tooltip)).toEqual(["Week of 5 Oct · 3", "Week of 12 Oct · 7"]);
    expect(view.total).toBe(10);
    expect(view.change).toBe("+133%");
    expect(toTrendView(days, "day").bars).toHaveLength(4);
    expect(trendChange([4, 2])).toBe("−50%");
    expect(trendChange([0, 2])).toBe("New");
    expect(trendChange([0, 0])).toBe("0%");
    expect(trendChange([2])).toBeNull();
  });
});

describe("alert views", () => {
  it("filters all statuses and maps escalation, deadlines and handler permissions", () => {
    const list = [{ ...alert, escalationLevel: 1, slaDueAt: stamp }, { ...alert, id: 2, status: ALERT_STATUSES.ACKNOWLEDGED, collarCode: "C1", animalName: "Ella", lat: 6, lng: 80, acknowledgedAt: stamp, acknowledgedByName: "Alice", escalationLevel: 2 }, { ...alert, id: 3, status: ALERT_STATUSES.RESOLVED, zoneName: "Field", resolvedAt: stamp, disposition: DISPOSITIONS.FALSE_ALARM }];
    for (const item of list) {
      const view = toAlertsView(list, [{ id: 1, parkId: 1, name: "Field", type: ZONE_TYPES.FARMLAND, polygonGeojson }, { id: 2, parkId: 1, name: "Bad", type: ZONE_TYPES.ROAD, polygonGeojson: "bad" }], ALERT_FILTERS.ALL, item.id, ROLES.MANAGER, now);
      expect(view).toMatchObject({ openCount: 1, escalatedCount: 1 });
      expect(view.zones).toHaveLength(1);
      expect(view.selected?.canResolve).toBe(item.status !== ALERT_STATUSES.RESOLVED);
      expect(view.selected?.canAcknowledge).toBe(item.status === ALERT_STATUSES.OPEN);
      expect(view.selected?.cameraImageId).toBe(4);
    }
    expect(toAlertsView(list, [], ALERT_FILTERS.OPEN, null, null, now).rows).toHaveLength(1);
    expect(toAlertsView(list, [], ALERT_FILTERS.ALL, 1, null, now).selected).toMatchObject({ canResolve: false, canDispatch: false, cameraImageId: null });
    expect(toAlertsView([alert], [], ALERT_FILTERS.ALL, 1, ROLES.RANGER, now).selected?.status.label).toBe("Open");
    expect(toAlertsView([{ ...alert, slaDueAt: "2026-10-09T13:00:00Z", acknowledgedAt: stamp, resolvedAt: stamp }], [], ALERT_FILTERS.ALL, 1, ROLES.MANAGER, now).selected?.facts).toHaveLength(6);
    const ranger = toRangerAlertsView(list, 2, ROLES.RANGER, now);
    expect(ranger).toMatchObject({ openCount: 1, acknowledgedCount: 1 });
    expect(ranger.selected?.mapsUrl).toContain("6,80");
    expect(toRangerAlertsView(list, 1, null, now).selected?.mapsUrl).toBeNull();
    expect(toRangerAlertsView(list, 3, ROLES.RANGER, now).selected).toBeNull();
  });
});


