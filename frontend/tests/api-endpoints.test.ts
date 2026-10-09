import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import * as auth from "@/lib/api/auth";
import * as alerts from "@/lib/api/alerts";
import * as alertRules from "@/lib/api/alert-rules";
import * as alertReport from "@/lib/api/alert-report";
import * as segments from "@/lib/api/boundary-segments";
import * as cameras from "@/lib/api/camera-images";
import * as community from "@/lib/api/community";
import * as devices from "@/lib/api/devices";
import * as dispatches from "@/lib/api/dispatches";
import * as incidents from "@/lib/api/incidents";
import * as incidentTypes from "@/lib/api/incident-types";
import * as incidentReport from "@/lib/api/incident-report";
import * as notifications from "@/lib/api/notifications";
import * as parks from "@/lib/api/parks";
import * as patrols from "@/lib/api/patrols";
import * as publicReports from "@/lib/api/public-report";
import * as simulator from "@/lib/api/simulator";
import * as users from "@/lib/api/users";
import * as zones from "@/lib/api/zones";
import { fetchDashboard } from "@/lib/api/dashboard";

const transport = vi.hoisted(() => ({ send: vi.fn(), payload: null as unknown }));

vi.mock("@/lib/api/client", () => {
  const get = (path: string, schema: z.ZodType) => {
    transport.send("GET", path);
    return Promise.resolve(schema.parse(transport.payload));
  };
  const send = (method: string) => (path: string, body: unknown, schema: z.ZodType) => {
    transport.send(method, path, body);
    return Promise.resolve(schema.parse(transport.payload));
  };
  return {
    apiGet: get,
    apiPost: send("POST"),
    apiPut: send("PUT"),
    apiPatch: send("PATCH"),
    apiPostForm: send("FORM"),
    apiDelete: (path: string) => { transport.send("DELETE", path); return Promise.resolve(); },
    apiGetBlob: (path: string) => { transport.send("BLOB", path); return Promise.resolve(new Blob(["csv"])); },
  };
});

