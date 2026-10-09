import { describe, expect, it } from "vitest";
import type { DispatchResponse } from "@/lib/api/dispatches";
import type { CameraImageResponse } from "@/lib/api/camera-images";
import * as dispatch from "@/lib/dispatch/mappers";
import * as dashboard from "@/lib/dashboard/mappers";
import { SCHEDULE_KINDS } from "@/lib/dashboard/types";
import { toCameraView } from "@/lib/camera/mappers";
import { CAMERA_FILTERS } from "@/lib/camera/types";
import { formatMinutes, toAlertReportView } from "@/lib/alerts/report-mappers";
import { toNotificationsView } from "@/lib/notifications/mappers";
import { ALERT_TYPES, CAMERA_IMAGE_STATUSES, DISPATCH_STATUSES, INCIDENT_STATUSES, LOCATION_SOURCES, SEVERITIES, SOURCE_TYPES } from "@/lib/enums";

const now = new Date("2026-10-09T12:00:00Z");
const stamp = "2026-10-09T11:00:00Z";

describe("dashboard and notifications", () => {
  it("selects greetings, metric signs and online status at boundaries", () => {
    expect(dashboard.greetingFor(new Date(2026, 9, 9, 11))).toBe("Good morning,");
    expect(dashboard.greetingFor(new Date(2026, 9, 9, 12))).toBe("Good afternoon,");
    expect(dashboard.greetingFor(new Date(2026, 9, 9, 17))).toBe("Good evening,");
    const metrics = { activeAlerts: 2, alertsToday: 1, collarsReporting: 3, collarsTotal: 4, patrolsActive: 1, patrolsOnSchedule: false, imagesToReview: 3, imagesChangeToday: 1 };
    expect(dashboard.toMetrics(metrics).map((metric) => metric.chip?.tone)).toEqual(["negative", "negative", "negative", "negative"]);
    expect(dashboard.toMetrics({ ...metrics, alertsToday: 0, collarsTotal: 3, patrolsOnSchedule: true, imagesChangeToday: -1 }).map((metric) => metric.chip?.tone)).toEqual(["positive", "positive", "positive", "positive"]);
  });
  it("scales monthly data and groups matching calendar days", () => {
    const metrics = { activeAlerts: 0, alertsToday: 0, collarsReporting: 3, collarsTotal: 3, patrolsActive: 0, patrolsOnSchedule: true, imagesToReview: 0, imagesChangeToday: 0 };
    const conflict = { monthly: [{ month: "2026-09", count: 2 }, { month: "2026-10", count: 4 }], changeVsLastSeasonPct: -20 };
    expect(dashboard.toConflictChart(conflict)).toMatchObject({ total: 6, average: 3, changePct: 20, improving: true });
    expect(dashboard.toConflictChart({ ...conflict, changeVsLastSeasonPct: 20 }).improving).toBe(false);
    const item = { id: "1", kind: SCHEDULE_KINDS.PATROL, title: "Night", area: "East", start: stamp, end: "2026-10-09T12:00:00Z", owner: "Alice" };
    const schedule = [item, { ...item, id: "2" }, { ...item, id: "3", start: "2026-10-10T11:00:00Z" }];
    const groups = dashboard.toScheduleGroups(schedule, now);
    expect(groups.map((group) => group.items.length)).toEqual([2, 1]);
    expect(groups[0].label).toBe("Today");
    expect(dashboard.toDashboardView({ metrics, conflict, schedule }, now).schedule).toEqual(groups);
    const week = dashboard.weekOf(new Date(2026, 9, 11), new Date(2026, 9, 9));
    expect(week).toHaveLength(7);
    expect(week[0].weekday).toBe("Mon");
    expect(week.filter((day) => day.isToday)).toHaveLength(1);
  });
  it("maps recent and earlier notification times and read states", () => {
    const item = { id: 1, title: "Alert", body: "Fire", link: "/alerts", sentAt: "2026-10-09T11:59:00Z", readAt: null };
    const view = toNotificationsView({ unreadCount: 1, notifications: [item, { ...item, id: 2, sentAt: stamp, readAt: stamp }] }, now);
    expect(view.unreadCount).toBe(1);
    expect(view.rows[0]).toMatchObject({ unread: true, time: "1 min ago" });
    expect(view.rows[1].unread).toBe(false);
    expect(view.rows[1].time).toContain("Today");
  });
});

