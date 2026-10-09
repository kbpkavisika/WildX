import { afterEach, describe, expect, it, vi } from "vitest";
import * as device from "@/lib/devices/device-form";
import * as user from "@/lib/users/user-form";
import * as zone from "@/lib/zones/zone-form";
import * as rule from "@/lib/zones/rule-form";
import * as parks from "@/lib/parks/forms";
import * as simulator from "@/lib/simulator/forms";
import * as tag from "@/lib/camera/tag-form";
import * as incidentType from "@/lib/incidents/incident-type-form";
import * as incident from "@/lib/incidents/report-form";
import * as patrol from "@/lib/patrols/patrol-form";
import * as route from "@/lib/patrols/route-form";
import * as waypoint from "@/lib/patrols/waypoint-form";
import * as dispatch from "@/lib/dispatch/dispatch-form";
import * as task from "@/lib/dispatch/task-forms";
import { reasonSchema } from "@/lib/camera/reason-form";
import { dismissSchema } from "@/lib/incidents/dismiss-form";
import { resolveSchema } from "@/lib/alerts/resolve-form";
import { signInSchema, signInErrorMessage } from "@/lib/auth/sign-in-form";
import { ApiError } from "@/lib/api/client";
import { CAMERA_IMAGE_STATUSES, DEVICE_TYPES, DISPOSITIONS, LOCATION_SOURCES, ROLES, SEVERITIES, SIMULATION_SCENARIOS, SOURCE_TYPES, WAYPOINT_TYPES, ZONE_TYPES } from "@/lib/enums";

const boundary = JSON.stringify({ type: "Polygon", coordinates: [[[80, 6], [81, 6], [81, 7], [80, 6]]] });
afterEach(() => vi.useRealTimers());

describe("device and account validation", () => {
  it("validates numeric limits and conditionally required device fields", () => {
    for (const value of ["", "bad", "Infinity", "91", "-91"]) expect(device.isLatitude(value)).toBe(false);
    for (const value of ["-90", "0", "90"]) expect(device.isLatitude(value)).toBe(true);
    expect(device.isLongitude("180")).toBe(true);
    expect(device.isLongitude("181")).toBe(false);
    const collar = { ...device.EMPTY_DEVICE, code: " C1 ", animalId: "4" };
    expect(device.deviceFormSchema.parse(collar).code).toBe("C1");
    expect(device.toDeviceRequest(collar)).toMatchObject({ animalId: 4, lat: null, lng: null, expectedIntervalMin: 60 });
    expect(device.deviceFormSchema.safeParse({ ...collar, animalId: "" }).success).toBe(false);
    const camera = { ...collar, type: DEVICE_TYPES.CAMERA, animalId: "", lat: "6", lng: "80" };
    expect(device.deviceFormSchema.safeParse(camera).success).toBe(true);
    expect(device.toDeviceRequest(camera)).toMatchObject({ animalId: null, lat: 6, lng: 80 });
    expect(device.deviceFormSchema.safeParse({ ...camera, lat: "", lng: "" }).success).toBe(false);
    for (const expectedIntervalMin of ["0", "10081", "1.5", "bad"]) expect(device.deviceFormSchema.safeParse({ ...collar, expectedIntervalMin }).success).toBe(false);
    for (const expectedIntervalMin of ["1", "10080"]) expect(device.deviceFormSchema.safeParse({ ...collar, expectedIntervalMin }).success).toBe(true);
    expect(device.animalFormSchema.safeParse(device.EMPTY_ANIMAL).success).toBe(false);
    expect(device.toAnimalRequest(device.animalFormSchema.parse({ name: " Ella ", species: " Elephant " }))).toEqual({ name: "Ella", species: "Elephant" });
  });
  it("requires a create password but permits unchanged edit passwords", () => {
    const values = { ...user.EMPTY_USER, name: "Alice", email: "alice@example.com", role: ROLES.RANGER };
    expect(user.userSchema(true).safeParse(values).success).toBe(false);
    expect(user.userSchema(false).safeParse(values).success).toBe(true);
    expect(user.userSchema(false).safeParse({ ...values, password: "short" }).success).toBe(false);
    expect(user.userSchema(true).safeParse({ ...values, password: "12345678" }).success).toBe(true);
    expect(user.userSchema(false).safeParse({ ...values, role: "" }).success).toBe(false);
    for (const phone of [null, "123"]) expect(user.toUserValues({ ...values, id: 1, parkId: null, parkName: null, phone }).phone).toBe(phone ?? "");
    expect(user.toUserRequest(user.EMPTY_USER).role).toBe(ROLES.RANGER);
    expect(user.toUserRequest(values).role).toBe(ROLES.RANGER);
    expect(user.userErrorMessage(new ApiError(409))).toContain("already in use");
    expect(user.userErrorMessage(new ApiError(400, "invalid"))).toBe("invalid");
    expect(user.userErrorMessage(new Error())).toContain("Could not reach");
    expect(signInSchema.safeParse({ email: "a@example.com", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "bad", password: "" }).success).toBe(false);
    expect(signInErrorMessage(new ApiError(401, "No access"))).toBe("No access");
    expect(signInErrorMessage(new Error())).toContain("Try again");
  });
});