const at = "2026-10-09T08:00:00Z";
const from = "2026-10-01";
const to = "2026-10-09";
const session = { id: 1, name: "Manager", email: "manager@wildx.lk", role: "MANAGER", parkId: 1 } as const;
const park = { id: 1, name: "Yala", code: "YAL", neglectDays: 7 };
const parkInput = { name: "Yala", code: "YAL" };
const sector = { id: 1, name: "Sector 1", polygonGeojson: "{}" };
const sectorInput = { name: "Sector 1", polygonGeojson: "{}" };
const segment = { id: 2, parkId: 1, code: "B2", name: "North", centerLat: 6, centerLng: 81 };
const segmentInput = { code: "B2", name: "North", centerLat: 6, centerLng: 81 };
const route = { id: 3, name: "North route", pathGeojson: "{}" };
const routeInput = { name: "North route", pathGeojson: "{}" };
const patrol = { id: 4, route, rangerId: 2, rangerName: "Ranger", scheduledDate: to, status: "PLANNED", startedAt: null, endedAt: null, gpsAvailable: true };
const point = { id: 5, lat: 6, lng: 81, recordedAt: at, isWaypoint: false, note: null, waypointType: null, sectorId: null };
const pointInput = { lat: 6, lng: 81, recordedAt: at, accuracyM: null };
const assign = { routeId: 3, rangerIds: [2], scheduledDate: to };
const patrolUpdate = { routeId: 3, rangerId: 2, scheduledDate: to };
const incident = { id: 6, typeId: 1, typeName: "Snare", reporterName: "Ranger", patrolId: null, lat: null, lng: null, locationSource: "GPS", sectorName: null, description: null, photoPath: null, severity: "HIGH", status: "NEW", occurredAt: at, resolutionNote: null, responderName: null };
const incidentInput = { typeId: 1, lat: 6, lng: 81, locationSource: "GPS", description: null, occurredAt: at } as const;
const typeInput = { name: "Snare", defaultSeverity: "HIGH", active: true } as const;
const type = { id: 1, ...typeInput };
const animal = { id: 1, parkId: 1, name: "Gemunu", species: "Elephant" };
const animalInput = { name: "Gemunu", species: "Elephant" };
const device = { id: 1, parkId: 1, type: "COLLAR", code: "COL1", expectedIntervalMin: 5, animal, lat: null, lng: null, batteryPct: null, lastSeenAt: null };
const deviceInput = { type: "COLLAR", code: "COL1", expectedIntervalMin: 5, animalId: 1, lat: null, lng: null } as const;
const alert = { id: 1, type: "ZONE_BREACH", severity: "HIGH", status: "OPEN", deviceId: null, collarCode: null, animalName: null, zoneId: null, zoneName: null, lat: null, lng: null, occurredAt: at, slaDueAt: null, acknowledgedByName: null, acknowledgedAt: null, resolvedAt: null, disposition: null, escalationLevel: 0, cameraImageId: null };
const ruleInput = { severity: "HIGH", cooldownMin: 5, ackSlaMin: 10 } as const;
const rule = { id: 1, parkId: 1, zoneType: "ROAD", ...ruleInput };
const zoneInput = { name: "Road", type: "ROAD", polygonGeojson: "{}" } as const;
const zone = { id: 1, parkId: 1, ...zoneInput };
const notification = { id: 1, title: "Alert", body: "New alert", link: null, sentAt: at, readAt: null };
const accountInput = { name: "Ranger", email: "ranger@wildx.lk", phone: "0771234567", password: "password", role: "RANGER", active: true } as const;
const account = { id: 2, name: accountInput.name, email: accountInput.email, phone: null, role: "RANGER", parkId: 1, parkName: "Yala", active: true };
const dispatchInput = { sourceType: "INCIDENT", sourceId: 6, responderId: 2, note: null } as const;
const dispatch = { id: 1, ...dispatchInput, responderName: "Ranger", assignedByName: null, status: "ASSIGNED", assignedAt: at, acknowledgedAt: null, completedAt: null, outcome: null };
const camera = { id: 1, cameraCode: "CAM1", capturedAt: at, status: "PENDING", species: null, animalCount: null, reviewedByName: null, reviewedAt: null };
const tag = { status: "EMPTY", species: null, animalCount: null } as const;
const communityReport = { id: 1, referenceCode: "R-1", parkId: 1, segmentId: null, segmentCode: null, segmentName: null, channel: "WEB", reporterPhone: "0771234567", type: "SIGHTING", animalCount: 1, description: null, photoPath: null, lat: null, lng: null, rawText: null, status: "NEW", duplicateOfId: null, duplicateOfRef: null, severity: null, invalidReason: null, outcome: null, createdAt: at, closedAt: null };
const publicReport = { referenceCode: "R-1", status: "NEW", type: "SIGHTING", animalCount: 1, description: null, landmarkCode: null, segmentName: null, photoPath: null, outcome: null, createdAt: null, closedAt: null };
const publicInput = { parkId: 1, type: "SIGHTING", animalCount: 1, reporterPhone: "0771234567" } as const;
const simulation = { sent: 2, stored: 1, duplicates: 1 };
const collarInput = { collarCode: "COL1", scenario: "SINGLE_FIX", lat: 6, lng: 81, zoneId: null } as const;
const cameraInput = { cameraCode: "CAM1", count: 2 };

interface EndpointCase {
  name: string;
  run: () => Promise<unknown>;
  method: string;
  path: string;
  payload?: unknown;
  body?: unknown;
}