describe("dispatch presentation", () => {
  const task: DispatchResponse = { id: 1, sourceType: SOURCE_TYPES.INCIDENT, sourceId: 3, responderId: 1, responderName: "Alice", assignedByName: null, status: DISPATCH_STATUSES.ASSIGNED, assignedAt: stamp, acknowledgedAt: null, completedAt: null, outcome: null, note: null };
  it("maps responder distance and contact labels", () => {
    const options = dispatch.toResponderOptions([{ id: 1, name: "Alice Brown", distanceM: null, offline: true, lastSeenAt: null }, { id: 2, name: "Bob", distanceM: 1200, offline: false, lastSeenAt: stamp }], now);
    expect(options[0]).toMatchObject({ initials: "AB", distance: "Distance unknown", presence: { label: "Offline" } });
    expect(options[1].distance).toBe("1.2 km away");
    expect(options[1].presence.label).toContain("seen");
  });
  it("orders open tasks before closed ones then newest assignments", () => {
    const list = [{ ...task, id: 4, status: DISPATCH_STATUSES.COMPLETED, sourceType: SOURCE_TYPES.COMMUNITY_REPORT }, { ...task, id: 1 }, { ...task, id: 2, assignedAt: "2026-10-09T11:30:00Z", sourceType: SOURCE_TYPES.ALERT }, { ...task, id: 3, status: DISPATCH_STATUSES.ACKNOWLEDGED }];
    expect(dispatch.toDispatchRows(list, now).map((row) => row.id)).toEqual([2, 1, 3, 4]);
    expect(list[0].id).toBe(4);
    expect(dispatch.toDispatchRows(list, now).at(-1)?.title).toBe("Community report #3");
  });
  it("maps detail actions, incident titles and conditional outcome facts", () => {
    const incident = { id: 3, typeId: 1, typeName: "Fire", reporterName: "Bob", patrolId: null, lat: null, lng: null, locationSource: LOCATION_SOURCES.GPS, sectorName: null, description: null, photoPath: null, severity: SEVERITIES.HIGH, status: INCIDENT_STATUSES.NEW, occurredAt: stamp, resolutionNote: null, responderName: null };
    expect(dispatch.toMyIncidentRows([incident, { ...incident, sectorName: "East" }], now)[0].caption).toContain("Outside sectors");
    for (const status of Object.values(DISPATCH_STATUSES)) {
      const view = dispatch.toDispatchView({ ...task, status, assignedByName: "Manager", note: "Safe", outcome: "Resolved" }, incident, now);
      expect(view.title).toBe("Fire · INC-3");
      expect(view.canAcknowledge).toBe(status === DISPATCH_STATUSES.ASSIGNED);
      expect(view.canComplete).toBe(status === DISPATCH_STATUSES.ACKNOWLEDGED);
      expect(view.canDecline).toBe(status === DISPATCH_STATUSES.ASSIGNED || status === DISPATCH_STATUSES.ACKNOWLEDGED);
      expect(view.facts[1].label).toBe(status === DISPATCH_STATUSES.DECLINED ? "Decline reason" : "Note");
      expect(view.facts[2]).toEqual({ label: "Outcome", value: "Resolved" });
    }
    expect(dispatch.toDispatchView({ ...task, sourceType: SOURCE_TYPES.ALERT }, undefined, now)).toMatchObject({ title: "Alert #3", incidentId: null });
    expect(dispatch.toDispatchView(task, undefined, now).facts).toHaveLength(1);
  });
});

describe("camera bursts and alert reports", () => {
  const image: CameraImageResponse = { id: 1, cameraCode: "CAM1", capturedAt: stamp, status: CAMERA_IMAGE_STATUSES.PENDING, species: null, animalCount: null, reviewedByName: null, reviewedAt: null };
  it("sorts images and maps filters, restricted state and selected facts", () => {
    const images = Object.values(CAMERA_IMAGE_STATUSES).map((status, index) => ({ ...image, id: index + 1, status, capturedAt: `2026-10-09T11:0${index}:00Z`, species: status === CAMERA_IMAGE_STATUSES.TAGGED ? "Elephant" : null, animalCount: null }));
    const bursts = [{ cameraCode: "CAM1", startedAt: stamp, endedAt: "2026-10-09T11:04:00Z", images: [...images].reverse() }, { cameraCode: "CAM2", startedAt: stamp, endedAt: stamp, images: [{ ...image, id: 10, cameraCode: "CAM2" }] }];
    const view = toCameraView(bursts, CAMERA_FILTERS.ALL, 2, now);
    expect(view).toMatchObject({ pendingCount: 2, pendingBurstCount: 2 });
    expect(view.bursts[0].tiles.map((tile) => tile.id)).toEqual([1, 2, 3, 4, 5]);
    expect(view.bursts[0].tiles[1].status.label).toBe("Elephant · 1");
    expect(view.bursts[0].tiles[4].restricted).toBe(true);
    expect(view.bursts[1].caption).toBe("1 image");
    expect(toCameraView(bursts, CAMERA_FILTERS.RESTRICTED, null, now).bursts).toHaveLength(1);
    expect(toCameraView(bursts, CAMERA_FILTERS.ALL, 99, now).selected).toBeNull();
    for (const [reviewedAt, reviewedByName] of [[null, null], [stamp, null], [stamp, "Alice"]]) {
      const burst = { ...bursts[1], images: [{ ...image, status: CAMERA_IMAGE_STATUSES.TAGGED, capturedAt: "2026-10-08T11:00:00Z", reviewedAt, reviewedByName }] };
      const selected = toCameraView([burst], CAMERA_FILTERS.ALL, 1, now).selected;
      expect(selected?.status.label).toBe("Tagged");
      expect(selected?.facts[1].value).toContain("Thu");
      if (reviewedByName) expect(selected?.facts[2].value).toContain("Alice");
    }
  });
  it("formats null, minute and hour medians with zone fallbacks", () => {
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(59)).toBe("59.0 min");
    expect(formatMinutes(60)).toBe("1.0 h");
    const row = { type: ALERT_TYPES.ZONE_BREACH, zoneId: null, zoneName: null, count: 2, medianAcknowledgeMinutes: null, medianResolveMinutes: 90 };
    const view = toAlertReportView({ from: "2026-10-01", to: "2026-10-09", total: 3, medianAcknowledgeMinutes: 10, medianResolveMinutes: 60, rows: [row, { ...row, zoneId: 1, zoneName: "Field", count: 1 }] });
    expect(view.rows[0]).toMatchObject({ key: "ZONE_BREACH-none", zone: "No zone", hasZone: false });
    expect(view.rows[1]).toMatchObject({ zone: "Field", hasZone: true });
    expect(view.metrics.map((metric) => metric.value)).toEqual(["3", "10.0 min", "1.0 h"]);
  });
});
