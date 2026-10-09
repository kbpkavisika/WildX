import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import ConflictReportsPage from "@/app/dashboard/reports/conflicts/page";
import BoundarySegmentsPage from "@/app/dashboard/settings/boundary-segments/page";
import * as community from "@/lib/api/community";
import * as boundaries from "@/lib/api/boundary-segments";
import { downloadBlob } from "@/lib/files";
import { useAuthStore } from "@/lib/auth/store";
import { ApiError } from "@/lib/api/client";
import { ROLES } from "@/lib/enums";
import { toIsoDate } from "@/lib/format";

vi.mock("@/lib/api/community", () => ({ fetchConflictTrends: vi.fn(), fetchConflictTrendsCsv: vi.fn() }));
vi.mock("@/lib/api/boundary-segments", () => ({ fetchSegments: vi.fn(), createSegment: vi.fn(), updateSegment: vi.fn(), deleteSegment: vi.fn() }));
vi.mock("@/lib/files", () => ({ downloadBlob: vi.fn() }));

const clients: QueryClient[] = [];
const segment = { id: 1, parkId: 4, name: "East farmland", code: "EAST", centerLat: 6.47, centerLng: 80.89 };
const user = { id: 1, name: "Alice", email: "alice@example.com", role: ROLES.MANAGER, parkId: 4 };
function show(page: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return { ...render(<QueryClientProvider client={client}>{page}</QueryClientProvider>), client };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function enter(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function submit() {
  fireEvent.submit(screen.getByLabelText("Segment name").closest("form")!);
}

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ user, token: "token" });
  vi.mocked(community.fetchConflictTrends).mockResolvedValue([]);
  vi.mocked(community.fetchConflictTrendsCsv).mockResolvedValue(new Blob(["csv"]));
  vi.mocked(boundaries.fetchSegments).mockResolvedValue([segment]);
  vi.mocked(boundaries.createSegment).mockResolvedValue(segment);
  vi.mocked(boundaries.updateSegment).mockResolvedValue(segment);
  vi.mocked(boundaries.deleteSegment).mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) client.clear();
  useAuthStore.setState(useAuthStore.getInitialState(), true);
});

