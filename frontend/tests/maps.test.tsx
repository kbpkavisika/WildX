import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode, Ref } from "react";
import type { Map as LeafletMap } from "leaflet";
import { FitToData } from "@/components/map/fit-to-data";
import { FitToHighlight } from "@/components/map/fit-to-highlight";
import { ZoomControls } from "@/components/map/zoom-controls";
import LiveMap from "@/components/patrols/live-map";
import CoverageMap from "@/components/patrols/coverage-map";
import RouteDrawMap from "@/components/patrols/route-draw-map";
import RangerPatrolMap from "@/components/patrols/ranger-patrol-map";
import ReplayMap from "@/components/patrols/replay-map";
import LocationPicker from "@/components/incidents/location-picker";
import IncidentPointsMap from "@/components/incidents/incident-points-map";
import AlertMap from "@/components/alerts/alert-map";
import ZoneMap from "@/components/zones/zone-map";
import { teamIcon } from "@/components/patrols/map-icons";
import { alertIcon } from "@/components/alerts/alert-icons";
import { usePatrolSelection, useCoverageSelection } from "@/lib/patrols/store";
import { useAlertsPage } from "@/lib/alerts/store";
import { useZonesPage } from "@/lib/zones/store";
import { EMPTY_ALERTS } from "@/lib/alerts/mappers";
import type { LatLng, LivePatrolView, CoverageSectorView } from "@/lib/patrols/types";
import type { AlertRow } from "@/lib/alerts/types";
import type { ZoneRow } from "@/lib/zones/types";

const boundary = vi.hoisted(() => ({
  map: { fitBounds: vi.fn(), panTo: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn() },
  click: undefined as ((event: { latlng: { lat: number; lng: number } }) => void) | undefined,
}));

interface ShapeProps {
  children?: ReactNode;
  title?: string;
  positions?: unknown;
  position?: unknown;
  pathOptions?: { className?: string; weight?: number; opacity?: number };
  className?: string;
  eventHandlers?: { click: () => void };
  zIndexOffset?: number;
}

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, ref }: { children: ReactNode; ref?: Ref<unknown> }) => {
    if (typeof ref === "function") ref(boundary.map);
    else if (ref) ref.current = boundary.map;
    return <div data-testid="map">{children}</div>;
  },
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => <div data-testid="tiles" data-url={url} data-attribution={attribution} />,
  Polyline: ({ positions, pathOptions }: ShapeProps) => <div data-testid="line" data-points={JSON.stringify(positions)} data-weight={pathOptions?.weight} data-opacity={pathOptions?.opacity} />,
  Polygon: ({ children, positions, pathOptions, className, eventHandlers }: ShapeProps) => <button data-testid="polygon" className={className ?? pathOptions?.className} data-points={JSON.stringify(positions)} onClick={eventHandlers?.click}>{children}</button>,
  Marker: ({ children, position, title, eventHandlers, zIndexOffset }: ShapeProps) => <button data-testid="marker" title={title} data-position={JSON.stringify(position)} data-z={zIndexOffset} onClick={eventHandlers?.click}>{children}</button>,
  Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  useMap: () => boundary.map,
  useMapEvents: ({ click }: { click: typeof boundary.click }) => { boundary.click = click; return boundary.map; },
}));

const ring: LatLng[] = [[6, 81], [6, 82], [7, 82], [6, 81]];
const sector = { id: 1, name: "North", rings: [ring] };
const patrol: LivePatrolView = { id: 1, number: 1, colorIndex: 0, title: "Team One", caption: "North route", status: { tone: "positive", label: "On duty" }, offline: false, position: [6, 81], track: [[6, 81], [6.1, 81.1]] };
const coverage: CoverageSectorView = { ...sector, neglected: false, caption: "Visited today", status: { tone: "positive", label: "Patrolled" } };
const zone: ZoneRow = { ...sector, caption: "Road", rule: null };
const waypoint = { id: 1, position: [6, 81] as LatLng, label: "Checkpoint" };

beforeEach(() => {
  boundary.click = undefined;
  usePatrolSelection.setState({ selectedId: null });
  useCoverageSelection.setState({ selectedId: null });
  useAlertsPage.setState({ selectedId: null });
  useZonesPage.setState({ selectedId: null, draft: null });
});

