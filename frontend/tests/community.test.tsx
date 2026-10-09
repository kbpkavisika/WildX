import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommunityReport } from "@/lib/api/community";
import { CommunityTable } from "@/components/community/community-table";
import { ValidationDialog } from "@/components/community/validation-dialog";
import { InvalidationDialog } from "@/components/community/invalidation-dialog";
import { LocationDialog } from "@/components/community/location-dialog";
import { EvidenceDialog } from "@/components/community/evidence-dialog";
import { HotspotsStrip } from "@/components/community/hotspots-strip";
import { SmsHelpCardDialog } from "@/components/community/sms-help-card-dialog";
import { CommunityDispatchDialog } from "@/components/community/dispatch-dialog";
import CommunityPage from "@/app/dashboard/community/page";

const boundary = vi.hoisted(() => ({
  can: true,
  photo: { photoUrl: null as string | null, photoLoading: false, photoError: null as Error | null },
  fetchSegments: vi.fn(), fetchPhoto: vi.fn(), download: vi.fn(),
  help: { data: undefined as unknown, isPending: false, isError: false },
  reports: { data: undefined as CommunityReport[] | undefined, isPending: false, isError: false, isFetching: false, refetch: vi.fn() },
  hotspots: { data: [] },
  validate: { mutate: vi.fn(), isPending: false },
  invalidate: { mutate: vi.fn(), isPending: false },
  updateLocation: { mutate: vi.fn(), isPending: false },
  filter: vi.fn(),
  dispatch: { options: [], isPending: false, isError: false, dispatch: { mutate: vi.fn(), isPending: false, isError: false, error: null } },
}));

vi.mock("@/hooks/use-can", () => ({ useCan: () => boundary.can }));
vi.mock("@/hooks/use-community-report-photo", () => ({ useCommunityReportPhoto: () => boundary.photo }));
vi.mock("@/lib/api/public-report", () => ({ fetchPublicSegments: boundary.fetchSegments }));
vi.mock("@/lib/api/community", () => ({ fetchCommunityReportPhoto: boundary.fetchPhoto }));
vi.mock("@/lib/files", () => ({ downloadBlob: boundary.download }));
vi.mock("@/hooks/use-dispatch", () => ({ useDispatch: () => boundary.dispatch }));
vi.mock("@/hooks/use-community-reports", () => ({
  useSmsHelpCardQuery: () => boundary.help,
  useCommunityReports: (status: string) => { boundary.filter(status); return boundary; },
}));

const report: CommunityReport = {
  id: 1, referenceCode: "R-1", parkId: 1, segmentId: null, segmentCode: null, segmentName: null,
  channel: "SMS", reporterPhone: "0771234567", type: "SIGHTING", animalCount: 1, description: null,
  photoPath: null, lat: null, lng: null, rawText: null, status: "NEW", duplicateOfId: null,
  duplicateOfRef: null, severity: null, invalidReason: null, outcome: null,
  createdAt: "2026-10-09T08:00:00Z", closedAt: null,
};
const segment = { id: 2, parkId: 1, code: "N2", name: "North", centerLat: 6, centerLng: 81 };
const noop = vi.fn();

beforeEach(() => {
  boundary.can = true;
  Object.assign(boundary.photo, { photoUrl: null, photoLoading: false, photoError: null });
  Object.assign(boundary.help, { data: undefined, isPending: false, isError: false });
  Object.assign(boundary.reports, { data: undefined, isPending: false, isError: false, isFetching: false });
  boundary.fetchSegments.mockResolvedValue([segment]);
  boundary.fetchPhoto.mockResolvedValue(new Blob(["image"]));
  for (const mutation of [boundary.validate, boundary.invalidate, boundary.updateLocation]) {
    mutation.isPending = false;
    mutation.mutate.mockImplementation((_input, options) => options?.onSuccess());
  }
});

