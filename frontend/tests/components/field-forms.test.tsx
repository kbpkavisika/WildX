import { createElement } from "react";
import type { ComponentProps } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PatrolForm } from "@/components/patrols/patrol-form";
import { RouteForm } from "@/components/patrols/route-form";
import { WaypointForm } from "@/components/patrols/waypoint-form";
import { ReportIncidentForm } from "@/components/incidents/report-incident-form";
import { IncidentDetail } from "@/components/incidents/incident-detail";
import { PatrolTracker } from "@/components/patrols/patrol-tracker";
const state = vi.hoisted(() => ({ mutation: { mutate: vi.fn((value?: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.()), isPending: false, isError: false, error: null as Error | null }, routes: [] as { id: number; name: string }[], rangers: [] as { id: number; name: string }[], gps: { status: "waiting", retry: vi.fn() }, gpsCallback: vi.fn<(position: [number, number]) => void>() as (position: [number, number]) => void, tracker: vi.fn(), responders: [] as ReturnType<typeof import("@/hooks/use-dispatch").useDispatch>["options"], dispatched: vi.fn(), detail: { isPending: false, error: null as Error | null, view: null as unknown as ComponentProps<typeof import("@/components/incidents/triage-panel").TriagePanel>["view"] | null, photoUrl: null, photoError: false, sectors: [], severity: null as { isPending: boolean; error: Error | null } | null, dismiss: null as { isPending: boolean; error: Error | null } | null, refresh: vi.fn() } }));
vi.mock("next/dynamic", () => ({ default: () => ({ onPick, onAdd, value }: { onPick?: (position: [number, number]) => void; onAdd?: (position: [number, number]) => void; value?: [number, number] | null }) => <button type="button" onClick={() => { onPick?.([6, 81]); onAdd?.([6, 81]); }}>Pick location {value?.join(",")}</button> }));
vi.mock("next/image", () => ({ default: ({ src, alt, className }: Pick<ComponentProps<"img">, "src" | "alt" | "className">) => createElement("img", { src, alt, className }) }));
vi.mock("@/hooks/use-save-patrol", () => ({ useSavePatrol: () => ({ routes: state.routes, rangers: state.rangers, save: state.mutation }) }));
vi.mock("@/hooks/use-park-sectors", () => ({ useParkSectors: () => [] }));
vi.mock("@/hooks/use-gps-fix", () => ({ useGpsFix: (callback: (position: [number, number]) => void) => { state.gpsCallback = callback; return state.gps; } }));
vi.mock("@/hooks/use-patrol-tracker", () => ({ usePatrolTracker: () => state.tracker() }));
vi.mock("@/hooks/use-incident-detail", () => ({ useIncidentDetail: () => state.detail }));
vi.mock("@/hooks/use-dispatch", () => ({ useDispatch: (_source: unknown, _position: unknown, onDispatched: () => void) => ({ isPending: false, isError: false, options: state.responders, dispatch: { ...state.mutation, mutate: (values: unknown) => { state.dispatched(values); onDispatched(); } } }) }));
beforeEach(() => {
 vi.clearAllMocks(); Object.assign(state.mutation, { isPending: false, isError: false, error: null }); state.routes = []; state.rangers = []; state.gps.status = "waiting"; Object.assign(state.detail, { isPending: false, error: null, view: null, severity: state.mutation, dismiss: state.mutation });
 HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open", ""); });
});
const change = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label, { selector: "input,select,textarea" }), { target: { value } });
const submit = () => fireEvent.submit(document.querySelector("form")!);
describe("patrol and route forms", () => {
 it("assigns multiple rangers after validation, handles empty options and pending errors", async () => {
  const { rerender } = render(<PatrolForm patrol={null} onClose={vi.fn()} />); expect(screen.getByText(/No active rangers/)).toBeTruthy(); submit(); await screen.findByText("Choose at least one ranger");
  state.routes = [{ id: 1, name: "North" }]; state.rangers = [{ id: 1, name: "Jay" }, { id: 2, name: "Sam" }]; rerender(<PatrolForm patrol={null} onClose={vi.fn()} />); change(/Route/, "1"); change(/Date/, "2099-10-10"); fireEvent.click(screen.getByLabelText("Jay")); fireEvent.click(screen.getByLabelText("Sam")); expect(screen.getByText("Create 2 patrols")).toBeTruthy(); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith({ routeId: "1", rangerIds: ["1", "2"], scheduledDate: "2099-10-10" }));
  state.mutation.isPending = true; state.mutation.isError = true; state.mutation.error = new Error("Offline"); rerender(<PatrolForm patrol={null} onClose={vi.fn()} />); expect(screen.getByRole("alert")).toBeTruthy(); expect((screen.getByRole("button", { name: /Saving/ }) as HTMLButtonElement).disabled).toBe(true);
 });
 it("edits patrols with a single ranger and validates missing choices", async () => {
  state.routes = [{ id: 1, name: "North" }]; state.rangers = [{ id: 1, name: "Jay" }, { id: 2, name: "Sam" }]; render(<PatrolForm patrol={{ id: 1, route: { id: 1 }, rangerId: 1, scheduledDate: "2099-10-10" } as unknown as ComponentProps<typeof PatrolForm>["patrol"]} onClose={vi.fn()} />); expect(screen.getByRole("heading", { name: "Edit PT-1" })).toBeTruthy(); change(/Ranger/, ""); submit(); await screen.findByText("Choose at least one ranger"); change(/Ranger/, "2"); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith(expect.objectContaining({ rangerIds: ["2"] })));
 });
 it("validates route drawing, undoes and clears points, parses pasted GeoJSON and submits", async () => {
  const save = vi.fn(); const props = { title: "New route", submitLabel: "Create", defaultValues: { name: "", points: [] }, saving: false, error: null, onSubmit: save, onClose: vi.fn() };
  const { rerender } = render(<RouteForm {...props as unknown as ComponentProps<typeof RouteForm>} />); expect((screen.getByText("Undo") as HTMLButtonElement).disabled).toBe(true); submit(); await screen.findByText("Enter a name"); change(/Name/, "North"); fireEvent.click(screen.getByText(/Pick location/)); fireEvent.click(screen.getByText("Undo")); fireEvent.click(screen.getByText(/Pick location/)); fireEvent.click(screen.getByText("Clear")); fireEvent.click(screen.getByText("Paste GeoJSON")); change(/Path/, "invalid"); expect(screen.getByText("Paste a GeoJSON LineString with at least 2 points")).toBeTruthy(); change(/Path/, JSON.stringify({ type: "LineString", coordinates: [[81, 6], [82, 7]] })); submit(); await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: "North", points: [[6, 81], [7, 82]] }), expect.anything())); fireEvent.click(screen.getByText("Draw on map")); fireEvent.click(screen.getByText("Paste GeoJSON")); expect((screen.getByRole("textbox", { name: /Path/ }) as HTMLTextAreaElement).value).toContain("LineString");
  rerender(<RouteForm {...props as unknown as ComponentProps<typeof RouteForm>} saving error={new Error("Offline")} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("waits for GPS then allows a manually positioned waypoint and submits", async () => {
  const save = vi.fn(), cancel = vi.fn(); const props = { gpsPosition: null, sectors: [], saving: false, error: null, onSubmit: save, onCancel: cancel };
  const { rerender } = render(<WaypointForm {...props} />); expect((screen.getByText("Save waypoint") as HTMLButtonElement).disabled).toBe(true); fireEvent.click(screen.getByText(/Pick location/)); change(/Note/, "Waterhole clear"); submit(); await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ position: [6, 81], note: "Waterhole clear" }), expect.anything())); fireEvent.click(screen.getByText("Cancel")); expect(cancel).toHaveBeenCalledOnce(); rerender(<WaypointForm {...props} gpsPosition={[6, 81]} saving error={new Error("Offline")} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
});
describe("incident reporting and detail", () => {
 it("validates required type and location, retries GPS, protects manual picks and handles photo upload", async () => {
  const save = vi.fn(); const props = { typeOptions: [{ id: 1, name: "Snare" }], sectors: [], saving: false, error: null, onSubmit: save };
  const { rerender } = render(<ReportIncidentForm {...props as unknown as ComponentProps<typeof ReportIncidentForm>} />); expect(screen.getByText(/Finding your location/)).toBeTruthy(); submit(); await screen.findByText("Tap the map to set the location"); state.gps.status = "failed"; rerender(<ReportIncidentForm {...props as unknown as ComponentProps<typeof ReportIncidentForm>} />); fireEvent.click(screen.getByText("Try GPS again")); expect(state.gps.retry).toHaveBeenCalled();
  act(() => state.gpsCallback([7, 82])); expect(screen.getByText(/Location from GPS/)).toBeTruthy(); fireEvent.click(screen.getByText(/Pick location/)); expect(screen.getByText(/Location set on the map/)).toBeTruthy(); act(() => state.gpsCallback([8, 83])); expect(screen.getByText(/Pick location/).textContent).toContain("6,81"); change(/Type/, "1"); change(/Description/, " Snare near water ");
  const photo = new File(["photo"], "evidence.jpg", { type: "image/jpeg" }); fireEvent.change(screen.getByLabelText(/Photo/), { target: { files: [photo] } }); expect(screen.getByText("evidence.jpg")).toBeTruthy(); submit(); await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ typeId: "1", description: "Snare near water", photo, location: { position: [6, 81], source: "MANUAL" } }), expect.anything()));
  fireEvent.change(screen.getByLabelText(/Photo/), { target: { files: [] } }); expect(screen.queryByText("evidence.jpg")).toBeNull(); rerender(<ReportIncidentForm {...props as unknown as ComponentProps<typeof ReportIncidentForm>} saving error={new Error("Offline")} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("rejects unsupported evidence photo types", async () => { render(<ReportIncidentForm typeOptions={[]} sectors={[]} saving={false} error={null} onSubmit={vi.fn()} />); fireEvent.change(screen.getByLabelText(/Photo/), { target: { files: [new File(["text"], "photo.txt", { type: "text/plain" })] } }); expect(await screen.findByText("Use a JPEG or PNG photo")).toBeTruthy(); });
 it("loads incident details, reports failures and wires close, severity and dismissal", async () => {
  state.detail.isPending = true; const close = vi.fn(); const { rerender } = render(<IncidentDetail id={1} onClose={close} />); expect(screen.getByText(/Loading incident/)).toBeTruthy(); state.detail.isPending = false; state.detail.error = new Error("Offline"); rerender(<IncidentDetail id={1} onClose={close} />); expect(screen.getByText("Could not reach WildX. Try again.")).toBeTruthy(); state.detail.error = null;
  state.detail.view = { id: 1, title: "Snare", subtitle: "North", status: { tone: "neutral", label: "Reported" }, severity: "MEDIUM", position: [6, 81], facts: [], hasPhoto: false, canChangeSeverity: true, canDispatchOrDismiss: true }; rerender(<IncidentDetail id={1} onClose={close} />); fireEvent.click(screen.getByLabelText("Close")); expect(close).toHaveBeenCalledOnce(); change(/Severity/, "HIGH"); expect(state.mutation.mutate).toHaveBeenCalledWith("HIGH"); fireEvent.click(screen.getByText("Dismiss incident")); change(/Reason for/, "Already removed"); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith("Already removed", expect.anything())); state.responders = [{ id: 1, name: "Jay", initials: "JD", presence: { tone: "positive" as const, label: "Active" }, distance: "1 km" }]; fireEvent.click(screen.getByText("Dispatch responder")); fireEvent.click(screen.getByRole("radio")); submit(); await waitFor(() => expect(state.detail.refresh).toHaveBeenCalledOnce()); fireEvent.click(screen.getByText("Dismiss incident")); fireEvent.click(screen.getByText("Cancel")); rerender(<IncidentDetail id={1} />); expect(screen.queryByLabelText("Close")).toBeNull();
 });
 it("starts the headless patrol tracker", () => { render(<PatrolTracker />); expect(state.tracker).toHaveBeenCalledOnce(); });
});


