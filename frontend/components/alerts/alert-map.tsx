"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polygon } from "react-leaflet";
import { FitToData } from "@/components/map/fit-to-data";
import { useAlertsPage } from "@/lib/alerts/store";
import type { AlertsView } from "@/lib/alerts/types";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import type { LatLng } from "@/lib/patrols/types";
import { alertIcon } from "./alert-icons";
import { ALERT_TONE_STYLES } from "./alert-tones";

const ZONE_CLASS = "fill-negative-bg stroke-negative";
const ZONE_STYLE = { weight: 1.5, dashArray: "6 5", fillOpacity: 1 };
const SELECTED_MARKER_Z = 1000;

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full border-2 border-white shadow-[0_0_0_1px_var(--line-strong)] ${className}`} />
      {label}
    </span>
  );
}

function AlertMapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex max-w-[calc(100%-32px)] flex-wrap items-center gap-3.5 rounded-md border border-line bg-card px-3 py-2 text-caption text-ink-body">
      <LegendDot className={ALERT_TONE_STYLES.negative.fill} label="Open" />
      <LegendDot className={ALERT_TONE_STYLES.responding.fill} label="Acknowledged" />
      <LegendDot className={ALERT_TONE_STYLES.positive.fill} label="Resolved" />
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 border-[1.5px] border-dashed border-negative bg-negative-bg" />
        High-risk zone
      </span>
    </div>
  );
}

export default function AlertMap({ view }: { view: AlertsView }) {
  const selectedId = useAlertsPage((state) => state.selectedId);
  const toggle = useAlertsPage((state) => state.toggle);
  const points: LatLng[] = [
    ...view.zones.flatMap((zone) => zone.rings.flat()),
    ...view.rows.flatMap((row) => (row.position ? [row.position] : [])),
  ];

  return (
    <section aria-label="Alert map" className="relative h-[360px] overflow-hidden rounded-xl border border-line bg-map-ground">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <FitToData points={points} />
        {view.zones.map((zone) => (
          <Polygon key={zone.id} positions={zone.rings} className={ZONE_CLASS} pathOptions={ZONE_STYLE} />
        ))}
        {view.rows.map((row) => {
          if (!row.position) return null;
          const selected = row.id === selectedId;
          return (
            <Marker
              key={row.id}
              position={row.position}
              title={row.title}
              zIndexOffset={selected ? SELECTED_MARKER_Z : 0}
              icon={alertIcon(row.number, row.status.tone, selected)}
              eventHandlers={{ click: () => toggle(row.id) }}
            />
          );
        })}
      </MapContainer>
      <AlertMapLegend />
    </section>
  );
}