const cases: EndpointCase[] = [
  { name: "CMN-01 login", run: () => auth.login({ email: session.email, password: "password" }), method: "POST", path: "/auth/login", payload: { token: "jwt", user: session }, body: { email: session.email, password: "password" } },
  { name: "CMN-12 parks", run: parks.fetchParks, method: "GET", path: "/parks", payload: [park] },
  { name: "CMN-12 create park", run: () => parks.createPark(parkInput), method: "POST", path: "/parks", payload: park, body: parkInput },
  { name: "CMN-12 switch park", run: () => parks.switchPark(1), method: "POST", path: "/parks/1/switch", payload: session, body: null },
  { name: "CMN-03 coverage settings", run: () => parks.updateCoverageSettings(1, 7), method: "PUT", path: "/parks/1/coverage-settings", payload: null, body: { neglectDays: 7 } },
  { name: "CMN-03 sectors", run: () => parks.fetchSectors(1), method: "GET", path: "/parks/1/sectors", payload: [sector] },
  { name: "CMN-03 create sector", run: () => parks.createSector(1, sectorInput), method: "POST", path: "/parks/1/sectors", payload: sector, body: sectorInput },
  { name: "CMN-03 update sector", run: () => parks.updateSector(1, 1, sectorInput), method: "PUT", path: "/parks/1/sectors/1", payload: sector, body: sectorInput },
  { name: "CMN-03 delete sector", run: () => parks.deleteSector(1, 1), method: "DELETE", path: "/parks/1/sectors/1" },
  { name: "PAT-10 live patrols", run: patrols.fetchLivePatrols, method: "GET", path: "/monitor/live", payload: [{ patrol, lastPosition: null, lastSeenAt: null, offline: true }] },
  { name: "PAT-12 track", run: () => patrols.fetchTrack(4), method: "GET", path: "/patrols/4/track", payload: [point] },
  { name: "PAT-02 patrols", run: patrols.fetchPatrols, method: "GET", path: "/patrols", payload: [patrol] },
  { name: "PAT-12 history", run: patrols.fetchPatrolHistory, method: "GET", path: "/patrols/history", payload: [{ patrol: { id: 4 }, distanceM: 100, durationSeconds: 60 }] },
  { name: "PAT-01 routes", run: patrols.fetchRoutes, method: "GET", path: "/routes", payload: [route] },
  { name: "PAT-01 create route", run: () => patrols.createRoute(routeInput), method: "POST", path: "/routes", payload: route, body: routeInput },
  { name: "PAT-01 update route", run: () => patrols.updateRoute(3, routeInput), method: "PUT", path: "/routes/3", payload: route, body: routeInput },
  { name: "PAT-01 delete route", run: () => patrols.deleteRoute(3), method: "DELETE", path: "/routes/3" },
  { name: "PAT-02 rangers", run: patrols.fetchRangers, method: "GET", path: "/rangers", payload: [{ id: 2, name: "Ranger", role: "RANGER" }] },
  { name: "PAT-02 assign", run: () => patrols.assignPatrol(assign), method: "POST", path: "/patrols", payload: [patrol], body: assign },
  { name: "PAT-02 update", run: () => patrols.updatePatrol(4, patrolUpdate), method: "PUT", path: "/patrols/4", payload: patrol, body: patrolUpdate },
  { name: "PAT-02 delete", run: () => patrols.deletePatrol(4), method: "DELETE", path: "/patrols/4" },
  { name: "PAT-03 my patrols", run: patrols.fetchMyPatrols, method: "GET", path: "/me/patrols", payload: [patrol] },
  { name: "PAT-04 start", run: () => patrols.startPatrol(4, at), method: "POST", path: "/patrols/4/start", payload: patrol, body: { at } },
  { name: "PAT-08 end", run: () => patrols.endPatrol(4, at), method: "POST", path: "/patrols/4/end", payload: patrol, body: { at } },
  { name: "PAT-07 GPS", run: () => patrols.reportGps(4, false), method: "POST", path: "/patrols/4/gps", payload: patrol, body: { available: false } },
  { name: "PAT-05 points", run: () => patrols.recordPoints(4, [pointInput]), method: "POST", path: "/patrols/4/points", payload: [point], body: [pointInput] },
  { name: "PAT-11 coverage", run: patrols.fetchCoverage, method: "GET", path: "/monitor/coverage", payload: [{ sectorId: 1, sectorName: "North", polygonGeojson: "{}", lastPatrolledAt: null, daysSinceLastPatrol: null, neglected: true }] },
  { name: "PAT-13 coverage report", run: () => patrols.fetchCoverageReport(from, to), method: "GET", path: `/reports/coverage?from=${from}&to=${to}`, payload: [{ sectorId: 1, sectorName: "North", pointCount: 0, patrolCount: 0, lastPatrolledAt: null }] },
  { name: "PAT-13 coverage CSV", run: () => patrols.fetchCoverageReportCsv(from, to), method: "BLOB", path: `/reports/coverage?from=${from}&to=${to}&format=csv` },
  { name: "INC-08 incidents", run: incidents.fetchIncidents, method: "GET", path: "/incidents", payload: [incident] },
  { name: "INC-10 my incidents", run: incidents.fetchMyIncidents, method: "GET", path: "/me/incidents", payload: [incident] },
  { name: "INC-08 incident", run: () => incidents.fetchIncident(6), method: "GET", path: "/incidents/6", payload: incident },
  { name: "INC-02 photo", run: () => incidents.fetchIncidentPhoto(6), method: "BLOB", path: "/incidents/6/photo" },
  { name: "INC-08 severity", run: () => incidents.changeIncidentSeverity(6, "CRITICAL"), method: "PATCH", path: "/incidents/6", payload: incident, body: { severity: "CRITICAL" } },
  { name: "INC-08 dismiss", run: () => incidents.dismissIncident(6, "False report"), method: "POST", path: "/incidents/6/dismiss", payload: incident, body: { reason: "False report" } },
  { name: "INC-01 types", run: () => incidentTypes.fetchIncidentTypes(1), method: "GET", path: "/parks/1/incident-types", payload: [type] },
  { name: "INC-01 create type", run: () => incidentTypes.createIncidentType(1, typeInput), method: "POST", path: "/parks/1/incident-types", payload: type, body: typeInput },
  { name: "INC-01 update type", run: () => incidentTypes.updateIncidentType(1, 1, typeInput), method: "PUT", path: "/parks/1/incident-types/1", payload: type, body: typeInput },
  { name: "INC-01 delete type", run: () => incidentTypes.deleteIncidentType(1, 1), method: "DELETE", path: "/parks/1/incident-types/1" },
  { name: "INC-11 report", run: () => incidentReport.fetchIncidentReport(from, to), method: "GET", path: `/reports/incidents?from=${from}&to=${to}`, payload: { from, to, total: 0, byType: [], bySector: [], byMonth: [], points: [] } },
  { name: "INC-11 CSV", run: () => incidentReport.fetchIncidentReportCsv(from, to), method: "BLOB", path: `/reports/incidents?from=${from}&to=${to}&format=csv` },
  { name: "SEN-01 devices", run: () => devices.fetchDevices(1), method: "GET", path: "/parks/1/devices", payload: [device] },
  { name: "SEN-01 animals", run: () => devices.fetchAnimals(1), method: "GET", path: "/parks/1/animals", payload: [animal] },
  { name: "SEN-01 create animal", run: () => devices.createAnimal(1, animalInput), method: "POST", path: "/parks/1/animals", payload: animal, body: animalInput },
  { name: "SEN-01 create device", run: () => devices.createDevice(1, deviceInput), method: "POST", path: "/parks/1/devices", payload: device, body: deviceInput },
  { name: "SEN-07 alerts", run: alerts.fetchAlerts, method: "GET", path: "/alerts", payload: [alert] },
  { name: "SEN-08 acknowledge", run: () => alerts.acknowledgeAlert(1), method: "POST", path: "/alerts/1/acknowledge", payload: alert, body: {} },
  { name: "SEN-10 resolve", run: () => alerts.resolveAlert(1, "NO_ACTION"), method: "POST", path: "/alerts/1/resolve", payload: alert, body: { disposition: "NO_ACTION" } },
  { name: "SEN-03 rules", run: () => alertRules.fetchAlertRules(1), method: "GET", path: "/parks/1/alert-rules", payload: [rule] },
  { name: "SEN-03 save rule", run: () => alertRules.saveAlertRule(1, "ROAD", ruleInput), method: "PUT", path: "/parks/1/alert-rules/ROAD", payload: rule, body: ruleInput },
  { name: "SEN-03 delete rule", run: () => alertRules.deleteAlertRule(1, "ROAD"), method: "DELETE", path: "/parks/1/alert-rules/ROAD" },
  { name: "SEN-02 zones", run: () => zones.fetchZones(1), method: "GET", path: "/parks/1/zones", payload: [zone] },
  { name: "SEN-02 create zone", run: () => zones.createZone(1, zoneInput), method: "POST", path: "/parks/1/zones", payload: zone, body: zoneInput },
  { name: "SEN-02 update zone", run: () => zones.updateZone(1, 1, zoneInput), method: "PUT", path: "/parks/1/zones/1", payload: zone, body: zoneInput },
  { name: "SEN-02 delete zone", run: () => zones.deleteZone(1, 1), method: "DELETE", path: "/parks/1/zones/1" },
  { name: "SEN-16 report", run: () => alertReport.fetchAlertReport(from, to), method: "GET", path: `/reports/alerts?from=${from}&to=${to}`, payload: { from, to, total: 0, medianAcknowledgeMinutes: null, medianResolveMinutes: null, rows: [] } },
  { name: "SEN-16 CSV", run: () => alertReport.fetchAlertReportCsv(from, to), method: "BLOB", path: `/reports/alerts?from=${from}&to=${to}&format=csv` },
  { name: "SEN-14 bursts", run: () => cameras.fetchCameraBursts(1), method: "GET", path: "/parks/1/camera-images", payload: [{ cameraCode: "CAM1", startedAt: at, endedAt: at, images: [camera] }] },
  { name: "SEN-14 file", run: () => cameras.fetchCameraImageFile(1, 1), method: "BLOB", path: "/parks/1/camera-images/1/file" },
  { name: "SEN-15 audited file", run: () => cameras.fetchRestrictedImageFile(1, 1, "review & check"), method: "BLOB", path: "/parks/1/camera-images/1/file?reason=review%20%26%20check" },
  { name: "SEN-14 tag", run: () => cameras.tagCameraImage(1, 1, tag), method: "POST", path: "/parks/1/camera-images/1/tag", payload: camera, body: tag },
  { name: "SEN-04 simulate fixes", run: () => simulator.simulateCollarFixes(1, collarInput), method: "POST", path: "/parks/1/simulator/collar-fixes", payload: simulation, body: collarInput },
  { name: "SEN-13 simulate images", run: () => simulator.simulateCameraImages(1, cameraInput), method: "POST", path: "/parks/1/simulator/camera-images", payload: simulation, body: cameraInput },
  { name: "CMN-07 notifications", run: notifications.fetchMyNotifications, method: "GET", path: "/me/notifications", payload: { unreadCount: 1, notifications: [notification] } },
  { name: "CMN-07 read", run: () => notifications.markNotificationRead(1), method: "POST", path: "/notifications/1/read", payload: notification, body: {} },
  { name: "CMN-02 users", run: users.fetchUsers, method: "GET", path: "/users", payload: [account] },
  { name: "CMN-02 create user", run: () => users.createUser(accountInput), method: "POST", path: "/users", payload: account, body: accountInput },
  { name: "CMN-02 update user", run: () => users.updateUser(2, accountInput), method: "PUT", path: "/users/2", payload: account, body: accountInput },
  { name: "CMN-02 deactivate", run: () => users.deactivateUser(2), method: "DELETE", path: "/users/2" },
  { name: "CMN-06 nearby responders", run: () => dispatches.fetchResponders([6, 81]), method: "GET", path: "/responders?lat=6&lng=81", payload: [{ id: 2, name: "Ranger", distanceM: null, offline: true, lastSeenAt: null }] },
  { name: "CMN-06 all responders", run: () => dispatches.fetchResponders(null), method: "GET", path: "/responders", payload: [] },
  { name: "CMN-06 create dispatch", run: () => dispatches.createDispatch(dispatchInput), method: "POST", path: "/dispatches", payload: dispatch, body: dispatchInput },
  { name: "CMN-06 my dispatches", run: dispatches.fetchMyDispatches, method: "GET", path: "/me/dispatches", payload: [dispatch] },
  { name: "CMN-06 dispatch", run: () => dispatches.fetchDispatch(1), method: "GET", path: "/dispatches/1", payload: dispatch },
  { name: "CMN-06 acknowledge dispatch", run: () => dispatches.acknowledgeDispatch(1), method: "POST", path: "/dispatches/1/acknowledge", payload: dispatch, body: {} },
  { name: "CMN-06 complete", run: () => dispatches.completeDispatch(1, "Resolved"), method: "POST", path: "/dispatches/1/complete", payload: dispatch, body: { outcome: "Resolved" } },
  { name: "CMN-06 decline", run: () => dispatches.declineDispatch(1, null), method: "POST", path: "/dispatches/1/decline", payload: dispatch, body: { reason: null } },
  { name: "COM-01 segments", run: () => segments.fetchSegments(1), method: "GET", path: "/parks/1/segments", payload: [segment] },
  { name: "COM-01 create segment", run: () => segments.createSegment(1, segmentInput), method: "POST", path: "/parks/1/segments", payload: segment, body: segmentInput },
  { name: "COM-01 update segment", run: () => segments.updateSegment(1, 2, segmentInput), method: "PUT", path: "/parks/1/segments/2", payload: segment, body: segmentInput },
  { name: "COM-01 delete segment", run: () => segments.deleteSegment(1, 2), method: "DELETE", path: "/parks/1/segments/2" },
  { name: "COM-02 default public segments", run: () => publicReports.fetchPublicSegments(), method: "GET", path: "/public/parks/1/segments", payload: [segment] },
  { name: "COM-02 park public segments", run: () => publicReports.fetchPublicSegments(2), method: "GET", path: "/public/parks/2/segments", payload: [] },
  { name: "COM-12 encoded reference", run: () => publicReports.fetchPublicReport("R/1 ?"), method: "GET", path: "/public/reports/R%2F1%20%3F", payload: publicReport },
  { name: "COM-02 public submit", run: () => publicReports.submitPublicReport(publicInput), method: "POST", path: "/public/reports", payload: publicReport, body: publicInput },
];