describe("COM community reports", () => {
  it("shows empty labels without rendering a table", () => {
    const props = { reports: [], onOpenValidate: noop, onOpenInvalidate: noop, onOpenLocation: noop, onOpenDispatch: noop };
    const { rerender } = render(<CommunityTable {...props} />);
    expect(screen.getByText("No community reports in this view.")).toBeTruthy();
    rerender(<CommunityTable {...props} emptyMessage="No matches" />);
    expect(screen.getByText("No matches")).toBeTruthy();
  });

  it("displays each status, optional evidence, coordinates and its actions", () => {
    const statuses = ["NEW", "NEEDS_LOCATION", "VALIDATED", "DISPATCHED", "CLOSED", "INVALID", "DUPLICATE", "OTHER"];
    const reports = statuses.map((status, index) => ({ ...report, id: index + 1, referenceCode: `R-${index + 1}`, status,
      ...(index % 2 ? { segmentName: "North", segmentCode: "N2", animalCount: 2, description: "Elephants nearby", channel: "WEB", photoPath: "photo.jpg", lat: 6, lng: 81, severity: "HIGH", invalidReason: "Unconfirmed", outcome: "Safe", duplicateOfRef: "R-0" } : {}) }));
    const validate = vi.fn(); const invalidate = vi.fn(); const location = vi.fn(); const dispatch = vi.fn();
    render(<CommunityTable reports={reports} onOpenValidate={validate} onOpenInvalidate={invalidate} onOpenLocation={location} onOpenDispatch={dispatch} />);
    expect(screen.getAllByRole("row")).toHaveLength(9);
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    expect(validate).toHaveBeenCalledWith(reports[0]);
    fireEvent.click(screen.getByRole("button", { name: "Invalid" }));
    expect(invalidate).toHaveBeenCalledWith(reports[0]);
    fireEvent.click(screen.getByRole("button", { name: "Set location" }));
    expect(location).toHaveBeenCalledWith(reports[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Assign segment" })[0]);
    expect(location).toHaveBeenCalledWith(reports[0]);
    fireEvent.click(screen.getByRole("button", { name: "Dispatch responder" }));
    expect(dispatch).toHaveBeenCalledWith(reports[2]);
    expect(screen.getAllByTitle("Open in Google Maps")[0].getAttribute("href")).toBe("https://www.google.com/maps?q=6,81");
    fireEvent.click(screen.getAllByRole("button", { name: "View photo" })[0]);
    expect(screen.getByRole("heading", { name: /Photo Evidence/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("heading", { name: /Photo Evidence/ })).toBeNull();
  });

  it("hides mutation controls from readers", () => {
    boundary.can = false;
    render(<CommunityTable reports={[report]} onOpenValidate={noop} onOpenInvalidate={noop} onOpenLocation={noop} onOpenDispatch={noop} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows only active conflict hotspots", () => {
    const { rerender, container } = render(<HotspotsStrip hotspots={[]} />);
    expect(container.textContent).toBe("");
    rerender(<HotspotsStrip hotspots={[{ segmentId: 1, segmentCode: "N1", segmentName: "North", conflictCount: 8, isHotspot: true }, { segmentId: 2, segmentCode: "S1", segmentName: "South", conflictCount: 1, isHotspot: false }]} />);
    expect(screen.getByText("8 conflicts")).toBeTruthy();
    expect(screen.queryByText("South")).toBeNull();
  });

  it("validates at the selected severity and handles photo/pending states", () => {
    const validate = vi.fn(); const close = vi.fn();
    const props = { report, open: false, loading: false, onClose: close, onValidate: validate };
    const { rerender, container } = render(<ValidationDialog {...props} />);
    expect(container.textContent).toBe("");
    rerender(<ValidationDialog {...props} open report={null} />);
    expect(container.textContent).toBe("");
    rerender(<ValidationDialog {...props} open />);
    fireEvent.click(screen.getByRole("button", { name: "HIGH" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Validation" }));
    expect(validate).toHaveBeenCalledWith(1, "HIGH");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(close).toHaveBeenCalledOnce();
    boundary.photo.photoLoading = true;
    rerender(<ValidationDialog {...props} open report={{ ...report, photoPath: "photo" }} loading />);
    expect((screen.getByRole("button", { name: /Validating/ }) as HTMLButtonElement).disabled).toBe(true);
    boundary.photo.photoLoading = false;
    boundary.photo.photoUrl = "blob:evidence";
    rerender(<ValidationDialog {...props} open report={{ ...report, photoPath: "photo" }} />);
    expect(screen.getByRole("img").getAttribute("src")).toBe("blob:evidence");
    boundary.photo.photoUrl = null;
    rerender(<ValidationDialog {...props} open report={{ ...report, photoPath: "photo" }} />);
    expect(screen.queryByRole("img")).toBeNull();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("requires a nonblank invalidation reason and trims it", () => {
    const invalidate = vi.fn(); const close = vi.fn();
    const props = { report, open: false, loading: false, onClose: close, onInvalidate: invalidate };
    const { rerender, container } = render(<InvalidationDialog {...props} />);
    expect(container.textContent).toBe("");
    rerender(<InvalidationDialog {...props} open report={null} />);
    expect(container.textContent).toBe("");
    rerender(<InvalidationDialog {...props} open />);
    fireEvent.submit(container.querySelector("form")!);
    expect(invalidate).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Invalidate Report" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  False alarm  " } });
    fireEvent.click(screen.getByRole("button", { name: "Invalidate Report" }));
    expect(invalidate).toHaveBeenCalledWith(1, "False alarm");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(close).toHaveBeenCalledTimes(2);
    rerender(<InvalidationDialog {...props} open loading />);
    expect((screen.getByRole("button", { name: /Invalidating/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("loads landmarks, selects one and submits its code", async () => {
    boundary.fetchSegments.mockResolvedValue([segment, { ...segment, id: 3, code: "S3", name: "South" }]);
    const update = vi.fn(); const close = vi.fn();
    const props = { report: { ...report, rawText: "ELEPHANT NORTH" }, open: true, loading: false, onClose: close, onUpdateLocation: update };
    const { rerender, container } = render(<LocationDialog {...props} />);
    fireEvent.submit(container.querySelector("form")!);
    expect(update).not.toHaveBeenCalled();
    await waitFor(() => expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("2"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Assign Location" }));
    expect(update).toHaveBeenCalledWith(1, 3, "S3");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(close).toHaveBeenCalledTimes(2);
    rerender(<LocationDialog {...props} loading />);
    expect((screen.getByRole("button", { name: /Assigning/ }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<LocationDialog {...props} open={false} />);
    expect(container.textContent).toBe("");
    rerender(<LocationDialog {...props} report={null} />);
    expect(container.textContent).toBe("");
  });

  it.each(["empty", "error"])("disables location assignment when landmark fetch is %s", async (state) => {
    if (state === "error") boundary.fetchSegments.mockRejectedValue(new Error("offline"));
    else boundary.fetchSegments.mockResolvedValue([]);
    render(<LocationDialog report={report} open loading={false} onClose={noop} onUpdateLocation={noop} />);
    await waitFor(() => expect(boundary.fetchSegments).toHaveBeenCalled());
    expect((screen.getByRole("button", { name: "Assign Location" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows evidence loading, unavailable and loaded states and downloads", async () => {
    const close = vi.fn();
    const props = { report: { ...report, photoPath: "photo", reporterPhone: "", description: "Elephant", animalCount: 2 }, open: false, onOpenChange: close };
    const { rerender, container } = render(<EvidenceDialog {...props} />);
    expect(container.textContent).toBe("");
    rerender(<EvidenceDialog {...props} open report={null} />);
    expect(container.textContent).toBe("");
    boundary.photo.photoLoading = true;
    rerender(<EvidenceDialog {...props} open />);
    expect(screen.getByText(/Loading high-resolution/)).toBeTruthy();
    boundary.photo.photoLoading = false;
    rerender(<EvidenceDialog {...props} open />);
    expect(screen.getByText("Unable to load evidence photo")).toBeTruthy();
    boundary.photo.photoUrl = "blob:image";
    rerender(<EvidenceDialog {...props} open />);
    expect(screen.getByRole("img").getAttribute("src")).toBe("blob:image");
    expect(screen.getByText("Unknown")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(boundary.download).toHaveBeenCalledWith(expect.any(Blob), "R-1-evidence.jpg"));
    expect(boundary.fetchPhoto).toHaveBeenCalledWith(1, 1);
    boundary.fetchPhoto.mockRejectedValue(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect((screen.getByRole("button", { name: "Download" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(container.querySelector('[aria-hidden="true"]')!);
    expect(close).toHaveBeenCalledWith(false);
    boundary.photo.photoError = new Error("missing");
    rerender(<EvidenceDialog {...props} open report={report} />);
    expect(screen.getByText("Unable to load evidence photo")).toBeTruthy();
  });

  it("loads, prints and closes the multilingual SMS help card", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const close = vi.fn();
    const { rerender, container } = render(<SmsHelpCardDialog open={false} onClose={close} />);
    expect(container.textContent).toBe("");
    boundary.help.isPending = true;
    rerender(<SmsHelpCardDialog open onClose={close} />);
    expect(screen.getByText(/Loading SMS help card/)).toBeTruthy();
    boundary.help.isPending = false; boundary.help.isError = true;
    rerender(<SmsHelpCardDialog open onClose={close} />);
    expect(screen.getByText(/Could not load SMS/)).toBeTruthy();
    boundary.help.isError = false;
    boundary.help.data = { parkName: "Yala", shortCode: "1992", format: "TYPE PLACE", example: "ELEPHANT NORTH", keywords: [{ type: "SIGHTING", label: "Sighting", english: "ELEPHANT", sinhala: "SI", tamil: "TA" }], landmarks: [segment] };
    rerender(<SmsHelpCardDialog open onClose={close} />);
    expect(screen.getByText("1992")).toBeTruthy();
    expect(screen.getByText("N2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Print help card" }));
    expect(print).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("renders dispatch report context and closes on cancel", () => {
    const close = vi.fn();
    const props = { report, open: false, onClose: close, onDispatched: noop };
    const { rerender, container } = render(<CommunityDispatchDialog {...props} />);
    expect(container.textContent).toBe("");
    rerender(<CommunityDispatchDialog {...props} open report={null} />);
    expect(container.textContent).toBe("");
    rerender(<CommunityDispatchDialog {...props} open />);
    expect(screen.getByText("No segment")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(close).toHaveBeenCalledOnce();
    rerender(<CommunityDispatchDialog {...props} open report={{ ...report, segmentName: "North", lat: 6, lng: 81 }} />);
    expect(screen.getByTitle("Open exact coordinates in Google Maps").getAttribute("href")).toBe("https://www.google.com/maps?q=6,81");
  });

  it("searches the community queue, switches status and refreshes", async () => {
    boundary.reports.data = [report, { ...report, id: 2, referenceCode: "R-2", status: "NEEDS_LOCATION", segmentName: "South" }];
    render(<CommunityPage />);
    const search = screen.getByPlaceholderText("Search reference, phone, location...");
    fireEvent.change(search, { target: { value: " South " } });
    expect(screen.queryByText("R-1")).toBeNull();
    expect(screen.getByText("R-2")).toBeTruthy();
    fireEvent.change(search, { target: { value: "missing" } });
    expect(screen.getByText('No community reports match "missing".')).toBeTruthy();
    fireEvent.change(search, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /New/ }));
    expect(boundary.filter).toHaveBeenLastCalledWith("NEW");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(boundary.reports.refetch).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "SMS help card" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Printable SMS Help Card")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Validation" }));
    expect(boundary.validate.mutate).toHaveBeenCalledWith({ id: 1, severity: "MEDIUM" }, expect.any(Object));
    expect(screen.queryByRole("heading", { name: "Validate Report" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Invalid" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for invalidation" }), { target: { value: "False alarm" } });
    fireEvent.click(screen.getByRole("button", { name: "Invalidate Report" }));
    expect(boundary.invalidate.mutate).toHaveBeenCalledWith({ id: 1, reason: "False alarm" }, expect.any(Object));
    fireEvent.click(screen.getAllByRole("button", { name: "Assign segment" })[0]);
    await waitFor(() => expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("2"));
    fireEvent.click(screen.getByRole("button", { name: "Assign Location" }));
    expect(boundary.updateLocation.mutate).toHaveBeenCalledWith({ id: 1, segmentId: 2, landmarkCode: "N2" }, expect.any(Object));
  });

  it("renders pending, error and empty queue states", () => {
    boundary.reports.isPending = true;
    const { rerender } = render(<CommunityPage />);
    expect(screen.getByText(/Loading reports/)).toBeTruthy();
    boundary.reports.isPending = false; boundary.reports.isError = true; boundary.reports.isFetching = true;
    rerender(<CommunityPage />);
    expect(screen.getByText(/Could not load community reports/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Refresh" }) as HTMLButtonElement).disabled).toBe(true);
    boundary.reports.data = []; boundary.reports.isError = false;
    rerender(<CommunityPage />);
    expect(screen.getByText("No community reports in this view.")).toBeTruthy();
  });

  it("opens and cancels queue dialogs", async () => {
    boundary.reports.data = [report, { ...report, id: 2, referenceCode: "R-2", status: "VALIDATED" }];
    render(<CommunityPage />);
    for (const name of ["Validate", "Invalid", "Assign segment"]) {
      fireEvent.click(screen.getAllByRole("button", { name })[0]);
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Dispatch responder" }));
    expect(screen.getByRole("heading", { name: "Dispatch Ranger" })).toBeTruthy();
    const heading = screen.getByRole("heading", { name: "Dispatch Ranger" });
    fireEvent.click(within(heading.parentElement!.parentElement!).getByRole("button"));
    expect(screen.queryByRole("heading", { name: "Dispatch Ranger" })).toBeNull();
    await waitFor(() => expect(boundary.fetchSegments).toHaveBeenCalled());
  });
});
