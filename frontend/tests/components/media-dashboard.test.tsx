import { createElement } from "react";
import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImagePicture, ImageFrame } from "@/components/camera/image-picture";
import { ImageQueue } from "@/components/camera/image-queue";
import { ImageReview } from "@/components/camera/image-review";
import { RestrictedImage } from "@/components/camera/restricted-image";
import { NotificationsCard } from "@/components/notifications/notifications-card";
import { UnreadBadge } from "@/components/notifications/unread-badge";
import { IncidentFacts } from "@/components/incidents/incident-facts";
import { IncidentFilters } from "@/components/incidents/incident-filters";
import { ConflictChart } from "@/components/dashboard/conflict-chart";
import { ParkActivity } from "@/components/dashboard/park-activity";
import { PatrolSchedule } from "@/components/dashboard/patrol-schedule";
import { SimulationResult } from "@/components/simulator/simulation-result";
const state = vi.hoisted(() => ({ open: { data: undefined as string | undefined, isError: false, isPending: false, mutate: vi.fn() }, notifications: { isPending: false, isError: false, view: undefined as ReturnType<typeof import("@/hooks/use-notifications").useNotifications>["view"], markRead: { mutate: vi.fn() } }, push: vi.fn() }));
vi.mock("next/image", () => ({ default: ({ src, alt, className }: Pick<ComponentProps<"img">, "src" | "alt" | "className">) => createElement("img", { src, alt, className }) }));
vi.mock("@/hooks/use-restricted-image", () => ({ useRestrictedImage: () => state.open }));
vi.mock("@/hooks/use-notifications", () => ({ useNotifications: () => state.notifications }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }), usePathname: () => "/current" }));
beforeEach(() => { state.open.data = undefined; state.open.isError = false; state.open.isPending = false; state.open.mutate.mockClear(); state.notifications.view = undefined; state.notifications.isPending = false; state.notifications.isError = false; state.notifications.markRead.mutate.mockClear(); state.push.mockClear(); });
describe("camera review", () => {
 it("renders protected, loading and available pictures", () => {
  const { rerender } = render(<ImageFrame><ImagePicture alt="Camera" restricted src="/image.jpg" /></ImageFrame>); expect(screen.getByText("Restricted")).toBeTruthy(); expect(screen.queryByRole("img")).toBeNull();
  rerender(<ImagePicture alt="Camera" restricted src={undefined} large />); expect(screen.getByText("Restricted image")).toBeTruthy();
  rerender(<ImagePicture alt="Camera" restricted={false} src={undefined} />); expect(screen.getByText(/Loading/)).toBeTruthy(); rerender(<ImagePicture alt="Camera" restricted={false} src="/image.jpg" />); expect(screen.getByAltText("Camera").getAttribute("src")).toBe("/image.jpg");
 });
 it("selects camera tiles and renders burst information", () => {
  const { rerender } = render(<ImageQueue bursts={[]} pictures={new Map()} emptyLabel="No images" />); expect(screen.getByText("No images")).toBeTruthy();
  rerender(<ImageQueue bursts={[{ key: "1", title: "Morning burst", caption: "2 images", camera: "CAM-1", tiles: [{ id: 1, time: "08:00", restricted: false, status: { tone: "neutral", label: "Pending" } }, { id: 2, time: "08:01", restricted: true, status: { tone: "negative", label: "Restricted" } }] }] as unknown as ComponentProps<typeof ImageQueue>["bursts"]} pictures={new Map([[1, "/one.jpg"]])} emptyLabel="No images" />);
  const tile = screen.getByLabelText("CAM-1 at 08:00, Pending"); fireEvent.click(tile); expect(tile.getAttribute("aria-pressed")).toBe("true"); fireEvent.click(tile); expect(tile.getAttribute("aria-pressed")).toBe("false");
 });
 it("shows image detail and optional tagging controls", () => {
  const { rerender } = render(<ImageReview view={null} media={null} />); expect(screen.getByText("Select an image to review it.")).toBeTruthy();
  rerender(<ImageReview view={{ title: "Camera 1", status: { tone: "neutral", label: "Pending" }, facts: [{ label: "Taken", value: "Now" }] } as unknown as ComponentProps<typeof ImageReview>["view"]} media={<span>Photo</span>}><button>Tag</button></ImageReview>); expect(screen.getByText("Photo")).toBeTruthy(); expect(screen.getByText("Now")).toBeTruthy(); expect(screen.getByRole("button")).toBeTruthy();
 });
 it("requires an audit reason before opening a restricted image", async () => {
  const { rerender } = render(<RestrictedImage imageId={1} title="Evidence" />); fireEvent.submit(screen.getByRole("form")); await screen.findByText(/reason/i, { selector: "span.text-negative" });
  fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: "Case evidence review" } }); fireEvent.submit(screen.getByRole("form")); await waitFor(() => expect(state.open.mutate).toHaveBeenCalledWith("Case evidence review"));
  state.open.isError = true; state.open.isPending = true; rerender(<RestrictedImage imageId={1} title="Evidence" />); expect(screen.getByRole("alert")).toBeTruthy();
  state.open.data = "/evidence.jpg"; rerender(<RestrictedImage imageId={1} title="Evidence" />); expect(screen.getByAltText("Evidence")).toBeTruthy(); expect(screen.queryByRole("form")).toBeNull();
 });
});
describe("notifications and incident presentation", () => {
 it("shows loading, error and empty notification states, marks unread items and navigates only new destinations", () => {
  state.notifications.isPending = true; const { rerender } = render(<NotificationsCard />); expect(screen.getByText(/Loading notifications/)).toBeTruthy(); state.notifications.isPending = false; state.notifications.isError = true; rerender(<NotificationsCard />); expect(screen.getByText(/Could not load notifications/)).toBeTruthy();
  state.notifications.isError = false; state.notifications.view = { unreadCount: 0, rows: [] }; rerender(<NotificationsCard />); expect(screen.getByText("No notifications yet.")).toBeTruthy();
  state.notifications.view = { unreadCount: 1, rows: [{ id: 1, title: "New alert", body: "Breach", time: "Now", unread: true, link: "/alert" }, { id: 2, title: "Read", body: "Already read", time: "Yesterday", unread: false, link: "/current" }, { id: 3, title: "No destination", body: "Information", time: "Now", unread: false, link: null }] }; rerender(<NotificationsCard />);
  expect(screen.getByLabelText("1 unread")).toBeTruthy(); for (const button of screen.getAllByRole("button")) fireEvent.click(button); expect(state.notifications.markRead.mutate).toHaveBeenCalledExactlyOnceWith(1); expect(state.push).toHaveBeenCalledExactlyOnceWith("/alert");
 });
 it("hides zero unread badges and shows nonzero counts", () => { const { rerender } = render(<UnreadBadge count={0} />); expect(document.body.textContent).toBe(""); rerender(<UnreadBadge count={5} />); expect(screen.getByLabelText("5 unread")).toBeTruthy(); });
 it("renders incident photo absent, pending, error and success states", () => {
  const props = { facts: [{ label: "Sector", value: "North" }], hasPhoto: false, photoUrl: null, photoError: false }; const { rerender } = render(<IncidentFacts {...props} />); expect(screen.getByText("No photo attached.")).toBeTruthy(); rerender(<IncidentFacts {...props} hasPhoto />); expect(screen.getByText(/Loading photo/)).toBeTruthy(); rerender(<IncidentFacts {...props} hasPhoto photoError />); expect(screen.getByText("Could not load the photo.")).toBeTruthy(); rerender(<IncidentFacts {...props} hasPhoto photoUrl="/photo.jpg" />); expect(screen.getByAltText("Incident photo")).toBeTruthy();
 });
 it("maps selected incident types and severities to filter values", () => {
  const change = vi.fn(); render(<IncidentFilters filters={{ typeId: "all", severity: "all" } as unknown as ComponentProps<typeof IncidentFilters>["filters"]} types={[{ id: 1, name: "Snare" }] as unknown as ComponentProps<typeof IncidentFilters>["types"]} onChange={change} />); fireEvent.change(screen.getByLabelText("Type"), { target: { value: "1" } }); expect(change).toHaveBeenCalledWith({ typeId: 1 }); fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "HIGH" } }); expect(change).toHaveBeenCalledWith({ severity: "HIGH" });
 });
});
describe("dashboard summaries", () => {
 it("renders activity totals, seasonal chart trends and schedule kinds", () => {
  const chart = { total: 12, period: "This season", improving: true, changePct: 20, averagePct: 40, average: 4, bars: [{ label: "Jan", value: 4, heightPct: 50, highlighted: true }, { label: "Feb", value: 8, heightPct: 100, highlighted: false }] };
  const { rerender } = render(<><ParkActivity date="Today" metrics={[{ label: "Rangers", value: 3, total: 5, emphasis: true, chip: { tone: "positive", text: "Active" } }, { label: "Alerts", value: 2, chip: { tone: "negative", text: "New" } }] as unknown as ComponentProps<typeof ParkActivity>["metrics"]} /><ConflictChart chart={chart} /><PatrolSchedule today={new Date(2026, 9, 9)} groups={[{ label: "Morning", items: [{ id: 1, kind: "PATROL", title: "North patrol", meta: "08:00" }, { id: 2, kind: "MAINTENANCE", title: "Camera checks", meta: "10:00" }] }] as unknown as ComponentProps<typeof PatrolSchedule>["groups"]} /></>);
  expect(screen.getByText("12 incidents")).toBeTruthy(); expect(screen.getByText("North patrol")).toBeTruthy(); expect(document.querySelector('[aria-current="date"]')?.textContent).toBe("9"); fireEvent.click(screen.getByLabelText("Next week")); expect(document.querySelector('[aria-current="date"]')).toBeNull(); fireEvent.click(screen.getByLabelText("Previous week")); expect(document.querySelector('[aria-current="date"]')).toBeTruthy(); rerender(<ConflictChart chart={{ ...chart, improving: false }} />); expect(screen.getByText("20%")).toBeTruthy();
 });
 it("prioritizes simulator failures over stale success text", () => { const { rerender } = render(<SimulationResult result="Sent" error={null}><button>Send</button></SimulationResult>); expect(screen.getByRole("status").textContent).toBe("Sent"); rerender(<SimulationResult result="Sent" error="Offline"><button>Send</button></SimulationResult>); expect(screen.queryByRole("status")).toBeNull(); expect(screen.getByRole("alert").textContent).toBe("Offline"); });
});