beforeEach(() => {
  transport.payload = null;
});

describe("frontend endpoint contracts", () => {
  it.each(cases)("$name", async ({ run, method, path, payload, body }) => {
    transport.payload = payload;
    const result = await run();
    expect(transport.send).toHaveBeenCalledExactlyOnceWith(...(body === undefined ? [method, path] : [method, path, body]));
    if (method === "BLOB") expect(result).toBeInstanceOf(Blob);
    else if (method === "DELETE") expect(result).toBeUndefined();
    else expect(result).toEqual(payload);
  });

  it.each(cases.filter(({ method }) => !["BLOB", "DELETE"].includes(method)))("$name rejects malformed response data", async ({ run }) => {
    transport.payload = { invalid: true };
    await expect(async () => run()).rejects.toBeInstanceOf(z.ZodError);
  });

  it.each([false, true])("INC-02 multipart incident with photo=%s", async (withPhoto) => {
    transport.payload = incident;
    const photo = withPhoto ? new File(["image"], "evidence.jpg") : null;
    expect(await incidents.reportIncident(incidentInput, photo)).toEqual(incident);
    const [method, path, form] = transport.send.mock.calls[0] as [string, string, FormData];
    expect([method, path]).toEqual(["FORM", "/incidents"]);
    expect(form.get("data")).toBeInstanceOf(Blob);
    expect(form.has("photo")).toBe(withPhoto);
    if (photo) expect((form.get("photo") as File).name).toBe("evidence.jpg");
  });

  it("COM-02 sends multipart public reports when a photo is attached", async () => {
    transport.payload = publicReport;
    await publicReports.submitPublicReport(publicInput, new File(["image"], "elephant.jpg"));
    const [method, path, form] = transport.send.mock.calls[0] as [string, string, FormData];
    expect([method, path]).toEqual(["FORM", "/public/reports"]);
    expect(form.get("data")).toBeInstanceOf(Blob);
    expect((form.get("photo") as File).name).toBe("elephant.jpg");
  });

  it.each([undefined, 2])("COM report scoping for park=%s", async (parkId) => {
    const query = parkId ? `?parkId=${parkId}` : "";
    const reportQuery = parkId ? `&parkId=${parkId}` : "";
    transport.payload = communityReport;
    await community.fetchCommunityReport(1, parkId);
    expect(transport.send).toHaveBeenLastCalledWith("GET", `/community-reports/1${query}`);
    const location = { segmentId: 2, lat: 6, lng: 81 };
    await community.updateReportLocation(1, location, parkId);
    expect(transport.send).toHaveBeenLastCalledWith("PUT", `/community-reports/1/location${query}`, location);
    await community.validateReport(1, "HIGH", parkId);
    expect(transport.send).toHaveBeenLastCalledWith("POST", `/community-reports/1/validate${query}`, { severity: "HIGH" });
    await community.invalidateReport(1, "False alarm", parkId);
    expect(transport.send).toHaveBeenLastCalledWith("POST", `/community-reports/1/invalidate${query}`, { reason: "False alarm" });
    await community.fetchCommunityReportPhoto(1, parkId);
    expect(transport.send).toHaveBeenLastCalledWith("BLOB", `/community-reports/1/photo${query}`);
    transport.payload = [];
    await community.fetchHotspots(parkId);
    expect(transport.send).toHaveBeenLastCalledWith("GET", `/community/hotspots${query}`);
    await community.fetchConflictTrends(from, to, parkId);
    expect(transport.send).toHaveBeenLastCalledWith("GET", `/reports/conflicts?from=${from}&to=${to}${reportQuery}&format=json`);
    await community.fetchConflictTrendsCsv(from, to, parkId);
    expect(transport.send).toHaveBeenLastCalledWith("BLOB", `/reports/conflicts?from=${from}&to=${to}${reportQuery}&format=csv`);
    transport.payload = { parkId: 1, parkName: "Yala", shortCode: "1992", format: "TYPE PLACE", example: "ELEPHANT NORTH", helpReply: "Help", keywords: [], landmarks: [] };
    await community.fetchSmsHelpCard(parkId);
    expect(transport.send).toHaveBeenLastCalledWith("GET", `/community/sms-help-card${query}`);
  });

  it.each([
    [undefined, undefined, ""],
    ["ALL", undefined, ""],
    ["NEW", undefined, "?status=NEW"],
    ["ALL", 2, "?parkId=2"],
    ["NEEDS_LOCATION", 2, "?status=NEEDS_LOCATION&parkId=2"],
  ] as const)("COM queue status=%s park=%s", async (status, parkId, query) => {
    transport.payload = [communityReport];
    expect(await community.fetchCommunityReports(status, parkId)).toEqual([communityReport]);
    expect(transport.send).toHaveBeenLastCalledWith("GET", `/community-reports${query}`);
  });

  it("dashboard demo schedules use today and tomorrow at the expected hours", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 9, 12));
    const dashboard = await fetchDashboard();
    expect(dashboard.metrics).toMatchObject({ collarsReporting: 12, collarsTotal: 13, imagesToReview: 48 });
    expect(dashboard.conflict.monthly).toHaveLength(6);
    expect(dashboard.schedule).toHaveLength(2);
    expect(new Date(dashboard.schedule[0].start).getHours()).toBe(19);
    expect(new Date(dashboard.schedule[0].start).getDate()).toBe(9);
    expect(new Date(dashboard.schedule[1].start).getDate()).toBe(10);
    expect(new Date(dashboard.schedule[1].end).getHours()).toBe(10);
  });
});
