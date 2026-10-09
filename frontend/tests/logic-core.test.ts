import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as f from "@/lib/format";
import { distanceM, pathLengthM, parseLine, toLineGeojson } from "@/lib/patrols/geo";
import { toGpsFix, shouldRecord, toPointRequest } from "@/lib/patrols/tracking";
import { GPS_INTERVAL_S } from "@/lib/constants";
import { can, canVisit, PERMISSIONS } from "@/lib/auth/permissions";
import * as routes from "@/lib/auth/routes";
import { ROLES } from "@/lib/enums";
import { blobToDataUrl, downloadBlob } from "@/lib/files";
import { useI18nStore, useT, DICTIONARIES, LANGUAGES, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("date and display formatting", () => {
  const day = new Date(2026, 9, 9, 9, 5);
  it("formats local calendar values consistently", () => {
    expect(f.formatDate(day)).toBe("9 Oct, 2026");
    expect(f.formatDayLabel(day)).toBe("Fri, 9 Oct");
    expect(f.formatMonthYear(day)).toBe("October 2026");
    expect(f.formatMonth(day)).toBe("Oct");
    expect(f.formatWeekday(day)).toBe("Fri");
    expect(f.formatTime(day)).toBe("09:05");
    expect(f.toIsoDate(day)).toBe("2026-10-09");
    expect(f.fromIsoDate("2026-10-09")).toEqual(new Date(2026, 9, 9));
    expect(f.isSameDay(day, new Date(2026, 9, 9, 23))).toBe(true);
    expect(f.isSameDay(day, new Date(2026, 9, 10))).toBe(false);
    expect(f.formatDayTime(day, day)).toBe("Today · 09:05");
    expect(f.formatDayTime(day, new Date(2026, 9, 10))).toBe("Fri, 9 Oct · 09:05");
  });
  it.each([[0, "0 s ago"], [59000, "59 s ago"], [60000, "1 min ago"], [3599000, "59 min ago"], [3600000, "at 09:05"], [-1000, "0 s ago"]])("formats elapsed %i ms", (elapsed, expected) => {
    expect(f.formatAgo(day, new Date(day.getTime() + elapsed))).toBe(expected);
  });
  it.each([[0, "0 min"], [90, "2 min"], [3600, "1 h"], [3660, "1 h 1 min"]])("formats %i seconds", (seconds, expected) => expect(f.formatDuration(seconds)).toBe(expected));
  it("formats positions, distance, initials and classes", () => {
    expect(f.formatKm(1234)).toBe("1.2 km");
    expect(f.formatLatLng([6.12345, -80.23456], 3)).toBe("6.123, -80.235");
    expect(f.initialsOf("   ")).toBe("");
    expect(f.initialsOf("  Alice ")).toBe("A");
    expect(f.initialsOf("Alice Mary Brown")).toBe("AB");
    expect(cn("base", false && "hidden", "active")).toContain("active");
  });
});

describe("GPS geometry and sampling", () => {
  it("measures realistic geodesic distance and sums segments", () => {
    expect(distanceM([0, 0], [0, 0])).toBe(0);
    expect(distanceM([0, 0], [0, 1])).toBeCloseTo(111194.927, 2);
    expect(pathLengthM([])).toBe(0);
    expect(pathLengthM([[0, 0]])).toBe(0);
    expect(pathLengthM([[0, 0], [0, 1], [0, 2]])).toBeCloseTo(222389.853, 2);
  });
  it("round trips coordinate order and rejects invalid lines", () => {
    expect(parseLine(toLineGeojson([[6, 80], [7, 81]]))).toEqual([[6, 80], [7, 81]]);
    for (const value of ["bad", "null", '{"type":"Point","coordinates":[80,6]}', '{"type":"LineString","coordinates":[[80,6]]}', '{"type":"LineString","coordinates":[[181,6],[80,91]]}']) expect(parseLine(value)).toBeNull();
  });
  it("clamps future timestamps and drops non-finite accuracy", () => {
    const position = { coords: { latitude: 6, longitude: 80, accuracy: 5 }, timestamp: 2000 } as GeolocationPosition;
    expect(toGpsFix(position, 1000)).toEqual({ position: [6, 80], accuracyM: 5, at: 1000 });
    expect(toGpsFix({ ...position, coords: { ...position.coords, accuracy: Infinity } }, 3000)).toEqual({ position: [6, 80], accuracyM: null, at: 2000 });
  });
  it("records the first fix, elapsed interval or significant movement", () => {
    const fix = { position: [0, 0] as [number, number], accuracyM: 3, at: 0 };
    expect(shouldRecord(null, fix)).toBe(true);
    expect(shouldRecord(fix, { ...fix, at: GPS_INTERVAL_S * 1000 - 1 })).toBe(false);
    expect(shouldRecord(fix, { ...fix, at: GPS_INTERVAL_S * 1000 })).toBe(true);
    expect(shouldRecord(fix, { ...fix, position: [0, 0.01] })).toBe(true);
    expect(toPointRequest(fix)).toEqual({ lat: 0, lng: 0, accuracyM: 3, recordedAt: "1970-01-01T00:00:00.000Z" });
  });
});

describe("role access", () => {
  it("matches every permission to its explicitly allowed roles", () => {
    for (const [permission, allowed] of Object.entries(PERMISSIONS)) {
      for (const role of Object.values(ROLES)) expect(can(role, permission as keyof typeof PERMISSIONS)).toBe((allowed as readonly string[]).includes(role));
      expect(can(null, permission as keyof typeof PERMISSIONS)).toBe(false);
      expect(can(undefined, permission as keyof typeof PERMISSIONS)).toBe(false);
    }
  });
  it("applies specific report rules before parent prefixes", () => {
    expect(canVisit(ROLES.CLO, "/dashboard/reports/conflicts/123")).toBe(true);
    expect(canVisit(ROLES.CLO, "/dashboard/reports/incidents")).toBe(false);
    expect(canVisit(ROLES.MANAGER, "/dashboard/users/12")).toBe(true);
    expect(canVisit(ROLES.RANGER, "/dashboard/users")).toBe(false);
    expect(canVisit(ROLES.RANGER, "/dashboard/users-other")).toBe(true);
    expect(canVisit(ROLES.RANGER, "/ranger")).toBe(true);
  });
  it.each(Object.values(ROLES))("selects route capabilities for %s", (role) => {
    expect(routes.homePath(role)).toBe(role === ROLES.RANGER ? "/ranger" : "/dashboard");
    expect(routes.canUseDashboard(role)).toBe(role !== ROLES.RANGER);
    expect(routes.canUseRangerApp(role)).toBe(role === ROLES.RANGER);
    expect(routes.canViewIncidents(role)).toBe(role === ROLES.MANAGER);
    expect(routes.canViewReports(role)).toBe(role === ROLES.MANAGER || role === ROLES.RESEARCHER);
    expect(routes.canViewReports(null)).toBe(false);
    expect(routes.canViewIncidents(undefined)).toBe(false);
  });
});

describe("browser files and translations", () => {
  it("reads blobs as data URLs", async () => {
    await expect(blobToDataUrl(new Blob(["WildX"], { type: "text/plain" }))).resolves.toBe("data:text/plain;base64,V2lsZFg=");
  });
  it("propagates file reader errors", async () => {
    const error = new Error("unreadable");
    vi.stubGlobal("FileReader", class { error = error; onerror?: () => void; readAsDataURL() { this.onerror?.(); } });
    await expect(blobToDataUrl(new Blob())).rejects.toBe(error);
  });
  it("downloads and releases the object URL", () => {
    const create = vi.fn(() => "blob:download");
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blob = new Blob(["report"]);
    downloadBlob(blob, "report.csv");
    expect(create).toHaveBeenCalledWith(blob);
    expect(click.mock.instances[0]).toMatchObject({ download: "report.csv", href: "blob:download" });
    expect(revoke).toHaveBeenCalledWith("blob:download");
  });
  it("changes language, persists choice and falls back for unknown languages or keys", () => {
    const { result } = renderHook(() => useT());
    for (const { code } of LANGUAGES) {
      act(() => result.current.setLanguage(code));
      expect(result.current.t("reportTitle")).toBe(DICTIONARIES[code].reportTitle);
      expect(localStorage.getItem("wildx_language")).toBe(code);
    }
    act(() => useI18nStore.setState({ language: "unknown" as Language }));
    expect(result.current.t("reportTitle")).toBe(DICTIONARIES.en.reportTitle);
    expect(result.current.t("missing" as TranslationKey)).toBe("missing");
    act(() => result.current.setLanguage("en"));
  });
});