describe("park, zone and rule forms", () => {
  it("checks polygon closure, coordinate bounds and distinct corners", () => {
    expect(zone.parseBoundary(boundary)).toEqual([[[6, 80], [6, 81], [7, 81], [6, 80]]]);
    for (const value of ["bad", "null", JSON.stringify({ type: "Point" }), JSON.stringify({ type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] }), JSON.stringify({ type: "Polygon", coordinates: [[[0, 0], [1, 0], [0, 0], [0, 0]]] }), JSON.stringify({ type: "Polygon", coordinates: [[[181, 0], [1, 0], [1, 1], [181, 0]]] })]) expect(zone.parseBoundary(value)).toBeNull();
    const values = { name: "Field", type: ZONE_TYPES.FARMLAND, boundary };
    expect(zone.zoneFormSchema.safeParse(values).success).toBe(true);
    expect(zone.zoneFormSchema.safeParse(zone.EMPTY_ZONE).success).toBe(false);
    const request = zone.toZoneRequest(values);
    expect(zone.toZoneValues({ ...request, id: 1, parkId: 1 })).toEqual(values);
    const sector = { id: 1, parkId: 1, name: "East", polygonGeojson: boundary, neglectDays: 7 };
    expect(parks.toSectorRequest(parks.toSectorValues(sector))).toEqual({ name: "East", polygonGeojson: boundary });
    expect(parks.sectorCaption(sector)).toBe("3 corners");
    expect(parks.sectorCaption({ ...sector, polygonGeojson: "bad" })).toBe("0 corners");
    expect(parks.sectorFormSchema.safeParse({ name: "East", boundary }).success).toBe(true);
    expect(parks.sectorFormSchema.safeParse(parks.EMPTY_SECTOR).success).toBe(false);
    expect(parks.toParkRequest(parks.parkFormSchema.parse({ name: " Yala ", code: " ya " }))).toEqual({ name: "Yala", code: "YA" });
    expect(parks.parkFormSchema.safeParse(parks.EMPTY_PARK).success).toBe(false);
  });
  it("checks integer minute and neglect day bounds", () => {
    for (const neglectDays of ["1", "3650"]) expect(parks.neglectFormSchema.safeParse({ neglectDays }).success).toBe(true);
    for (const neglectDays of ["0", "3651", "bad", "1.5"]) expect(parks.neglectFormSchema.safeParse({ neglectDays }).success).toBe(false);
    expect(rule.toRuleRequest(rule.toRuleValues({ id: 1, parkId: 1, zoneType: ZONE_TYPES.ROAD, severity: SEVERITIES.HIGH, cooldownMin: 0, ackSlaMin: 1440 }))).toEqual({ severity: SEVERITIES.HIGH, cooldownMin: 0, ackSlaMin: 1440 });
    expect(rule.ruleFormSchema.safeParse(rule.EMPTY_RULE).success).toBe(true);
    for (const value of ["bad", "-1", "1441"]) expect(rule.ruleFormSchema.safeParse({ ...rule.EMPTY_RULE, cooldownMin: value }).success).toBe(false);
    expect(rule.ruleFormSchema.safeParse({ ...rule.EMPTY_RULE, ackSlaMin: "0" }).success).toBe(false);
  });
});