describe("conflict trend report", () => {
  it("loads the default six month range and aggregates repeated months and segments", async () => {
    const pending = deferred<community.ConflictTrend[]>();
    vi.mocked(community.fetchConflictTrends).mockReturnValue(pending.promise);
    const { container } = show(<ConflictReportsPage />);
    expect(screen.getByText(/Loading conflict report/)).toBeTruthy();
    const today = new Date();
    const from = toIsoDate(new Date(today.getFullYear(), today.getMonth() - 5, 1));
    expect(community.fetchConflictTrends).toHaveBeenCalledWith(from, toIsoDate(today));
    await act(async () => pending.resolve([
      { month: "2026-09", segmentId: 1, segmentCode: "EAST", segmentName: "East", conflictCount: 2 },
      { month: "2026-09", segmentId: 2, segmentCode: "WEST", segmentName: "West", conflictCount: 3 },
      { month: "2026-10", segmentId: 1, segmentCode: "EAST", segmentName: "East", conflictCount: 1 },
    ]));
    expect(await screen.findByText("6 conflict events")).toBeTruthy();
    expect(screen.getByText("5 conflicts")).toBeTruthy();
    const east = screen.getByText("East").closest("tr")!;
    expect(within(east).getByText("3")).toBeTruthy();
    expect(container.querySelector('[style="width: 100%;"]')).toBeTruthy();
    expect(container.querySelector('[style="width: 20%;"]')).toBeTruthy();
  });
  it("shows empty results and reloads valid changes while disabling reversed ranges", async () => {
    show(<ConflictReportsPage />);
    expect(await screen.findByText("No conflict data for this range.")).toBeTruthy();
    expect(screen.getByText("No conflicts recorded in this date range.")).toBeTruthy();
    enter("From", "2026-01-01");
    enter("To", "2026-02-01");
    await waitFor(() => expect(community.fetchConflictTrends).toHaveBeenCalledWith("2026-01-01", "2026-02-01"));
    enter("From", "2026-03-01");
    expect(screen.getByText("The start date must be before the end date.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Download CSV" }) as HTMLButtonElement).disabled).toBe(true);
    expect(community.fetchConflictTrends).not.toHaveBeenCalledWith("2026-03-01", "2026-02-01");
    enter("From", "");
    expect(community.fetchConflictTrends).not.toHaveBeenCalledWith("", "2026-02-01");
  });
  it("downloads the selected range with a descriptive filename and pending state", async () => {
    const pending = deferred<Blob>();
    vi.mocked(community.fetchConflictTrendsCsv).mockReturnValue(pending.promise);
    show(<ConflictReportsPage />);
    await screen.findByText("No conflict data for this range.");
    enter("From", "2026-01-01");
    enter("To", "2026-02-01");
    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));
    const button = await screen.findByRole("button", { name: /Preparing CSV/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    const blob = new Blob(["csv"]);
    await act(async () => pending.resolve(blob));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, "conflicts-2026-01-01-2026-02-01.csv"));
    expect(community.fetchConflictTrendsCsv).toHaveBeenCalledWith("2026-01-01", "2026-02-01");
  });
  it("renders query and download failure messages", async () => {
    vi.mocked(community.fetchConflictTrends).mockRejectedValue(new Error("load"));
    vi.mocked(community.fetchConflictTrendsCsv).mockRejectedValue(new ApiError(500, "CSV unavailable"));
    show(<ConflictReportsPage />);
    expect(await screen.findByText("Could not load the conflict report.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));
    expect(await screen.findByText("CSV unavailable")).toBeTruthy();
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});

describe("boundary segments settings", () => {
  it("loads coordinates, then creates trimmed fields and refreshes the list", async () => {
    const pending = deferred<boundaries.BoundarySegment[]>();
    vi.mocked(boundaries.fetchSegments).mockReturnValueOnce(pending.promise);
    const { client } = show(<BoundarySegmentsPage />);
    expect(screen.getByText(/Loading boundary segments/)).toBeTruthy();
    await act(async () => pending.resolve([segment]));
    expect(await screen.findByText("6.4700, 80.8900")).toBeTruthy();
    expect(boundaries.fetchSegments).toHaveBeenCalledWith(4);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    fireEvent.click(screen.getByRole("button", { name: "New segment" }));
    expect((screen.getByLabelText("Centre latitude") as HTMLInputElement).value).toBe("6.47");
    expect((screen.getByLabelText("Centre longitude") as HTMLInputElement).value).toBe("80.89");
    enter("Segment name", " New farmland ");
    enter("SMS landmark code (short)", " nf ");
    enter("Centre latitude", "7.1");
    enter("Centre longitude", "81.2");
    submit();
    await waitFor(() => expect(boundaries.createSegment).toHaveBeenCalledWith(4, { name: "New farmland", code: "NF", centerLat: 7.1, centerLng: 81.2 }));
    await waitFor(() => expect(screen.queryByText("New boundary segment")).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["boundary-segments", 4] });
    expect(boundaries.updateSegment).not.toHaveBeenCalled();
  });
  it("prefills edits and sends the existing segment ID", async () => {
    const pending = deferred<boundaries.BoundarySegment>();
    vi.mocked(boundaries.updateSegment).mockReturnValue(pending.promise);
    show(<BoundarySegmentsPage />);
    await screen.findByText(segment.name);
    fireEvent.click(screen.getByTitle("Edit segment"));
    expect(screen.getByText("Edit East farmland")).toBeTruthy();
    expect((screen.getByLabelText("Segment name") as HTMLInputElement).value).toBe(segment.name);
    expect((screen.getByLabelText("SMS landmark code (short)") as HTMLInputElement).value).toBe(segment.code);
    enter("Segment name", "Updated");
    submit();
    expect((await screen.findByRole("button", { name: /Saving/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(boundaries.updateSegment).toHaveBeenCalledWith(4, 1, { name: "Updated", code: "EAST", centerLat: 6.47, centerLng: 80.89 });
    await act(async () => pending.resolve({ ...segment, name: "Updated" }));
    await waitFor(() => expect(screen.queryByText("Edit East farmland")).toBeNull());
  });
  it("rejects empty or invalid fields and clears the form on cancellation", async () => {
    show(<BoundarySegmentsPage />);
    await screen.findByText(segment.name);
    fireEvent.click(screen.getByRole("button", { name: "New segment" }));
    submit();
    expect(screen.getByText("Please fill in all fields with valid coordinates.")).toBeTruthy();
    enter("Segment name", "East");
    submit();
    enter("SMS landmark code (short)", "east");
    enter("Centre latitude", "");
    submit();
    enter("Centre latitude", "6");
    enter("Centre longitude", "");
    submit();
    expect(boundaries.createSegment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Segment name")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New segment" }));
    expect((screen.getByLabelText("Segment name") as HTMLInputElement).value).toBe("");
    expect(screen.queryByText("Please fill in all fields with valid coordinates.")).toBeNull();
    fireEvent.click(screen.getByRole("region", { name: "Boundary segment form" }).querySelector("button")!);
    expect(screen.queryByLabelText("Segment name")).toBeNull();
  });
  it("confirms deletion, supports cancellation and refreshes after success", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const pending = deferred<void>();
    vi.mocked(boundaries.deleteSegment).mockReturnValue(pending.promise);
    const { client } = show(<BoundarySegmentsPage />);
    await screen.findByText(segment.name);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    fireEvent.click(screen.getByTitle("Delete segment"));
    expect(confirm).toHaveBeenCalledWith("Delete boundary segment East farmland (EAST)?");
    expect(boundaries.deleteSegment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Delete segment"));
    await waitFor(() => expect(boundaries.deleteSegment).toHaveBeenCalledWith(4, 1));
    expect((screen.getByTitle("Delete segment") as HTMLButtonElement).disabled).toBe(true);
    await act(async () => pending.resolve());
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["boundary-segments", 4] }));
  });
  it("renders failed loads, saves and deletes without closing failed edits", async () => {
    vi.mocked(boundaries.fetchSegments).mockRejectedValueOnce(new Error("load"));
    const first = show(<BoundarySegmentsPage />);
    expect(await screen.findByText("Could not load boundary segments.")).toBeTruthy();
    first.unmount();
    vi.mocked(boundaries.createSegment).mockRejectedValue(new ApiError(409, "Code already exists"));
    vi.mocked(boundaries.deleteSegment).mockRejectedValue(new ApiError(409, "Segment is in use"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    show(<BoundarySegmentsPage />);
    await screen.findByText(segment.name);
    fireEvent.click(screen.getByRole("button", { name: "New segment" }));
    enter("Segment name", "East");
    enter("SMS landmark code (short)", "east");
    submit();
    expect(await screen.findByText("Code already exists")).toBeTruthy();
    expect(screen.getByText("New boundary segment")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByTitle("Delete segment"));
    expect(await screen.findByText("Segment is in use")).toBeTruthy();
  });
  it("shows empty parks and hides management actions for readers", async () => {
    vi.mocked(boundaries.fetchSegments).mockResolvedValueOnce([]);
    useAuthStore.setState({ user: { ...user, role: ROLES.RESEARCHER } });
    const first = show(<BoundarySegmentsPage />);
    expect(await screen.findByText("No boundary segments defined for this park yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "New segment" })).toBeNull();
    first.unmount();
    show(<BoundarySegmentsPage />);
    await screen.findByText(segment.name);
    expect(screen.queryByTitle("Edit segment")).toBeNull();
    expect(screen.queryByTitle("Delete segment")).toBeNull();
  });
  it("does not request park data when the session has no park", () => {
    useAuthStore.setState({ user: null });
    show(<BoundarySegmentsPage />);
    expect(boundaries.fetchSegments).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "New segment" })).toBeNull();
  });
});
