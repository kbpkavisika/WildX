import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import VillagerReportPage from "@/app/report/page";
import StatusLookup from "@/app/report/status/page";
import ReportStatus from "@/app/report/[ref]/page";
import { DICTIONARIES, useI18nStore } from "@/lib/i18n";
import type { PublicReportResponse } from "@/lib/api/public-report";

const boundary = vi.hoisted(() => ({
  fetchSegments: vi.fn(), submit: vi.fn(), fetchReport: vi.fn(),
  push: vi.fn(), params: { ref: "R-1" as string | string[] },
  query: { data: undefined as PublicReportResponse | undefined, isPending: false, isError: false },
  queryOptions: vi.fn(), createUrl: vi.fn(), revokeUrl: vi.fn(),
}));

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: boundary.push }), useParams: () => boundary.params }));
vi.mock("@/lib/api/public-report", () => ({ fetchPublicSegments: boundary.fetchSegments, submitPublicReport: boundary.submit, fetchPublicReport: boundary.fetchReport }));
vi.mock("@tanstack/react-query", () => ({ useQuery: (options: unknown) => { boundary.queryOptions(options); return boundary.query; } }));

const t = DICTIONARIES.en;
const segment = { id: 2, parkId: 1, code: "N2", name: "North", centerLat: 6, centerLng: 81 };
const report: PublicReportResponse = { referenceCode: "R-1", status: "NEW", type: "SIGHTING", animalCount: 1, description: null, landmarkCode: null, segmentName: null, photoPath: null, outcome: null, createdAt: null, closedAt: null };

beforeEach(() => {
  useI18nStore.setState({ language: "en" });
  boundary.params.ref = "R-1";
  Object.assign(boundary.query, { data: undefined, isPending: false, isError: false });
  boundary.fetchSegments.mockResolvedValue([segment]);
  boundary.submit.mockResolvedValue(report);
  boundary.createUrl.mockReturnValue("blob:preview");
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = boundary.createUrl;
    static revokeObjectURL = boundary.revokeUrl;
  });
});