describe("simulation and camera tagging", () => {
  it("requires zones only for zone walks and coordinates for other scenarios", () => {
    for (const scenario of Object.values(SIMULATION_SCENARIOS)) {
      const values = { collarCode: "C1", scenario, zoneId: "2", lat: "6", lng: "80" };
      const zoneRequired = scenario === SIMULATION_SCENARIOS.WALK_INTO_ZONE || scenario === SIMULATION_SCENARIOS.NIGHT_WALK_INTO_ZONE;
      expect(simulator.needsZone(scenario)).toBe(zoneRequired);
      expect(simulator.collarSimulationSchema.safeParse(values).success).toBe(true);
      expect(simulator.collarSimulationSchema.safeParse({ ...values, zoneId: "", lat: "", lng: "" }).success).toBe(false);
      expect(simulator.toCollarSimulationRequest(values)).toMatchObject({ zoneId: zoneRequired ? 2 : null, lat: zoneRequired ? null : 6, lng: zoneRequired ? null : 80 });
    }
    expect(simulator.cameraSimulationSchema.safeParse({ cameraCode: "C1", count: "10" }).success).toBe(true);
    expect(simulator.cameraSimulationSchema.safeParse(simulator.EMPTY_CAMERA_SIMULATION).success).toBe(false);
    expect(simulator.toCameraSimulationRequest({ cameraCode: "C1", count: "3" })).toEqual({ cameraCode: "C1", count: 3 });
    expect(simulator.collarResultText({ sent: 1, stored: 1, duplicates: 1 })).toContain("1 fix");
    expect(simulator.cameraResultText({ sent: 2, stored: 2, duplicates: 0 })).toContain("2 images");
  });
  it("requires species and bounded whole counts only for animals", () => {
    expect(tag.tagSchema.safeParse({ status: "", species: "", animalCount: "" }).success).toBe(false);
    for (const option of tag.TAG_OPTIONS) {
      const values = tag.tagSchema.parse({ status: option.value, species: "Elephant", animalCount: "2" });
      expect(tag.toTagRequest(values)).toEqual({ status: option.value, species: tag.isAnimals(option.value) ? "Elephant" : null, animalCount: tag.isAnimals(option.value) ? 2 : null });
    }
    for (const animalCount of ["", "0", "10001", "1.2", "bad"]) expect(tag.tagSchema.safeParse({ status: CAMERA_IMAGE_STATUSES.TAGGED, species: "Elephant", animalCount }).success).toBe(false);
    for (const species of ["", "x".repeat(256)]) expect(tag.tagSchema.safeParse({ status: CAMERA_IMAGE_STATUSES.TAGGED, species, animalCount: "1" }).success).toBe(false);
    const image = { id: 1, cameraCode: "C1", capturedAt: "2026-10-09", status: CAMERA_IMAGE_STATUSES.PENDING, species: null, animalCount: null, reviewedAt: null, reviewedByName: null };
    expect(tag.toTagValues(image)).toEqual({ status: "", species: "", animalCount: "" });
    expect(tag.toTagValues({ ...image, status: CAMERA_IMAGE_STATUSES.TAGGED, species: "Elephant", animalCount: 2 })).toEqual({ status: CAMERA_IMAGE_STATUSES.TAGGED, species: "Elephant", animalCount: "2" });
  });
});

describe("incident and task forms", () => {
  it("validates incident types and reports and maps optional descriptions", () => {
    expect(incidentType.incidentTypeSchema.safeParse(incidentType.EMPTY_INCIDENT_TYPE).success).toBe(false);
    const values = incidentType.incidentTypeSchema.parse({ name: "Fire", defaultSeverity: SEVERITIES.HIGH, active: true });
    expect(incidentType.toIncidentTypeRequest(incidentType.toIncidentTypeValues({ ...values, id: 1 }) as typeof values)).toEqual(values);
    expect(incidentType.incidentTypeErrorMessage(new ApiError(409))).toContain("inactive");
    expect(incidentType.incidentTypeErrorMessage(new ApiError(400, "bad"))).toBe("bad");
    expect(incident.reportIncidentSchema.safeParse(incident.EMPTY_REPORT).success).toBe(false);
    const report = { typeId: "2", location: { position: [6, 80] as [number, number], source: LOCATION_SOURCES.MANUAL }, description: "", photo: null };
    expect(incident.reportIncidentSchema.safeParse(report).success).toBe(true);
    expect(incident.toIncidentCreateRequest(report, new Date(0))).toMatchObject({ typeId: 2, lat: 6, lng: 80, description: null, occurredAt: "1970-01-01T00:00:00.000Z" });
    expect(incident.toIncidentCreateRequest({ ...report, description: "Fire" }, new Date(0)).description).toBe("Fire");
    expect(incident.reportIncidentSchema.safeParse({ ...report, photo: new File(["x"], "x.jpg", { type: "image/jpeg" }) }).success).toBe(true);
    expect(incident.reportIncidentSchema.safeParse({ ...report, photo: new File(["x"], "x.txt", { type: "text/plain" }) }).success).toBe(false);
    expect(incident.reportIncidentSchema.safeParse({ ...report, photo: { type: "image/png", size: 100_000_000 } }).success).toBe(false);
  });
  it("checks required reasons, dispositions and outcomes", () => {
    for (const schema of [reasonSchema, dismissSchema]) {
      expect(schema.safeParse({ reason: " " }).success).toBe(false);
      expect(schema.parse({ reason: " Invalid " }).reason).toBe("Invalid");
      expect(schema.safeParse({ reason: "x".repeat(1001) }).success).toBe(false);
    }
    for (const disposition of Object.values(DISPOSITIONS)) expect(resolveSchema.safeParse({ disposition }).success).toBe(true);
    expect(resolveSchema.safeParse({ disposition: "" }).success).toBe(false);
    for (const outcome of task.DISPATCH_OUTCOMES) expect(task.completeSchema.safeParse({ outcome, note: "" }).success).toBe(true);
    expect(task.completeSchema.safeParse(task.EMPTY_COMPLETE).success).toBe(false);
    expect(task.declineSchema.safeParse(task.EMPTY_DECLINE).success).toBe(true);
    expect(task.toOutcomeText({ outcome: "Resolved on site", note: "" })).toBe("Resolved on site");
    expect(task.toOutcomeText({ outcome: "Resolved on site", note: "Safe" })).toContain("Safe");
    expect(dispatch.dispatchFormSchema.safeParse(dispatch.EMPTY_DISPATCH).success).toBe(false);
    for (const note of ["", "Urgent"]) expect(dispatch.toDispatchRequest({ type: SOURCE_TYPES.INCIDENT, id: 3 }, { responderId: "4", note })).toEqual({ sourceType: SOURCE_TYPES.INCIDENT, sourceId: 3, responderId: 4, note: note || null });
    expect(dispatch.dispatchFormSchema.parse({ responderId: "4", note: " Urgent " }).note).toBe("Urgent");
  });
});

