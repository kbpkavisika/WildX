import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DevicesTable } from "@/components/devices/devices-table";
import { UsersTable } from "@/components/users/users-table";
import { ParkList } from "@/components/parks/park-list";
import { SectorList } from "@/components/parks/sector-list";
import { ZoneList } from "@/components/zones/zone-list";
import { AlertList } from "@/components/alerts/alert-list";
import { AlertReportTable } from "@/components/alerts/alert-report-table";
import { AlertReportSummary } from "@/components/alerts/alert-report-summary";
import { TaskList } from "@/components/dispatch/task-list";
import { RoutesTable } from "@/components/patrols/routes-table";
import { PatrolsTable } from "@/components/patrols/patrols-table";
import { CoverageReportTable } from "@/components/patrols/coverage-report-table";
import { RangerPatrolList } from "@/components/patrols/ranger-patrol-list";
import { IncidentsTable } from "@/components/incidents/incidents-table";
import { IncidentTypesTable } from "@/components/incidents/incident-types-table";
import { CountBars } from "@/components/incidents/count-bars";
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
const status = { tone: "positive" as const, label: "Active" };
const row = { id: 1, name: "North", title: "North", code: "P-1", caption: "Morning", status, severity: status };
describe("management tables", () => {
 it.each([DevicesTable, UsersTable, RoutesTable, PatrolsTable, CoverageReportTable, IncidentsTable, IncidentTypesTable, AlertReportTable])("shows an empty state and semantic column headers", (Table) => {
  render(<Table rows={[]} canManage deactivatingId={null} deletingId={null} selectedId={null} onSelect={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onDeactivate={vi.fn()} />);
  expect(screen.getByRole("table")).toBeTruthy(); expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(2); expect(screen.getByText(/^No /)).toBeTruthy();
 });
 it("renders device location captions and health", () => {
  render(<DevicesTable rows={[{ ...row, kind: "Collar", place: "Gemunu", placeCaption: "Elephant", interval: "5 min", battery: "80%", lastSeen: "Now", health: status }, { ...row, id: 2, code: "CAM-1", health: status }] as unknown as ComponentProps<typeof DevicesTable>["rows"]} />);
  expect(screen.getByText("Elephant")).toBeTruthy(); expect(screen.getByText("80%")).toBeTruthy(); expect(screen.getAllByRole("row")).toHaveLength(3);
 });
 it("edits and deactivates users with pending and permission states", () => {
  const edit = vi.fn(), deactivate = vi.fn(); const user = { ...row, email: "ranger@example.com", phone: "077123", role: "Ranger", canDeactivate: true, active: true };
  const { rerender } = render(<UsersTable rows={[user] as unknown as ComponentProps<typeof UsersTable>["rows"]} deactivatingId={null} onEdit={edit} onDeactivate={deactivate} />);
  fireEvent.click(screen.getByLabelText("Edit North")); fireEvent.click(screen.getByLabelText("Deactivate North")); expect(edit).toHaveBeenCalledWith(1); expect(deactivate).toHaveBeenCalledWith(user);
  rerender(<UsersTable rows={[user] as unknown as ComponentProps<typeof UsersTable>["rows"]} deactivatingId={1} onEdit={edit} onDeactivate={deactivate} />); expect((screen.getByLabelText("Deactivate North") as HTMLButtonElement).disabled).toBe(true);
  rerender(<UsersTable rows={[{ ...user, phone: null, canDeactivate: false }] as unknown as ComponentProps<typeof UsersTable>["rows"]} deactivatingId={null} onEdit={edit} onDeactivate={deactivate} />); expect(screen.queryByLabelText("Deactivate North")).toBeNull();
 });
 it.each([RoutesTable, IncidentTypesTable])("enforces edit and delete permissions", (Table) => {
  const edit = vi.fn(), remove = vi.fn(); const props = { rows: [{ ...row, length: "2 km", points: 3 }], canManage: true, deletingId: null, onEdit: edit, onDelete: remove };
  const { rerender } = render(<Table {...props} />); fireEvent.click(screen.getByLabelText("Edit North")); fireEvent.click(screen.getByLabelText("Delete North")); expect(edit).toHaveBeenCalledWith(1); expect(remove).toHaveBeenCalledWith(props.rows[0]);
  rerender(<Table {...props} deletingId={1} />); expect((screen.getByLabelText("Delete North") as HTMLButtonElement).disabled).toBe(true);
  rerender(<Table {...props} canManage={false} />); expect(screen.queryByRole("button")).toBeNull();
 });
 it("supports editing planned patrols, replaying completed patrols and unavailable replay", () => {
  const edit = vi.fn(), remove = vi.fn(); const patrol = { ...row, leaderInitials: "JD", leaderName: "Jay", day: "Today", time: "08:00", distance: "3 km", duration: "1 h", canEdit: true, canReplay: false };
  const props = { rows: [patrol] as unknown as ComponentProps<typeof PatrolsTable>["rows"], canManage: true, deletingId: null, onEdit: edit, onDelete: remove };
  const { rerender } = render(<PatrolsTable {...props} />); fireEvent.click(screen.getByLabelText("Edit P-1")); fireEvent.click(screen.getByLabelText("Delete P-1")); expect(edit).toHaveBeenCalledWith(1); expect(remove).toHaveBeenCalled();
  rerender(<PatrolsTable {...props} rows={[{ ...patrol, canEdit: false, canReplay: true }] as unknown as ComponentProps<typeof PatrolsTable>["rows"]} />); expect(screen.getByRole("link").getAttribute("href")).toBe("/dashboard/patrols/1");
  rerender(<PatrolsTable {...props} rows={[{ ...patrol, time: null, duration: null, canEdit: false }] as unknown as ComponentProps<typeof PatrolsTable>["rows"]} />); expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
 });
 it("selects incidents and exposes status notes and selected rows", () => {
  const select = vi.fn(); const incident = { ...row, sector: "Sector 1", reporter: "Jay", reported: "Now", statusNote: "Assigned" };
  const { rerender } = render(<IncidentsTable rows={[incident] as unknown as ComponentProps<typeof IncidentsTable>["rows"]} selectedId={null} onSelect={select} />); fireEvent.click(screen.getByRole("button")); expect(select).toHaveBeenCalledWith(1); expect(screen.getByTitle("Assigned")).toBeTruthy();
  rerender(<IncidentsTable rows={[{ ...incident, statusNote: null }] as unknown as ComponentProps<typeof IncidentsTable>["rows"]} selectedId={1} onSelect={select} />); expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
 });
 it("shows coverage warnings and alert report zones", () => {
  render(<><CoverageReportTable rows={[{ id: 1, sector: "North", points: 0, patrols: 0, lastVisit: "Never", unvisited: true, level: "none", tooltip: "North" }, { id: 2, sector: "South", points: 4, patrols: 2, lastVisit: "Today", unvisited: false, level: "high", tooltip: "South" }]} /><AlertReportTable rows={[{ key: "1", type: "Breach", zone: "Farm", hasZone: true, count: 4, acknowledge: "3 min", resolve: "1 h" }, { key: "2", type: "Battery", zone: "No zone", hasZone: false, count: 1, acknowledge: "5 min", resolve: "2 h" }] as unknown as ComponentProps<typeof AlertReportTable>["rows"]} /><AlertReportSummary metrics={[{ label: "Total", value: "5" }]} /></>);
  expect(screen.getByText("Never")).toBeTruthy(); expect(screen.getByText("Farm")).toBeTruthy(); expect(screen.getByRole("region", { name: "Summary" })).toBeTruthy();
 });
});
describe("lists and report visual summaries", () => {
 it("switches parks and blocks concurrent switches", () => {
  const change = vi.fn(); const parks = [{ id: 1, name: "Yala", code: "YAL", neglectDays: 7 }, { id: 2, name: "Wilpattu", code: "WIL", neglectDays: 1 }];
  const { rerender } = render(<ParkList parks={parks} currentId={1} switching={false} onSwitch={change} />); expect(screen.getByText("Current")).toBeTruthy(); fireEvent.click(screen.getByText("Switch")); expect(change).toHaveBeenCalledWith(2);
  rerender(<ParkList parks={parks} currentId={1} switching onSwitch={change} />); expect((screen.getByText("Switch") as HTMLButtonElement).disabled).toBe(true);
 });
 it.each([SectorList, ZoneList])("shows empty, editable, pending deletion and read-only lists", (List) => {
  const edit = vi.fn(), remove = vi.fn(); const item = { ...row, polygonGeojson: "invalid", rule: null, rings: [] };
  const props = { rows: [], sectors: [], canManage: true, deletingId: null, onEdit: edit, onDelete: remove };
  const { rerender } = render(<List {...props} />); expect(screen.getByText(/^No /)).toBeTruthy();
  rerender(<List {...props} rows={[item]} sectors={[item]} />); fireEvent.click(screen.getByLabelText("Edit North")); fireEvent.click(screen.getByLabelText("Delete North")); expect(edit).toHaveBeenCalledWith(1); expect(remove).toHaveBeenCalledWith(item);
  if (List === ZoneList) { fireEvent.click(screen.getByRole("button", { name: /Morning/ })); expect(screen.getByRole("button", { name: /Morning/ }).getAttribute("aria-pressed")).toBe("true"); }
  rerender(<List {...props} rows={[{ ...item, rule: { severity: status, caption: "30 min" } }]} sectors={[item]} deletingId={1} />); expect((screen.getByLabelText("Delete North") as HTMLButtonElement).disabled).toBe(true);
  rerender(<List {...props} rows={[item]} sectors={[item]} canManage={false} />); expect(screen.queryByLabelText("Edit North")).toBeNull();
 });
 it("toggles alert selection and displays the empty label", () => {
  const { rerender } = render(<AlertList rows={[]} emptyLabel="No alerts" />); expect(screen.getByText("No alerts")).toBeTruthy(); rerender(<AlertList rows={[{ ...row, number: 1 }] as unknown as ComponentProps<typeof AlertList>["rows"]} emptyLabel="No alerts" />);
  fireEvent.click(screen.getByRole("button")); expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true"); fireEvent.click(screen.getByRole("button")); expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false");
 });
 it("shows task loading, errors, empty states and optional links", () => {
  const props = { title: "Tasks", rows: [], isPending: true, isError: false, emptyText: "No assignments" };
  const { rerender } = render(<TaskList {...props} />); expect(screen.getByText(/Loading/)).toBeTruthy(); rerender(<TaskList {...props} isPending={false} isError />); expect(screen.getByText(/Could not load/)).toBeTruthy(); rerender(<TaskList {...props} isPending={false} />); expect(screen.getByText("No assignments")).toBeTruthy();
  rerender(<TaskList {...props} isPending={false} rows={[{ ...row, href: "/ranger/dispatch/1" }, { ...row, id: 2, title: "Closed", href: null }] as unknown as ComponentProps<typeof TaskList>["rows"]} />); expect(screen.getByRole("link").getAttribute("href")).toBe("/ranger/dispatch/1"); expect(screen.getAllByRole("listitem")).toHaveLength(2);
 });
 it("links ranger patrol cards and scales highlighted count bars", () => {
  const { rerender } = render(<CountBars title="Incidents by type" bars={[]} />); expect(screen.getByText("No incidents in this range.")).toBeTruthy();
  rerender(<><CountBars title="Incidents by type" bars={[{ key: "a", label: "Snare", count: 2, widthPct: 100, highlighted: true }, { key: "b", label: "Fire", count: 1, widthPct: 50, highlighted: false }]} /><RangerPatrolList cards={[row] as unknown as ComponentProps<typeof RangerPatrolList>["cards"]} /></>); expect(document.querySelector('[style="width: 50%;"]')).toBeTruthy(); expect(screen.getByRole("link").getAttribute("href")).toBe("/ranger/patrol/1");
 });
});
