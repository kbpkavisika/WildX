import type { ComponentProps } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DispatchForm } from "@/components/dispatch/dispatch-form";
import { DispatchActions } from "@/components/dispatch/dispatch-actions";
import { AlertDetail } from "@/components/alerts/alert-detail";
import { RangerAlertList } from "@/components/alerts/ranger-alert-list";
import { RulesCard } from "@/components/zones/rules-card";
import { TriagePanel } from "@/components/incidents/triage-panel";
import { FieldPanel } from "@/components/patrols/field-panel";
import { RangerPatrolActions } from "@/components/patrols/ranger-patrol-actions";
import { useAlertsPage } from "@/lib/alerts/store";
import { useZonesPage } from "@/lib/zones/store";
import { useCameraPage } from "@/lib/camera/store";
import { useRangerPatrolPage } from "@/lib/patrols/store";
const state = vi.hoisted(() => {
 const mutation = () => ({ mutate: vi.fn((value?: unknown, options?: { onSuccess?: (value: { responderName: string }) => void }) => options?.onSuccess?.({ responderName: "Jay" })), reset: vi.fn(), isPending: false, isError: false, error: null as Error | null, variables: null as number | { id: number } | null });
 return { acknowledge: mutation(), resolve: mutation(), dispatch: mutation(), save: mutation(), remove: mutation(), refresh: vi.fn(), options: [] as ReturnType<typeof import("@/hooks/use-dispatch").useDispatch>["options"], isPending: false, isError: false };
});
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/dynamic", () => ({ default: () => ({ onPick }: { onPick?: (position: [number, number]) => void }) => <button type="button" onClick={() => onPick?.([6, 81])}>Pick location</button> }));
vi.mock("@/hooks/use-alert-actions", () => ({ useAlertActions: () => ({ acknowledge: state.acknowledge, resolve: state.resolve, refresh: state.refresh }) }));
vi.mock("@/hooks/use-dispatch", () => ({ useDispatch: () => state }));
vi.mock("@/hooks/use-alert-rules", () => ({ useAlertRules: () => ({ save: state.save, remove: state.remove }) }));
const status = { tone: "positive" as const, label: "Active" };
const row = { id: 1, title: "Breach", caption: "Farm", severity: status, status, number: 1 };
const detail = { ...row, facts: [{ label: "Animal", value: "Gemunu" }], position: [6, 81], canAcknowledge: true, canResolve: true, canDispatch: true, cameraImageId: 2, mapsUrl: "https://maps.example/1" };
beforeEach(() => {
 vi.clearAllMocks(); for (const m of [state.acknowledge, state.resolve, state.dispatch, state.save, state.remove]) Object.assign(m, { isPending: false, isError: false, error: null, variables: null });
 state.options = []; state.isPending = false; state.isError = false;
 useAlertsPage.setState({ selectedId: null, action: null, notice: null }); useZonesPage.setState({ ruleType: null }); useRangerPatrolPage.setState({ panel: null, notice: null });
});
describe("dispatch and incident triage", () => {
 it("finds responders with loading, error, empty and valid choice states", async () => {
  const props = { source: { type: "ALERT", id: 1 }, position: null, onDispatched: vi.fn(), onCancel: vi.fn() } as unknown as ComponentProps<typeof DispatchForm>;
  state.isPending = true; const { rerender } = render(<DispatchForm {...props} />); expect(screen.getByText(/Finding rangers/)).toBeTruthy(); state.isPending = false; state.isError = true; rerender(<DispatchForm {...props} />); expect(screen.getByText("Could not load rangers.")).toBeTruthy(); state.isError = false; rerender(<DispatchForm {...props} />); expect(screen.getByText(/No active rangers/)).toBeTruthy(); fireEvent.submit(screen.getByRole("form")); await screen.findByText("Choose a ranger");
  state.options = [{ id: 1, initials: "JD", name: "Jay", presence: status, distance: "2 km" }]; rerender(<DispatchForm {...props} />); fireEvent.click(screen.getByRole("radio")); fireEvent.change(screen.getByLabelText(/Note for/), { target: { value: "Bring cutters" } }); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.dispatch.mutate).toHaveBeenCalledWith({ responderId: "1", note: "Bring cutters" })); fireEvent.click(screen.getByText("Cancel")); expect(props.onCancel).toHaveBeenCalledOnce();
  state.dispatch.isError = true; state.dispatch.error = new Error("Offline"); state.dispatch.isPending = true; rerender(<DispatchForm {...props} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("acknowledges dispatches, opens completion and decline actions and hides unavailable actions", async () => {
  const open = vi.fn(); const props = { view: { canAcknowledge: true, canComplete: true, canDecline: true }, openAction: null, onOpenAction: open, acknowledge: state.acknowledge, complete: state.resolve, decline: state.dispatch } as unknown as ComponentProps<typeof DispatchActions>;
  const { rerender } = render(<DispatchActions {...props} />); fireEvent.click(screen.getByText("Acknowledge")); expect(state.acknowledge.mutate).toHaveBeenCalled(); fireEvent.click(screen.getByText("Complete")); fireEvent.click(screen.getByText("Decline")); expect(open).toHaveBeenCalledWith("complete"); expect(open).toHaveBeenCalledWith("decline");
  state.acknowledge.isError = true; state.acknowledge.error = new Error("Offline"); state.acknowledge.isPending = true; rerender(<DispatchActions {...props} />); expect(screen.getByRole("alert")).toBeTruthy();
  rerender(<DispatchActions {...props} openAction="decline" />); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.dispatch.mutate).toHaveBeenCalledWith(null, expect.any(Object))); expect(open).toHaveBeenCalledWith(null);
  rerender(<DispatchActions {...props} openAction="complete" />); const option = screen.getAllByRole("option")[1] as HTMLOptionElement; fireEvent.change(screen.getByLabelText(/Outcome/), { target: { value: option.value } }); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.resolve.mutate).toHaveBeenCalled()); fireEvent.click(screen.getByText("Cancel"));
  rerender(<DispatchActions {...props} view={{} as ComponentProps<typeof DispatchActions>["view"]} />); expect(screen.queryByRole("button")).toBeNull();
 });
 it("changes incident severity, opens dispatch and dismissal, and closes actions", async () => {
  const props = { view: { id: 1, severity: "MEDIUM", canChangeSeverity: true, canDispatchOrDismiss: true, position: [6, 81] }, openAction: null, severitySaving: false, severityError: null, dismissSaving: false, dismissError: null, onSeverityChange: vi.fn(), onOpenAction: vi.fn(), onDismiss: vi.fn(), onDispatched: vi.fn() } as unknown as ComponentProps<typeof TriagePanel>;
  const { rerender } = render(<TriagePanel {...props} />); fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "HIGH" } }); expect(props.onSeverityChange).toHaveBeenCalledWith("HIGH"); fireEvent.click(screen.getByText("Dispatch responder")); fireEvent.click(screen.getByText("Dismiss incident")); expect(props.onOpenAction).toHaveBeenCalledWith("dispatch"); expect(props.onOpenAction).toHaveBeenCalledWith("dismiss");
  rerender(<TriagePanel {...props} openAction="dismiss" severitySaving severityError={new Error("Offline")} />); fireEvent.change(screen.getByLabelText(/Reason for/), { target: { value: "Already removed" } }); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(props.onDismiss).toHaveBeenCalledWith("Already removed")); fireEvent.click(screen.getByText("Cancel")); expect(props.onOpenAction).toHaveBeenCalledWith(null);
  rerender(<TriagePanel {...props} openAction="dispatch" />); fireEvent.click(screen.getByText("Cancel")); rerender(<TriagePanel {...props} view={{} as ComponentProps<typeof TriagePanel>["view"]} />); expect(screen.getByText("This incident is closed.")).toBeTruthy();
 });
});
describe("alert actions", () => {
 it("shows selected alert facts, focuses image, acknowledges, resolves and dispatches", async () => {
  const { rerender } = render(<AlertDetail view={null} />); expect(screen.getByText(/Select an alert/)).toBeTruthy(); rerender(<AlertDetail view={detail as unknown as ComponentProps<typeof AlertDetail>["view"]} />); fireEvent.click(screen.getByText("View image")); expect(useCameraPage.getState().selectedId).toBe(2); fireEvent.click(screen.getByText("Acknowledge")); expect(state.acknowledge.mutate).toHaveBeenCalledWith(1);
  fireEvent.click(screen.getByText("Resolve")); fireEvent.click(screen.getAllByRole("radio")[0]); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.resolve.mutate).toHaveBeenCalled()); expect(useAlertsPage.getState().action).toBeNull();
  fireEvent.click(screen.getByText("Dispatch ranger")); fireEvent.click(screen.getByText("Cancel")); expect(useAlertsPage.getState().action).toBeNull();
  state.acknowledge.isError = true; state.acknowledge.error = new Error("Offline"); state.acknowledge.variables = 1; state.acknowledge.isPending = true; rerender(<AlertDetail view={detail as unknown as ComponentProps<typeof AlertDetail>["view"]} />); expect(screen.getByRole("alert")).toBeTruthy();
  act(() => { useAlertsPage.setState({ notice: "Dispatched.", action: "resolve" }); }); state.resolve.isError = true; state.resolve.error = new Error("Offline"); state.resolve.variables = { id: 1 }; rerender(<AlertDetail view={{ ...detail, cameraImageId: null } as unknown as ComponentProps<typeof AlertDetail>["view"]} />); expect(screen.getByRole("status")).toBeTruthy(); expect(screen.getByRole("alert")).toBeTruthy(); fireEvent.click(screen.getByText("Cancel"));
 });
 it("shows ranger open alerts, expands rows and exposes maps and resolve workflows", async () => {
  const { rerender } = render(<RangerAlertList view={{ rows: [], selected: null } as unknown as ComponentProps<typeof RangerAlertList>["view"]} />); expect(screen.getByText(/No open alerts/)).toBeTruthy(); rerender(<RangerAlertList view={{ rows: [row], selected: null } as unknown as ComponentProps<typeof RangerAlertList>["view"]} />); fireEvent.click(screen.getByRole("button")); expect(useAlertsPage.getState().selectedId).toBe(1);
  rerender(<RangerAlertList view={{ rows: [row], selected: detail } as unknown as ComponentProps<typeof RangerAlertList>["view"]} />); expect(screen.getByRole("link").getAttribute("href")).toBe(detail.mapsUrl); fireEvent.click(screen.getByText("Acknowledge")); expect(state.acknowledge.mutate).toHaveBeenCalledWith(1); fireEvent.click(screen.getByText("Resolve")); fireEvent.click(screen.getAllByRole("radio")[0]); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.resolve.mutate).toHaveBeenCalled()); expect(screen.getByRole("status").textContent).toBe("Alert resolved.");
  state.acknowledge.isError = true; state.acknowledge.error = new Error("Offline"); state.acknowledge.variables = 1; rerender(<RangerAlertList view={{ rows: [row], selected: detail } as unknown as ComponentProps<typeof RangerAlertList>["view"]} />); expect(screen.getByRole("alert")).toBeTruthy(); state.acknowledge.isError = false; state.resolve.isError = true; state.resolve.error = new Error("Offline"); state.resolve.variables = { id: 1 }; rerender(<RangerAlertList view={{ rows: [row], selected: detail } as unknown as ComponentProps<typeof RangerAlertList>["view"]} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
});
describe("rules and patrol controls", () => {
 it("opens, saves, cancels and confirms rule removal", async () => {
  const rows = [{ zoneType: "FARMLAND", label: "Farmland", severity: status, caption: "30 min" }, { zoneType: "VILLAGE", label: "Village", severity: null, caption: "No rule" }]; const rule = { zoneType: "FARMLAND", severity: "MEDIUM", cooldownMin: 30, ackSlaMin: 15 };
  const { rerender } = render(<RulesCard rows={rows as unknown as ComponentProps<typeof RulesCard>["rows"]} rules={[rule] as unknown as ComponentProps<typeof RulesCard>["rules"]} canManage />); fireEvent.click(screen.getByLabelText("Edit Farmland rule")); expect(state.save.reset).toHaveBeenCalled(); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.save.mutate).toHaveBeenCalledWith(expect.objectContaining({ zoneType: "FARMLAND" })));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false); fireEvent.click(screen.getByText("Remove rule")); expect(state.remove.mutate).not.toHaveBeenCalled(); confirm.mockReturnValue(true); fireEvent.click(screen.getByText("Remove rule")); expect(state.remove.mutate).toHaveBeenCalledWith("FARMLAND"); confirm.mockRestore(); fireEvent.click(screen.getByText("Cancel")); expect(useZonesPage.getState().ruleType).toBeNull(); fireEvent.click(screen.getByLabelText("Add Village rule")); expect(screen.queryByText("Remove rule")).toBeNull(); rerender(<RulesCard rows={rows as unknown as ComponentProps<typeof RulesCard>["rows"]} rules={[]} canManage={false} />); expect(screen.queryByRole("button")).toBeNull();
 });
 it("selects field patrols and handles empty teams", () => { const { rerender } = render(<FieldPanel patrols={[]} />); expect(screen.getByText(/No teams/)).toBeTruthy(); rerender(<FieldPanel patrols={[{ ...row, colorIndex: 0 }] as unknown as ComponentProps<typeof FieldPanel>["patrols"]} />); fireEvent.click(screen.getByRole("button")); expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true"); });
 it("starts patrols, confirms ending, cancels and shows completion", async () => {
  const patrol = { fix: null, sectors: [], start: state.acknowledge, end: state.resolve, waypoint: state.dispatch }; const view = { canStart: true, isActive: false, completedAt: null };
  const { rerender } = render(<RangerPatrolActions view={view as unknown as ComponentProps<typeof RangerPatrolActions>["view"]} patrol={patrol as unknown as ComponentProps<typeof RangerPatrolActions>["patrol"]} />); fireEvent.click(screen.getByText("Start patrol")); expect(state.acknowledge.mutate).toHaveBeenCalled();
  rerender(<RangerPatrolActions view={{ ...view, canStart: false, isActive: true } as unknown as ComponentProps<typeof RangerPatrolActions>["view"]} patrol={patrol as unknown as ComponentProps<typeof RangerPatrolActions>["patrol"]} />); fireEvent.click(screen.getByText("End patrol")); fireEvent.click(screen.getByText("Keep going")); expect(useRangerPatrolPage.getState().panel).toBeNull(); fireEvent.click(screen.getByText("End patrol")); fireEvent.click(screen.getByText("End patrol")); expect(state.resolve.mutate).toHaveBeenCalled(); expect(useRangerPatrolPage.getState().panel).toBeNull();
  fireEvent.click(screen.getByText("Add waypoint")); expect(screen.getByText(/Waiting for GPS/)).toBeTruthy(); fireEvent.click(screen.getByText("Pick location")); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.dispatch.mutate).toHaveBeenCalledWith(expect.objectContaining({ values: expect.objectContaining({ position: [6, 81] }) }))); fireEvent.click(screen.getByText("Cancel")); state.acknowledge.error = new Error("Offline"); rerender(<RangerPatrolActions view={view as unknown as ComponentProps<typeof RangerPatrolActions>["view"]} patrol={patrol as unknown as ComponentProps<typeof RangerPatrolActions>["patrol"]} />); expect(screen.getByRole("alert")).toBeTruthy(); rerender(<RangerPatrolActions view={{ completedAt: "10:00" } as unknown as ComponentProps<typeof RangerPatrolActions>["view"]} patrol={patrol as unknown as ComponentProps<typeof RangerPatrolActions>["patrol"]} />); expect(screen.getByRole("status").textContent).toContain("10:00");
 });
});