describe("patrol assignment and route forms", () => {
  it("rejects past dates and maps ranger selections", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00"));
    const values = { routeId: "1", rangerIds: ["2", "3"], scheduledDate: "2026-10-09" };
    expect(patrol.patrolFormSchema.safeParse(values).success).toBe(true);
    expect(patrol.patrolFormSchema.safeParse({ ...values, scheduledDate: "2026-10-08" }).success).toBe(false);
    expect(patrol.patrolFormSchema.safeParse(patrol.emptyPatrol(new Date())).success).toBe(false);
    expect(patrol.toAssignRequest(values)).toEqual({ routeId: 1, rangerIds: [2, 3], scheduledDate: "2026-10-09" });
    expect(patrol.toUpdateRequest(values)).toEqual({ routeId: 1, rangerId: 2, scheduledDate: "2026-10-09" });
    expect(patrol.toPatrolValues({ id: 1, route: { id: 1, name: "East", pathGeojson: "" }, rangerId: 2, rangerName: "Alice", scheduledDate: "2026-10-09", status: "PLANNED", startedAt: null, endedAt: null, gpsAvailable: true })).toEqual({ routeId: "1", rangerIds: ["2"], scheduledDate: "2026-10-09" });
    expect(patrol.createPatrolLabel(1)).toBe("Create patrol");
    expect(patrol.createPatrolLabel(2)).toBe("Create 2 patrols");
  });
  it("round trips route geometry and chooses explicit waypoint position over GPS", () => {
    const values = { name: "East", points: [[6, 80], [7, 81]] as [number, number][] };
    expect(route.routeFormSchema.safeParse(values).success).toBe(true);
    expect(route.routeFormSchema.safeParse(route.EMPTY_ROUTE).success).toBe(false);
    const request = route.toRouteRequest(values);
    expect(route.toRouteValues({ ...request, id: 1 })).toEqual(values);
    expect(route.toRouteValues({ ...request, id: 1, pathGeojson: "bad" }).points).toEqual([]);
    expect(waypoint.waypointFormSchema.safeParse(waypoint.EMPTY_WAYPOINT).success).toBe(true);
    expect(() => waypoint.toWaypointRequest(waypoint.EMPTY_WAYPOINT, null, 0)).toThrow("Tap the map");
    const fix = { position: [6, 80] as [number, number], accuracyM: 2, at: 0 };
    expect(waypoint.toWaypointRequest(waypoint.EMPTY_WAYPOINT, fix, 0)).toMatchObject({ lat: 6, lng: 80, note: null, waypointType: null, accuracyM: 2 });
    expect(waypoint.toWaypointRequest({ position: [7, 81], note: "Seen", waypointType: WAYPOINT_TYPES.OBSERVATION }, fix, 1000)).toMatchObject({ lat: 7, lng: 81, note: "Seen", waypointType: WAYPOINT_TYPES.OBSERVATION, accuracyM: null });
  });
});

