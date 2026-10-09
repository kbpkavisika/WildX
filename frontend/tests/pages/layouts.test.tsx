import { createElement, type ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { Providers } from "@/app/providers";
import Home from "@/app/page";
import ReportsPage from "@/app/dashboard/reports/page";
import DashboardLayout from "@/app/dashboard/layout";
import RangerLayout from "@/app/ranger/layout";
import ReportsLayout from "@/app/dashboard/reports/layout";
import RootLayout, { metadata } from "@/app/layout";

const { redirect, router, auth } = vi.hoisted(() => ({ redirect: vi.fn(), router: { replace: vi.fn() }, auth: { user: { role: "MANAGER" } as { role: string } | null } }));
vi.mock("next/navigation", () => ({ redirect, useRouter: () => router }));
vi.mock("next/font/google", () => ({ Geist: () => ({ variable: "geist-font" }) }));
vi.mock("@/lib/auth/store", () => ({ useAuthStore: (select: (state: typeof auth) => unknown) => select(auth) }));
vi.mock("@/components/auth/auth-guard", () => ({ DashboardGuard: ({ children }: { children: ReactNode }) => <section data-testid="dashboard-guard">{children}</section>, RangerGuard: ({ children }: { children: ReactNode }) => <section data-testid="ranger-guard">{children}</section> }));
vi.mock("@/components/layout/sidebar", () => ({ Sidebar: () => <nav>Sidebar</nav> }));
vi.mock("@/components/layout/topbar", () => ({ Topbar: () => <header>Topbar</header> }));
vi.mock("@/components/layout/logo", () => ({ Logo: () => <span>WildX logo</span> }));
vi.mock("@/components/layout/logout-button", () => ({ LogoutButton: () => <button>Logout</button> }));
vi.mock("@/components/layout/ranger-nav", () => ({ RangerNav: () => <nav>Ranger navigation</nav> }));
vi.mock("@/components/patrols/patrol-tracker", () => ({ PatrolTracker: () => <aside>Tracker</aside> }));
vi.mock("@/components/layout/report-tabs", () => ({ ReportTabs: () => <nav>Report tabs</nav> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); auth.user = { role: "MANAGER" }; });

describe("Application layouts and routing", () => {
  it("redirects home to the dashboard", () => { Home(); expect(redirect).toHaveBeenCalledWith("/dashboard"); });
  it("opens the first report permitted for a manager", () => { render(<ReportsPage />); expect(router.replace).toHaveBeenCalledWith("/dashboard/reports/incidents"); });
  it("does not redirect an account with no report permissions", () => { auth.user = null; render(<ReportsPage />); expect(router.replace).not.toHaveBeenCalled(); });
  it("wraps dashboard content in its auth guard and navigation", () => { render(<DashboardLayout params={Promise.resolve({})}>Dashboard content</DashboardLayout>); expect(screen.getByTestId("dashboard-guard").textContent).toContain("Dashboard content"); expect(screen.getByRole("main").textContent).toBe("Dashboard content"); expect(screen.getByText("Sidebar")).toBeDefined(); expect(screen.getByText("Topbar")).toBeDefined(); });
  it("includes tracking, account controls and ranger navigation", () => { render(<RangerLayout params={Promise.resolve({})}>Ranger content</RangerLayout>); expect(screen.getByTestId("ranger-guard").textContent).toContain("Ranger content"); expect(screen.getByText("Tracker")).toBeDefined(); expect(screen.getByRole("button", { name: "Logout" })).toBeDefined(); expect(screen.getByText("Ranger navigation")).toBeDefined(); });
  it("renders report navigation alongside its child report", () => { render(<ReportsLayout params={Promise.resolve({})}>Report content</ReportsLayout>); expect(screen.getByText("Report tabs")).toBeDefined(); expect(screen.getByText("Report content")).toBeDefined(); });
  it("preserves one query client across provider rerenders", () => {
    const clients: QueryClient[] = [];
    function Capture() { clients.push(useQueryClient()); return <span>Provided content</span>; }
    const rendered = render(<Providers><Capture /></Providers>);
    rendered.rerender(<Providers><Capture /></Providers>);
    expect(clients[0]).toBeInstanceOf(QueryClient);
    expect(clients[1]).toBe(clients[0]);
  });
  it("sets document language, application title and provider content", () => {
    const layout = RootLayout({ children: createElement("span", null, "Root content"), params: Promise.resolve({}) });
    expect(metadata.title).toBe("WildX");
    expect(layout.type).toBe("html");
    expect(layout.props.lang).toBe("en");
    expect(layout.props.className).toContain("geist-font");
    expect(layout.props.children.props.children.type).toBe(Providers);
  });
});