describe("COM-02 public report", () => {
  it("validates the phone before submitting", async () => {
    const { container } = render(<VillagerReportPage />);
    await waitFor(() => expect(boundary.fetchSegments).toHaveBeenCalledWith(1));
    fireEvent.submit(container.querySelector("form")!);
    expect(boundary.submit).not.toHaveBeenCalled();
    expect(screen.getAllByText(t.phoneHint).length).toBeGreaterThan(1);
    fireEvent.change(screen.getByPlaceholderText(t.phonePlaceholder), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    expect(boundary.submit).not.toHaveBeenCalled();
  });

  it("submits selected type, count, trimmed details and landmark and resets after success", async () => {
    render(<VillagerReportPage />);
    fireEvent.click(screen.getByRole("button", { name: t.landmarkLabel }));
    await waitFor(() => expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("2"));
    fireEvent.click(screen.getByRole("button", { name: t.cropDamage }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.change(screen.getByPlaceholderText(t.phonePlaceholder), { target: { value: " 0771234567 " } });
    fireEvent.change(screen.getByPlaceholderText(t.notesPlaceholder), { target: { value: "  Paddy damaged  " } });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => expect(boundary.submit).toHaveBeenCalledWith({ parkId: 1, type: "CROP_DAMAGE", animalCount: 2, reporterPhone: "0771234567", description: "Paddy damaged", segmentId: 2, landmarkCode: "N2", lat: undefined, lng: undefined }, undefined));
    expect(await screen.findByRole("heading", { name: t.reportSuccess })).toBeTruthy();
    expect(screen.getByRole("link", { name: t.trackReport }).getAttribute("href")).toBe("/report/R-1");
    fireEvent.click(screen.getByRole("button", { name: t.submitAnother }));
    expect((screen.getByPlaceholderText(t.phonePlaceholder) as HTMLInputElement).value).toBe("");
    expect((screen.getByPlaceholderText(t.notesPlaceholder) as HTMLInputElement).value).toBe("");
  });

  it("keeps the count above zero and supports numeric input and other reports", async () => {
    render(<VillagerReportPage />);
    await waitFor(() => expect(boundary.fetchSegments).toHaveBeenCalled());
    const count = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.click(count.previousElementSibling!);
    expect(count.value).toBe("1");
    fireEvent.change(count, { target: { value: "0" } });
    expect(count.value).toBe("1");
    fireEvent.change(count, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: t.other }));
    fireEvent.change(screen.getByPlaceholderText(t.phonePlaceholder), { target: { value: "0771234567" } });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => expect(boundary.submit).toHaveBeenCalledWith(expect.objectContaining({ type: "OTHER", animalCount: 4, description: undefined, lat: undefined, lng: undefined }), undefined));
  });

  it("acquires GPS, refreshes it and sends coordinates", async () => {
    let success: PositionCallback | undefined;
    const getPosition = vi.fn((onSuccess: PositionCallback) => { success = onSuccess; });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: getPosition } });
    render(<VillagerReportPage />);
    fireEvent.click(screen.getByRole("button", { name: "GPS" }));
    expect((screen.getByRole("button", { name: t.gpsAcquiring }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "GPS" }));
    expect(getPosition).toHaveBeenCalledOnce();
    act(() => success?.({ coords: { latitude: 6, longitude: 81 } } as GeolocationPosition));
    expect(screen.getByText(t.gpsSuccess)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "GPS" }));
    expect(getPosition).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    act(() => success?.({ coords: { latitude: 7, longitude: 82 } } as GeolocationPosition));
    fireEvent.change(screen.getByPlaceholderText(t.phonePlaceholder), { target: { value: "0771234567" } });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => expect(boundary.submit).toHaveBeenCalledWith(expect.objectContaining({ lat: 7, lng: 82, segmentId: undefined, landmarkCode: undefined }), undefined));
  });

  it.each(["unavailable", "denied"])("shows GPS fallback when location is %s", async (state) => {
    vi.stubGlobal("navigator", state === "unavailable" ? {} : { geolocation: { getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1 } as GeolocationPositionError) } });
    render(<VillagerReportPage />);
    fireEvent.click(screen.getByRole("button", { name: t.useGps }));
    expect(screen.getByText(t.gpsError)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: t.landmarkLabel }));
    expect(await screen.findByRole("combobox")).toBeTruthy();
  });

  it("previews, removes and uploads photos", async () => {
    const { container } = render(<VillagerReportPage />);
    await waitFor(() => expect(boundary.fetchSegments).toHaveBeenCalled());
    const file = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    const upload = container.querySelector('input[type="file"]')!;
    fireEvent.change(upload, { target: { files: [] } });
    expect(boundary.createUrl).not.toHaveBeenCalled();
    fireEvent.change(upload, { target: { files: [file] } });
    expect(screen.getByAltText("Selected photo").getAttribute("src")).toBe("blob:preview");
    fireEvent.click(screen.getByAltText("Selected photo").parentElement!.querySelector("button")!);
    expect(boundary.revokeUrl).toHaveBeenCalledWith("blob:preview");
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText(t.phonePlaceholder), { target: { value: "0771234567" } });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => expect(boundary.submit).toHaveBeenCalledWith(expect.any(Object), file));
    fireEvent.click(await screen.findByRole("button", { name: t.submitAnother }));
    expect(screen.queryByAltText("Selected photo")).toBeNull();
    expect(boundary.revokeUrl).toHaveBeenCalledTimes(2);
  });

  it.each(["empty", "failed"])("can submit after landmark fetch is %s", async (state) => {
    if (state === "failed") boundary.fetchSegments.mockRejectedValue(new Error("offline"));
    else boundary.fetchSegments.mockResolvedValue([]);
    render(<VillagerReportPage />);
    fireEvent.click(screen.getByRole("button", { name: t.landmarkLabel }));
    await waitFor(() => expect(boundary.fetchSegments).toHaveBeenCalled());
    fireEvent.change(screen.getByPlaceholderText(t.phonePlaceholder), { target: { value: "0771234567" } });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => expect(boundary.submit).toHaveBeenCalledWith(expect.objectContaining({ segmentId: undefined, landmarkCode: undefined }), undefined));
  });

  it("disables submission while sending and shows request errors", async () => {
    let reject: ((reason: Error) => void) | undefined;
    boundary.submit.mockImplementation(() => new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }));
    render(<VillagerReportPage />);
    await waitFor(() => expect(boundary.fetchSegments).toHaveBeenCalled());
    fireEvent.change(screen.getByPlaceholderText(t.phonePlaceholder), { target: { value: "0771234567" } });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    expect((screen.getByRole("button", { name: t.submitting }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => reject?.(new Error("offline")));
    expect(screen.getByText(t.errorSubmitting)).toBeTruthy();
    expect((screen.getByRole("button", { name: t.submit }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("COM-12 status lookup", () => {
  it("requires a reference and clears the error on input", () => {
    render(<StatusLookup />);
    fireEvent.click(screen.getByRole("button", { name: t.checkStatus }));
    expect(boundary.push).not.toHaveBeenCalled();
    expect(screen.getByText(t.searchPlaceholder)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "1042" } });
    expect(screen.queryByText(t.searchPlaceholder)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: t.checkStatus }));
    expect(boundary.push).toHaveBeenCalledWith("/report/R-1042");
  });

  it.each([[" r-3 ", "/report/R-3"], ["abc/2", "/report/ABC%2F2"]])("normalizes and encodes %s", (input, path) => {
    render(<StatusLookup />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: input } });
    fireEvent.click(screen.getByRole("button", { name: t.checkStatus }));
    expect(boundary.push).toHaveBeenCalledWith(path);
  });

  it("sets polling and uses the decoded route reference", async () => {
    boundary.params.ref = "R%2F1";
    boundary.fetchReport.mockResolvedValue(report);
    render(<ReportStatus />);
    const options = boundary.queryOptions.mock.calls[0][0] as { enabled: boolean; queryKey: string[]; queryFn: () => Promise<unknown>; refetchInterval: number };
    expect(options).toMatchObject({ queryKey: ["public-report", "R/1"], enabled: true, refetchInterval: 15000 });
    expect(await options.queryFn()).toEqual(report);
    expect(boundary.fetchReport).toHaveBeenCalledWith("R/1");
  });

  it("disables lookup without a scalar reference and shows loading/errors", () => {
    boundary.params.ref = [];
    boundary.query.isPending = true;
    const { rerender } = render(<ReportStatus />);
    expect(boundary.queryOptions).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
    expect(screen.getByText(t.loading)).toBeTruthy();
    boundary.query.isPending = false; boundary.query.isError = true;
    rerender(<ReportStatus />);
    expect(screen.getByText(t.notFound)).toBeTruthy();
    expect(screen.getByRole("link", { name: t.submitAnother }).getAttribute("href")).toBe("/report");
  });

  it.each(["NEW", "NEEDS_LOCATION", "VALIDATED", "DISPATCHED", "CLOSED", "INVALID", "DUPLICATE", "UNKNOWN"])("renders report status %s", (status) => {
    boundary.query.data = { ...report, status };
    render(<ReportStatus />);
    expect(screen.getByRole("heading", { name: "R-1" })).toBeTruthy();
    const key = { NEW: "statusNew", NEEDS_LOCATION: "statusNeedsLocation", VALIDATED: "statusValidated", DISPATCHED: "statusDispatched", CLOSED: "statusClosed", INVALID: "statusInvalid", DUPLICATE: "statusDuplicate" }[status] as keyof typeof t | undefined;
    expect(screen.getByText(key ? t[key] : status)).toBeTruthy();
  });

  it.each([["North", "N2"], [null, "N2"], ["North", null]] as const)("shows optional location %s %s and evidence", (segmentName, landmarkCode) => {
    boundary.query.data = { ...report, segmentName, landmarkCode, description: "Elephant nearby", createdAt: "2026-10-09T08:00:00Z", outcome: "Resolved safely", photoPath: "evidence.jpg" };
    render(<ReportStatus />);
    expect(screen.getByText("Elephant nearby")).toBeTruthy();
    expect(screen.getByText("Resolved safely")).toBeTruthy();
    expect(screen.getByAltText("Evidence for R-1").getAttribute("src")).toMatch(/\/api\/v1\/public\/reports\/R-1\/photo$/);
    expect(screen.getByRole("link", { name: "Open original" }).getAttribute("href")).toMatch(/R-1\/photo$/);
  });

  it("ignores blank searches and navigates to normalized references", () => {
    render(<ReportStatus />);
    fireEvent.click(screen.getByRole("button", { name: t.checkStatus }));
    expect(boundary.push).not.toHaveBeenCalled();
    for (const [input, expected] of [["123", "R-123"], [" r-2 ", "R-2"], ["other/1", "OTHER%2F1"]]) {
      fireEvent.change(screen.getByRole("textbox"), { target: { value: input } });
      fireEvent.click(screen.getByRole("button", { name: t.checkStatus }));
      expect(boundary.push).toHaveBeenLastCalledWith(`/report/${expected}`);
    }
  });
});
