import type { ComponentProps } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardGuard, RangerGuard } from "@/components/auth/auth-guard";
import { Can } from "@/components/auth/can";
import { SignInForm } from "@/components/auth/sign-in-form";
import { ParkSwitcher } from "@/components/layout/park-switcher";
import { RangerNav } from "@/components/layout/ranger-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { ReportTabs } from "@/components/layout/report-tabs";
import { UserCard } from "@/components/layout/user-card";
import { LogoutButton } from "@/components/layout/logout-button";
import { useAuthStore } from "@/lib/auth/store";
import { useNavStore } from "@/lib/layout/store";

const boundary = vi.hoisted(() => ({ pathname: "/dashboard", router: { replace: vi.fn(), push: vi.fn() }, can: true, logout: vi.fn(), login: { mutate: vi.fn(), isError: false, isPending: false, error: null as Error | null }, parks: { current: { id: 1, name: "Yala", code: "YAL" }, parks: [{ id: 1, name: "Yala" }, { id: 2, name: "Udawalawe" }], switchTo: { mutate: vi.fn() } } }));
vi.mock("next/navigation", () => ({ usePathname: () => boundary.pathname, useRouter: () => boundary.router }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/hooks/use-can", () => ({ useCan: () => boundary.can }));
vi.mock("@/hooks/use-login", () => ({ useLogin: () => boundary.login }));
vi.mock("@/hooks/use-logout", () => ({ useLogout: () => boundary.logout }));
vi.mock("@/hooks/use-parks", () => ({ useParks: () => boundary.parks }));
vi.mock("@/hooks/use-open-alert-count", () => ({ useOpenAlertCount: () => 3 }));

const session = (role: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>["role"]) => useAuthStore.setState({ user: { id: 1, name: "Jane Doe", email: "jane@example.com", parkId: 1, role }, token: "token" });
beforeEach(() => {
  vi.clearAllMocks();
  boundary.pathname = "/dashboard";
  boundary.can = true;
  Object.assign(boundary.login, { isPending: false, isError: false, error: null });
  useAuthStore.setState({ user: null, token: null });
  useNavStore.setState({ expanded: {} });
});

describe("authorization boundaries", () => {
  it("redirects signed-out users to login", () => {
    render(<DashboardGuard>Private</DashboardGuard>);
    expect(boundary.router.replace).toHaveBeenCalledWith("/login");
  });
  it("allows managers and redirects rangers from dashboard", () => {
    session("MANAGER");
    const { rerender } = render(<DashboardGuard>Private</DashboardGuard>);
    expect(boundary.router.replace).not.toHaveBeenCalled();
    act(() => session("RANGER"));
    rerender(<DashboardGuard>Private</DashboardGuard>);
    expect(boundary.router.replace).toHaveBeenCalledWith("/ranger");
  });
  it("redirects restricted dashboard routes", () => {
    session("RESEARCHER");
    boundary.pathname = "/dashboard/users";
    render(<DashboardGuard>Private</DashboardGuard>);
    expect(boundary.router.replace).toHaveBeenCalled();
  });
  it("allows ranger routes and redirects managers", () => {
    session("RANGER");
    const { rerender } = render(<RangerGuard>Field</RangerGuard>);
    expect(boundary.router.replace).not.toHaveBeenCalled();
    act(() => session("MANAGER"));
    rerender(<RangerGuard>Field</RangerGuard>);
    expect(boundary.router.replace).toHaveBeenCalledWith("/dashboard");
  });
  it("renders only permitted content", () => {
    const { rerender } = render(<Can permission="settings.manage">Settings</Can>);
    expect(screen.getByText("Settings")).toBeTruthy();
    boundary.can = false;
    rerender(<Can permission="settings.manage">Settings</Can>);
    expect(screen.queryByText("Settings")).toBeNull();
  });
});

describe("sign in", () => {
  it("validates credentials and submits entered values", async () => {
    render(<SignInForm />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.getByLabelText(/Work email/).getAttribute("aria-invalid")).toBe("true"));
    expect(boundary.login.mutate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Work email/), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(boundary.login.mutate).toHaveBeenCalledWith({ email: "jane@example.com", password: "secret123" }));
  });
  it("displays failure and disables pending submissions", () => {
    boundary.login.isError = true;
    boundary.login.error = new Error("Network down");
    const { rerender } = render(<SignInForm />);
    expect(screen.getByRole("alert")).toBeTruthy();
    boundary.login.isPending = true;
    rerender(<SignInForm />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("navigation", () => {
  it("switches parks and ignores selecting the current park", () => {
    render(<ParkSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /Yala/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Yala" })[0]);
    expect(boundary.parks.switchTo.mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Yala/ }));
    fireEvent.click(screen.getByRole("button", { name: "Udawalawe" }));
    expect(boundary.parks.switchTo.mutate).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: /Yala/ }));
    fireEvent.click(screen.getByRole("link", { name: "Manage parks" }));
    expect(screen.queryByRole("link", { name: "Manage parks" })).toBeNull();
  });
  it("disables switching for restricted users", () => {
    boundary.can = false;
    render(<ParkSwitcher />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });
  it("expands user controls and logs out", () => {
    const { rerender } = render(<UserCard />);
    expect(screen.queryByRole("button")).toBeNull();
    act(() => session("MANAGER"));
    rerender(<UserCard />);
    fireEvent.click(screen.getByRole("button", { name: /Jane Doe/ }));
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(boundary.logout).toHaveBeenCalledOnce();
    rerender(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(boundary.logout).toHaveBeenCalledTimes(2);
  });
  it("marks active ranger and report links", () => {
    boundary.pathname = "/ranger/tasks";
    session("MANAGER");
    const { rerender } = render(<RangerNav />);
    expect(screen.getByRole("link", { name: "Tasks" }).getAttribute("aria-current")).toBe("page");
    boundary.pathname = "/dashboard/reports/alerts";
    rerender(<ReportTabs />);
    expect(screen.getByRole("link", { name: "Alerts" }).getAttribute("aria-current")).toBe("page");
  });
  it("renders sidebar groups and toggles nested navigation", () => {
    session("MANAGER");
    render(<SidebarNav />);
    const groups = screen.getAllByRole("button");
    for (const group of groups) {
      fireEvent.click(group);
      expect(group.getAttribute("aria-expanded")).toBe("true");
      fireEvent.click(group);
      expect(group.getAttribute("aria-expanded")).toBe("false");
    }
    expect(screen.getByText("3")).toBeTruthy();
  });
  it("composes the main sidebar", () => {
    session("MANAGER");
    render(<Sidebar />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
  });
});

