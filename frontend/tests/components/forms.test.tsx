import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnimalForm } from "@/components/devices/animal-form";
import { DeviceForm } from "@/components/devices/device-form";
import { ParkForm } from "@/components/parks/park-form";
import { SectorForm } from "@/components/parks/sector-form";
import { NeglectForm } from "@/components/parks/neglect-form";
import { ZoneForm } from "@/components/zones/zone-form";
import { RuleForm } from "@/components/zones/rule-form";
import { UserForm } from "@/components/users/user-form";
import { IncidentTypeForm } from "@/components/incidents/incident-type-form";
import { DeclineForm } from "@/components/dispatch/decline-form";
import { CompleteForm } from "@/components/dispatch/complete-form";
import { DismissForm } from "@/components/incidents/dismiss-form";
import { ResolveForm } from "@/components/alerts/resolve-form";
import { TagImageForm } from "@/components/camera/tag-image-form";
import { CollarSimulationForm } from "@/components/simulator/collar-simulation-form";
import { CameraSimulationForm } from "@/components/simulator/camera-simulation-form";
import { EMPTY_USER } from "@/lib/users/user-form";
import { EMPTY_RULE } from "@/lib/zones/rule-form";
import { EMPTY_ZONE } from "@/lib/zones/zone-form";
const state = vi.hoisted(() => ({ mutation: { mutate: vi.fn(), isError: false, isPending: false, isSuccess: false, error: new Error("Offline"), variables: undefined as { imageId: number } | undefined, data: undefined as { sent: number; stored: number; duplicates: number } | undefined }, animals: [] as ReturnType<typeof import("@/hooks/use-new-device").useNewDevice>["animals"] }));
vi.mock("@/hooks/use-new-animal", () => ({ useNewAnimal: () => ({ create: state.mutation }) }));
vi.mock("@/hooks/use-new-device", () => ({ useNewDevice: () => ({ create: state.mutation, animals: state.animals }) }));
vi.mock("@/hooks/use-tag-image", () => ({ useTagImage: () => state.mutation }));
const boundary = JSON.stringify({ type: "Polygon", coordinates: [[[81, 6], [82, 6], [82, 7], [81, 6]]] });
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), { selector: "input,select,textarea" }), { target: { value } });
const submit = () => fireEvent.submit(document.querySelector("form")!);
beforeEach(() => {
 Object.assign(state.mutation, { isError: false, isPending: false, isSuccess: false, variables: undefined, data: undefined });
 state.mutation.mutate.mockClear(); state.animals = [];
 HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open", ""); });
});
describe("validated management forms", () => {
 it("validates an animal then submits normalized values, cancels, and reports failures", async () => {
  const close = vi.fn(); const { rerender } = render(<AnimalForm onClose={close} />);
  submit(); expect(await screen.findByText("Enter a name")).toBeTruthy();
  change("Name", " Gemunu "); change("Species", " Elephant "); submit();
  await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith({ name: "Gemunu", species: "Elephant" }));
  fireEvent.click(screen.getByText("Cancel")); expect(close).toHaveBeenCalledOnce();
  state.mutation.isError = true; state.mutation.isPending = true; rerender(<AnimalForm onClose={close} />);
  expect(screen.getByRole("alert")).toBeTruthy(); expect((screen.getByRole("button", { name: /Adding/ }) as HTMLButtonElement).disabled).toBe(true);
 });
 it("switches collar and camera fields and submits both device types", async () => {
  const { rerender } = render(<DeviceForm onClose={vi.fn()} />);
  expect(screen.getByText(/No animals yet/)).toBeTruthy(); submit(); await screen.findByText("Enter a code");
  state.animals = [{ id: 1, parkId: 1, name: "Gemunu", species: "Elephant" }]; rerender(<DeviceForm onClose={vi.fn()} />);
  change("Code", "COL-1"); change("Animal", "1"); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalled());
  change("Type", "CAMERA"); expect(screen.queryByLabelText("Animal")).toBeNull();
  change("Latitude", "6"); change("Longitude", "81"); submit();
  await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith(expect.objectContaining({ type: "CAMERA", lat: "6", lng: "81" })));
  state.mutation.isPending = true; state.mutation.isError = true; rerender(<DeviceForm onClose={vi.fn()} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("validates and creates parks", async () => {
  const save = vi.fn(), close = vi.fn(); const { rerender } = render(<ParkForm saving={false} error={null} onSubmit={save} onClose={close} />);
  submit(); await screen.findByText("Enter a name"); change("Name", "Yala"); change("Code", "YAL"); submit(); await waitFor(() => expect(save).toHaveBeenCalled());
  fireEvent.click(screen.getByText("Cancel")); expect(close).toHaveBeenCalledOnce();
  rerender(<ParkForm saving error={new Error("Offline")} onSubmit={save} onClose={close} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it.each([SectorForm, ZoneForm])("validates boundaries and saves geometry", async (Form) => {
  const save = vi.fn(); const props = { defaultValues: { ...EMPTY_ZONE, name: "", boundary: "" }, submitLabel: "Create", saving: false, error: null, onSubmit: save, onClose: vi.fn() };
  const { rerender } = render(<Form {...props} />); submit(); await screen.findByText("Paste a closed GeoJSON polygon");
  change("Name", "North"); fireEvent.change(screen.getByRole("textbox", { name: /Boundary/ }), { target: { value: boundary } }); submit(); await waitFor(() => expect(save).toHaveBeenCalled());
  rerender(<Form {...props} saving error={new Error("Offline")} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("sets neglect days with validation and saved feedback", async () => {
  const save = vi.fn(); const { rerender } = render(<NeglectForm neglectDays={7} saving={false} saved={false} error={null} onSubmit={save} />);
  change("Neglected after (days)", "0"); submit(); await screen.findByText("Enter 1 to 3650 days"); change("Neglected after (days)", "14"); submit(); await waitFor(() => expect(save).toHaveBeenCalledWith(14));
  rerender(<NeglectForm neglectDays={7} saving saved error={new Error("Offline")} onSubmit={save} />); expect(screen.getByRole("status").textContent).toBe("Saved."); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("validates alert rule limits, removes a rule and handles saving", async () => {
  const save = vi.fn(), remove = vi.fn(); const props = { title: "Zone rule", defaultValues: EMPTY_RULE, canRemove: true, busy: false, error: null, onSubmit: save, onRemove: remove, onClose: vi.fn() };
  const { rerender } = render(<RuleForm {...props} />); fireEvent.click(screen.getByText("Remove rule")); expect(remove).toHaveBeenCalledOnce();
  change("Cool-down (minutes)", "-1"); change("Acknowledge within (minutes)", "0"); submit(); await screen.findByText("Enter 0 to 1440 minutes");
  change("Cool-down (minutes)", "30"); change("Acknowledge within (minutes)", "15"); submit(); await waitFor(() => expect(save).toHaveBeenCalled());
  rerender(<RuleForm {...props} busy canRemove={false} error={new Error("Offline")} />); expect(screen.queryByText("Remove rule")).toBeNull(); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("creates users, validates required fields and edits without requiring passwords", async () => {
  const save = vi.fn(); const props = { title: "New user", submitLabel: "Create", creating: true, defaultValues: EMPTY_USER, saving: false, error: null, onSubmit: save, onClose: vi.fn() };
  const { rerender } = render(<UserForm {...props} />); submit(); await screen.findByText("Choose a role");
  change("Name", "Ranger"); change("Email", "ranger@example.com"); change("Role", "RANGER"); change("Password", "password123"); submit(); await waitFor(() => expect(save).toHaveBeenCalled());
  rerender(<UserForm {...props} creating={false} saving error={new Error("Offline")} />); expect(screen.getByText(/Leave blank/)).toBeTruthy(); expect(screen.getByRole("checkbox")).toBeTruthy(); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("creates incident types and rejects missing severity", async () => {
  const save = vi.fn(); const props = { title: "New type", submitLabel: "Create", defaultValues: { name: "", defaultSeverity: "", active: true }, saving: false, error: null, onSubmit: save, onClose: vi.fn() };
  const { rerender } = render(<IncidentTypeForm {...props as unknown as ComponentProps<typeof IncidentTypeForm>} />); submit(); await screen.findByText("Enter a name"); change("Name", "Snare"); change("Default severity", "HIGH"); submit(); await waitFor(() => expect(save).toHaveBeenCalled());
  rerender(<IncidentTypeForm {...props as unknown as ComponentProps<typeof IncidentTypeForm>} saving error={new Error("Offline")} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
});
describe("field response forms", () => {
 it.each([DeclineForm, DismissForm, CompleteForm])("validates, cancels, submits and shows mutation errors", async (Form) => {
  const save = vi.fn(), cancel = vi.fn(); const props = { saving: false, error: null, onSubmit: save, onCancel: cancel };
  const { rerender } = render(<Form {...props} />); submit();
  if (Form === DeclineForm) { await waitFor(() => expect(save).toHaveBeenCalledWith(null)); change("Reason (optional)", "Busy"); }
  if (Form === DismissForm) { await screen.findByText(/reason/i, { selector: "span.text-caption" }); change("Reason for dismissing", "Already removed"); }
  if (Form === CompleteForm) { await screen.findByText("Choose an outcome", { selector: "span" }); const option = screen.getAllByRole("option")[1] as HTMLOptionElement; change("Outcome", option.value); change("Note (optional)", "Done"); }
  submit(); await waitFor(() => expect(save).toHaveBeenCalled()); fireEvent.click(screen.getByText("Cancel")); expect(cancel).toHaveBeenCalledOnce();
  rerender(<Form {...props} saving error={new Error("Offline")} />); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("requires an alert resolution outcome and supports stacked pending controls", async () => {
  const save = vi.fn(); const { rerender } = render(<ResolveForm saving={false} onSubmit={save} onCancel={vi.fn()} />); submit(); await screen.findByText(/Choose/); fireEvent.click(screen.getAllByRole("radio")[0]); submit(); await waitFor(() => expect(save).toHaveBeenCalled());
  rerender(<ResolveForm saving stacked onSubmit={save} onCancel={vi.fn()} />); expect((screen.getByRole("button", { name: /Resolving/ }) as HTMLButtonElement).disabled).toBe(true);
 });
 it("requires tags, reveals animal fields, saves and scopes feedback to the image", async () => {
  const props = { imageId: 1, defaults: { status: "", species: "", animalCount: "" } };
  const { rerender } = render(<TagImageForm {...props as unknown as ComponentProps<typeof TagImageForm>} />); submit(); await screen.findByText("Choose what is in the image"); fireEvent.click(screen.getByLabelText(/Animals/)); submit(); await screen.findByText("Enter a species"); change("Species", "Elephant"); change("Count", "2"); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith(expect.objectContaining({ imageId: 1 })));
  fireEvent.click(screen.getByLabelText(/Empty/)); expect(screen.queryByLabelText("Species")).toBeNull();
  state.mutation.variables = { imageId: 1 }; state.mutation.isSuccess = true; rerender(<TagImageForm {...props as unknown as ComponentProps<typeof TagImageForm>} />); expect(screen.getByRole("status")).toBeTruthy();
  state.mutation.isSuccess = false; state.mutation.isError = true; state.mutation.isPending = true; rerender(<TagImageForm {...props as unknown as ComponentProps<typeof TagImageForm>} />); expect(screen.getByRole("alert")).toBeTruthy();
  rerender(<TagImageForm {...props as unknown as ComponentProps<typeof TagImageForm>} imageId={2} />); expect(screen.queryByRole("alert")).toBeNull();
 });
});
describe("simulator forms", () => {
 it("validates camera selection, sends a batch, displays result and error states", async () => {
  const { rerender } = render(<CameraSimulationForm cameras={[]} send={state.mutation as unknown as ComponentProps<typeof CameraSimulationForm>["send"]} />); expect(screen.getByText(/No cameras/)).toBeTruthy(); submit(); await screen.findByText("Choose a camera", { selector: "span" });
  rerender(<CameraSimulationForm cameras={[{ value: "CAM-1", label: "Camera 1" }]} send={state.mutation as unknown as ComponentProps<typeof CameraSimulationForm>["send"]} />); change("Camera", "CAM-1"); change("Images", "2"); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith({ cameraCode: "CAM-1", count: "2" }));
  state.mutation.data = { sent: 2, stored: 2, duplicates: 0 }; state.mutation.isError = true; state.mutation.isPending = true; rerender(<CameraSimulationForm cameras={[]} send={state.mutation as unknown as ComponentProps<typeof CameraSimulationForm>["send"]} />); expect(screen.queryByRole("status")).toBeNull(); expect(screen.getByRole("alert")).toBeTruthy();
 });
 it("switches zone and coordinate scenarios and sends validated collar fixes", async () => {
  const { rerender } = render(<CollarSimulationForm collars={[]} zones={[]} send={state.mutation as unknown as ComponentProps<typeof CollarSimulationForm>["send"]} />); expect(screen.getByText(/No collars/)).toBeTruthy(); submit(); await screen.findByText("Choose a collar", { selector: "span" });
  rerender(<CollarSimulationForm collars={[{ value: "COL-1", label: "Collar 1" }]} zones={[{ value: "1", label: "Farm" }]} send={state.mutation as unknown as ComponentProps<typeof CollarSimulationForm>["send"]} />); change("Collar", "COL-1"); change("Zone", "1"); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalled());
  fireEvent.click(screen.getByLabelText(/Single fix/)); expect(screen.queryByLabelText("Zone")).toBeNull(); change("Latitude", "6"); change("Longitude", "81"); submit(); await waitFor(() => expect(state.mutation.mutate).toHaveBeenCalledWith(expect.objectContaining({ lat: "6", lng: "81" })));
  state.mutation.data = { sent: 1, stored: 1, duplicates: 0 }; state.mutation.isError = true; state.mutation.isPending = true; rerender(<CollarSimulationForm collars={[]} zones={[]} send={state.mutation as unknown as ComponentProps<typeof CollarSimulationForm>["send"]} />); expect(screen.queryByRole("status")).toBeNull(); expect(screen.getByRole("alert")).toBeTruthy();
 });
});



