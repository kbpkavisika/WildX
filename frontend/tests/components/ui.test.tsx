import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, SecondaryButton, QuietButton, IconButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { Field, fieldClass } from "@/components/ui/field";
import { FilterPill } from "@/components/ui/filter-pill";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { LiveChip } from "@/components/ui/live-chip";
import { MetricRow } from "@/components/ui/metric-row";
import { Modal } from "@/components/ui/modal";
import { MoreButton } from "@/components/ui/more-button";
import { StatusDot } from "@/components/ui/status-dot";
import { ChoiceRow } from "@/components/forms/choice-row";
import { FormPanel } from "@/components/devices/form-panel";
import { SecondaryLink } from "@/components/devices/secondary-link";
import { PageHeader } from "@/components/layout/page-header";
import { Logo } from "@/components/layout/logo";
import { Topbar } from "@/components/layout/topbar";
import { NoGpsBanner } from "@/components/patrols/no-gps-banner";
import { MapLegend } from "@/components/patrols/map-legend";
import { PatrolBadge } from "@/components/patrols/patrol-badge";
import { WaypointList } from "@/components/patrols/waypoint-list";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
const language = vi.hoisted(() => ({ language: "en", setLanguage: vi.fn() }));
vi.mock("@/lib/i18n", async (original) => ({ ...await original<typeof import("@/lib/i18n")>(), useT: () => language }));
const notifications = vi.hoisted(() => ({ view: undefined as { unreadCount: number } | undefined }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("@/hooks/use-notifications", () => ({ useNotifications: () => notifications }));
vi.mock("@/components/notifications/notifications-card", () => ({ NotificationsCard: () => <section aria-label="Notifications list" /> }));

describe("shared controls", () => {
  it.each([Button, SecondaryButton, QuietButton, IconButton])("forwards button state and events", (Control) => {
    const click = vi.fn();
    const { rerender } = render(<Control aria-label="Action" onClick={click} className="custom">Go</Control>);
    const button = screen.getByRole("button", { name: "Action" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.className).toContain("custom");
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
    rerender(<Control aria-label="Action" disabled onClick={click}>Go</Control>);
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
  });
  it("renders semantic cards, facts, metrics, badges and statuses", () => {
    render(<><Card label="Overview"><CardTitle>Summary</CardTitle></Card><FactList facts={[{ label: "Sector", value: "North" }]} /><MetricRow metrics={[{ label: "Rangers", value: "12" }]} /><InitialsAvatar initials="JD" /><LiveChip />{(["positive", "negative", "neutral", "done"] as const).map(tone => <Chip key={tone} tone={tone}>{tone}</Chip>)}{(["positive", "responding", "negative"] as const).map(tone => <StatusDot key={tone} tone={tone}>{tone} state</StatusDot>)}</>);
    expect(screen.getByRole("region", { name: "Overview" })).toBeTruthy();
    for (const text of ["Summary", "Sector", "North", "Rangers", "12", "JD", "Live", "done", "responding state"]) expect(screen.getByText(text)).toBeTruthy();
  });
  it("connects fields to inputs and displays validation", () => {
    const { rerender } = render(<Field label="Name"><input /></Field>);
    expect(screen.getByLabelText("Name")).toBeTruthy();
    rerender(<Field label="Name" error="Required"><input /></Field>);
    expect(screen.getByText("Required")).toBeTruthy();
    expect(fieldClass(true)).toContain("border-negative");
    expect(fieldClass(false)).toContain("border-line-strong");
  });
  it("exposes filter selection and triggers updates", () => {
    const click = vi.fn();
    const { rerender } = render(<FilterPill label="All" count={4} pressed={false} onClick={click} />);
    fireEvent.click(screen.getByRole("button"));
    expect(click).toHaveBeenCalledOnce();
    rerender(<FilterPill label="All" count={4} pressed onClick={click} />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
  });
  it("switches language using both sizes", () => {
    const { rerender } = render(<LanguageSwitcher />);
    expect(screen.getByRole("group", { name: "Language selection" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(language.setLanguage).toHaveBeenCalled();
    rerender(<LanguageSwitcher compact className="compact" />);
    expect(screen.getByRole("group").className).toContain("compact");
  });
  it("renders links or disabled overflow controls", () => {
    const { rerender } = render(<MoreButton label="View" href="/detail" />);
    expect(screen.getByRole("link", { name: "View" }).getAttribute("href")).toBe("/detail");
    rerender(<MoreButton label="View" disabled />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });
  it("opens dialogs, cancels and restores focus to the opener", () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const close = vi.fn();
    const { rerender, unmount } = render(<Modal title="Editor" onClose={close}>Content</Modal>);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
    expect(close).toHaveBeenCalledTimes(2);
    rerender(<Modal title="Editor" wide onClose={close}>Content</Modal>);
    expect(screen.getByRole("dialog").className).toContain("640px");
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
  it("renders choices with and without captions", () => {
    render(<><ChoiceRow label="First" caption="Nearest" name="ranger" value="1" /><ChoiceRow label="Second" name="ranger" value="2" /></>);
    fireEvent.click(screen.getByLabelText("Second"));
    expect((screen.getByLabelText("Second") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("Nearest")).toBeTruthy();
  });
  it("renders header slots and dismisses panels", () => {
    const close = vi.fn();
    render(<><PageHeader title="Devices" subtitle="Online" badge={<span>3</span>} action={<button>Add</button>} /><FormPanel title="Create" onClose={close}>Form</FormPanel><SecondaryLink href="/simulator">Simulator</SecondaryLink><Logo /><Topbar /></>);
    expect(screen.getByRole("heading", { name: "Devices" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Simulator" }).getAttribute("href")).toBe("/simulator");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Elephant" } });
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Elephant");
  });
  it("toggles the notifications dropdown and shows the unread dot", () => {
    notifications.view = { unreadCount: 2 };
    const { container } = render(<Topbar />);
    const bell = screen.getByRole("button", { name: "Notifications" });
    expect(container.querySelector(".bg-coral")).toBeTruthy();
    fireEvent.click(bell);
    expect(screen.getByRole("region", { name: "Notifications list" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Notifications list" })).toBeNull();
    fireEvent.click(bell);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("region", { name: "Notifications list" })).toBeNull();
    fireEvent.click(bell);
    fireEvent.click(bell);
    expect(screen.queryByRole("region", { name: "Notifications list" })).toBeNull();
    notifications.view = { unreadCount: 0 };
  });
  it("explains map states and waypoint empty/data states", () => {
    const { rerender } = render(<><NoGpsBanner /><MapLegend /><PatrolBadge number={2} colorIndex={0} /><WaypointList waypoints={[]} /></>);
    expect(screen.getByRole("status").textContent).toContain("still running");
    expect(screen.getByText("No waypoints on this patrol.")).toBeTruthy();
    rerender(<WaypointList waypoints={[{ id: 1, label: "Checkpoint A" } as unknown as ComponentProps<typeof WaypointList>["waypoints"][number]]} />);
    expect(screen.getByRole("listitem").textContent).toBe("Checkpoint A");
  });
});