describe("map behavior with Leaflet rendering mocked", () => {
  it("fits data only once after points become available", () => {
    const { rerender } = render(<FitToData points={[]} />);
    expect(boundary.map.fitBounds).not.toHaveBeenCalled();
    rerender(<FitToData points={ring} />);
    expect(boundary.map.fitBounds).toHaveBeenCalledWith(ring, { padding: [48, 48] });
    rerender(<FitToData points={[[8, 82]]} />);
    expect(boundary.map.fitBounds).toHaveBeenCalledOnce();
  });

  it("fits changed highlights and ignores clearing or equivalent rings", () => {
    const { rerender } = render(<FitToHighlight rings={null} />);
    expect(boundary.map.fitBounds).not.toHaveBeenCalled();
    rerender(<FitToHighlight rings={[ring]} />);
    expect(boundary.map.fitBounds).toHaveBeenCalledWith(ring, expect.any(Object));
    rerender(<FitToHighlight rings={[ring.map((point): LatLng => [...point])]} />);
    expect(boundary.map.fitBounds).toHaveBeenCalledOnce();
    rerender(<FitToHighlight rings={null} />);
    expect(boundary.map.fitBounds).toHaveBeenCalledOnce();
  });

  it("zooms through the map reference and tolerates a missing map", () => {
    const ref = { current: boundary.map as unknown as LeafletMap | null };
    render(<ZoomControls mapRef={ref} />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(boundary.map.zoomIn).toHaveBeenCalledOnce();
    expect(boundary.map.zoomOut).toHaveBeenCalledOnce();
    ref.current = null;
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(boundary.map.zoomIn).toHaveBeenCalledOnce();
  });

  it("draws patrol tracks, skips missing positions and selects teams from markers", () => {
    const view = { patrols: [patrol, { ...patrol, id: 2, position: null, offline: true }], sectors: [sector], incidents: [{ id: 3, position: [6, 81] as LatLng, label: "Snare" }], lastUpdate: null };
    const { rerender } = render(<LiveMap view={view} />);
    expect(screen.getByTestId("tiles").dataset.url).toContain("openstreetmap.org");
    expect(screen.getAllByTestId("line")).toHaveLength(2);
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
    fireEvent.click(screen.getByTitle("Team One"));
    expect(usePatrolSelection.getState().selectedId).toBe(1);
    expect(screen.getAllByTestId("line")[0].dataset.weight).toBe("5");
    expect(screen.getByTitle("Team One").dataset.z).toBe("1000");
    fireEvent.click(screen.getByTitle("Team One"));
    expect(usePatrolSelection.getState().selectedId).toBeNull();
    rerender(<LiveMap view={{ ...view, patrols: [] }} />);
    expect(screen.queryByTitle("Team One")).toBeNull();
  });

  it("shows coverage styles and selects sectors from rows and polygons", () => {
    const view = { sectors: [coverage, { ...coverage, id: 2, name: "South", neglected: true, status: { tone: "negative" as const, label: "Neglected" } }], neglectedCount: 1 };
    const { rerender } = render(<CoverageMap view={view} />);
    expect(screen.getAllByTestId("polygon")[0].className).toContain("stroke-primary");
    expect(screen.getAllByTestId("polygon")[1].className).toContain("stroke-negative");
    fireEvent.click(screen.getByRole("button", { name: /North.*Visited today.*Patrolled/ }));
    expect(useCoverageSelection.getState().selectedId).toBe(1);
    fireEvent.click(screen.getAllByTestId("polygon")[1]);
    expect(useCoverageSelection.getState().selectedId).toBe(2);
    fireEvent.click(screen.getAllByTestId("polygon")[1]);
    expect(useCoverageSelection.getState().selectedId).toBeNull();
    rerender(<CoverageMap view={{ sectors: [], neglectedCount: 0 }} />);
    expect(screen.getByText("No sectors in this park yet.")).toBeTruthy();
  });

  it("adds drawn route points in latitude/longitude order", () => {
    const add = vi.fn();
    const { rerender, container } = render(<RouteDrawMap points={ring.slice(0, 2)} sectors={[sector]} invalid onAdd={add} />);
    expect(container.firstElementChild?.className).toContain("border-negative");
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
    act(() => boundary.click?.({ latlng: { lat: 7, lng: 82 } }));
    expect(add).toHaveBeenCalledWith([7, 82]);
    rerender(<RouteDrawMap points={[]} sectors={[]} invalid={false} onAdd={add} />);
    expect(container.firstElementChild?.className).toContain("border-line");
  });

  it("shows ranger route, track, waypoints and optional current position", () => {
    const props = { route: ring, track: ring.slice(0, 2), waypoints: [waypoint], position: [6, 81] as LatLng, sectors: [sector] };
    const { rerender } = render(<RangerPatrolMap {...props} />);
    expect(screen.getByText("Checkpoint")).toBeTruthy();
    expect(screen.getByTitle("Your position").dataset.position).toBe("[6,81]");
    expect(screen.getAllByTestId("line")).toHaveLength(2);
    rerender(<RangerPatrolMap {...props} route={[]} position={null} />);
    expect(screen.queryByTitle("Your position")).toBeNull();
  });

  it("shows replay progress and optional team location", () => {
    const props = { track: ring, walked: ring.slice(0, 2), position: [6, 81] as LatLng, waypoints: [waypoint], sectors: [sector] };
    const { rerender } = render(<ReplayMap {...props} />);
    expect(screen.getByTitle("Team position")).toBeTruthy();
    expect(screen.getAllByTestId("line")[1].dataset.points).toBe(JSON.stringify(ring.slice(0, 2)));
    rerender(<ReplayMap {...props} position={null} />);
    expect(screen.queryByTitle("Team position")).toBeNull();
  });

  it("picks map locations, follows values and supports both marker types", () => {
    const pick = vi.fn();
    const { rerender, container } = render(<LocationPicker value={null} sectors={[sector]} onPick={pick} invalid />);
    expect(boundary.map.panTo).not.toHaveBeenCalled();
    act(() => boundary.click?.({ latlng: { lat: 6, lng: 81 } }));
    expect(pick).toHaveBeenCalledWith([6, 81]);
    rerender(<LocationPicker value={[6, 81]} sectors={[sector]} />);
    expect(screen.getByTitle("Incident location")).toBeTruthy();
    expect(boundary.map.panTo).toHaveBeenCalledWith([6, 81]);
    expect(container.firstElementChild?.className).toContain("border-line");
    rerender(<LocationPicker value={[7, 82]} sectors={[]} marker="waypoint" />);
    expect(screen.getByTitle("Waypoint location").dataset.position).toBe("[7,82]");
  });

  it("renders incident report points at mapped positions", () => {
    render(<IncidentPointsMap sectors={[sector]} points={[{ id: 1, position: [6, 81], label: "Snare" }]} />);
    expect(screen.getByTitle("Snare").dataset.position).toBe("[6,81]");
  });

  it("toggles alert markers and omits alerts without coordinates", () => {
    const row = { id: 1, number: 1, title: "Alert 1", position: [6, 81], status: { tone: "negative", label: "Open" } } as AlertRow;
    render(<AlertMap view={{ ...EMPTY_ALERTS, zones: [sector], rows: [row, { ...row, id: 2, position: null }] }} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(1);
    fireEvent.click(screen.getByTitle("Alert 1"));
    expect(useAlertsPage.getState().selectedId).toBe(1);
    expect(screen.getByTitle("Alert 1").dataset.z).toBe("1000");
    fireEvent.click(screen.getByTitle("Alert 1"));
    expect(useAlertsPage.getState().selectedId).toBeNull();
  });

  it("highlights selected zones and previews draft boundaries", () => {
    render(<ZoneMap rows={[zone]} />);
    expect(screen.getByTestId("polygon").className).toContain("stroke-negative");
    fireEvent.click(screen.getByTestId("polygon"));
    expect(useZonesPage.getState().selectedId).toBe(1);
    expect(screen.getByTestId("polygon").className).toContain("stroke-primary");
    act(() => useZonesPage.setState({ draft: [ring] }));
    expect(screen.getAllByTestId("polygon")).toHaveLength(2);
    fireEvent.click(screen.getAllByTestId("polygon")[0]);
    expect(useZonesPage.getState().selectedId).toBeNull();
  });

  it.each([false, true])("builds accessible team icons with selected=%s and offline variants", (selected) => {
    for (const offline of [false, true]) {
      const icon = teamIcon({ number: 3, colorIndex: 0, selected, offline });
      expect(icon.options.iconSize).toEqual([36, 36]);
      expect(icon.options.html).toContain(">3</span>");
      expect(String(icon.options.html).includes("border-dashed")).toBe(offline);
    }
    expect(alertIcon(2, "negative", selected).options.html).toContain(">2</span>");
  });
});
