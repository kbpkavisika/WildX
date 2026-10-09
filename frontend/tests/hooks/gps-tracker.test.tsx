import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { GPS_INTERVAL_S, GPS_TIMEOUT_MS } from "@/lib/constants";
import { useGpsFix } from "@/hooks/use-gps-fix";
import { usePatrolTracker } from "@/hooks/use-patrol-tracker";

const { state, recordPoints, reportGps, setFix, setGpsLost } = vi.hoisted(() => ({
  state: { patrols: [{ id: 4, status: "ACTIVE" }] as { id: number; status: string }[] | undefined },
  recordPoints: vi.fn(), reportGps: vi.fn(), setFix: vi.fn(), setGpsLost: vi.fn(),
}));
vi.mock("@/hooks/use-my-patrols", () => ({ useMyPatrols: () => ({ data: state.patrols }) }));
vi.mock("@/lib/api/patrols", () => ({ recordPoints, reportGps }));
vi.mock("@/lib/patrols/store", () => ({ useTracker: { getState: () => ({ setFix, setGpsLost }) } }));

let success: PositionCallback;
let failure: PositionErrorCallback;
let client: QueryClient;
const geolocation = { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() };
const fix = (latitude = 7, timestamp = Date.now()) => ({ coords: { latitude, longitude: 80, accuracy: 5 }, timestamp }) as GeolocationPosition;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const error = () => failure({ code: 1 } as GeolocationPositionError);

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  state.patrols = [{ id: 4, status: "ACTIVE" }];
  recordPoints.mockResolvedValue([]);
  reportGps.mockResolvedValue(undefined);
  geolocation.watchPosition.mockImplementation((onSuccess, onError) => { success = onSuccess; failure = onError; return 8; });
  geolocation.getCurrentPosition.mockImplementation((onSuccess, onError) => { success = onSuccess; failure = onError; });
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: geolocation });
  client = new QueryClient();
});
afterEach(() => { cleanup(); client.clear(); vi.useRealTimers(); });

describe("GPS fix", () => {
  it("requests a fix, retries failures, and delivers to the latest callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const hook = renderHook(({ onFix }) => useGpsFix(onFix), { initialProps: { onFix: first } });
    expect(hook.result.current.status).toBe("locating");
    expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS });
    act(error);
    expect(hook.result.current.status).toBe("failed");
    act(() => hook.result.current.retry());
    expect(hook.result.current.status).toBe("locating");
    hook.rerender({ onFix: second });
    act(() => success(fix()));
    expect(hook.result.current.status).toBe("found");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith([7, 80]);
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
  });
});

describe("Patrol tracking lifecycle", () => {
  it.each([undefined, [], [{ id: 1, status: "PLANNED" }]])("does not watch without an active patrol: %s", (patrols) => {
    state.patrols = patrols;
    renderHook(usePatrolTracker, { wrapper });
    expect(geolocation.watchPosition).not.toHaveBeenCalled();
  });

  it("does not watch when geolocation is unavailable", () => {
    Reflect.deleteProperty(navigator, "geolocation");
    renderHook(usePatrolTracker, { wrapper });
    expect(geolocation.watchPosition).not.toHaveBeenCalled();
  });

  it("records fixes, suppresses duplicate samples, reports loss transitions, polls, and cleans up", async () => {
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const hook = renderHook(usePatrolTracker, { wrapper });
    await act(async () => success(fix()));
    expect(recordPoints).toHaveBeenCalledWith(4, [{ lat: 7, lng: 80, accuracyM: 5, recordedAt: new Date(Date.now()).toISOString() }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["patrols", 4, "track"] });
    await act(async () => success(fix()));
    expect(recordPoints).toHaveBeenCalledTimes(1);
    act(() => { error(); error(); });
    expect(reportGps).toHaveBeenCalledTimes(1);
    expect(reportGps).toHaveBeenCalledWith(4, false);
    await act(async () => success(fix(8)));
    expect(reportGps).toHaveBeenCalledWith(4, true);
    act(() => vi.advanceTimersByTime(GPS_INTERVAL_S * 1000));
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(geolocation.clearWatch).toHaveBeenCalledWith(8);
    expect(setFix).toHaveBeenLastCalledWith(null);
    expect(setGpsLost).toHaveBeenLastCalledWith(false);
    act(() => vi.advanceTimersByTime(GPS_INTERVAL_S * 1000));
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it.each([new Error("offline"), new ApiError(503)])("retains failed batches for retry: %s", async (reason) => {
    recordPoints.mockRejectedValueOnce(reason);
    const hook = renderHook(usePatrolTracker, { wrapper });
    await act(async () => success(fix()));
    await act(async () => success(fix(8)));
    expect(recordPoints.mock.calls[1][1]).toHaveLength(2);
    hook.unmount();
  });

  it("drops a rejected batch and sends later fixes", async () => {
    recordPoints.mockRejectedValueOnce(new ApiError(400));
    renderHook(usePatrolTracker, { wrapper });
    await act(async () => success(fix()));
    await act(async () => success(fix(8)));
    expect(recordPoints.mock.calls[1][1]).toHaveLength(1);
    expect(recordPoints.mock.calls[1][1][0].lat).toBe(8);
  });

  it("queues fixes during an in-flight request and flushes the remainder on unmount", async () => {
    let resolve!: () => void;
    recordPoints.mockImplementationOnce(() => new Promise<void>((done) => { resolve = done; }));
    const hook = renderHook(usePatrolTracker, { wrapper });
    await act(async () => { success(fix()); success(fix(8)); });
    expect(recordPoints).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    await act(async () => hook.unmount());
    expect(recordPoints).toHaveBeenCalledTimes(2);
    expect(recordPoints.mock.calls[1][1]).toHaveLength(1);
    expect(recordPoints.mock.calls[1][1][0].lat).toBe(8);
  });

  it("swallows GPS reporting errors and clears the previous patrol when it changes", async () => {
    reportGps.mockRejectedValue(new Error("offline"));
    const hook = renderHook(usePatrolTracker, { wrapper });
    await act(async () => error());
    state.patrols = [{ id: 9, status: "ACTIVE" }];
    hook.rerender();
    expect(geolocation.clearWatch).toHaveBeenCalledWith(8);
    await act(async () => success(fix()));
    expect(recordPoints).toHaveBeenCalledWith(9, expect.any(Array));
  });
});
