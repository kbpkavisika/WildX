import type { WaypointView } from "@/lib/patrols/types";

export function WaypointList({ waypoints }: { waypoints: WaypointView[] }) {
  if (waypoints.length === 0) return <p className="m-0 text-body text-ink-muted">No waypoints on this patrol.</p>;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {waypoints.map((waypoint) => (
        <li key={waypoint.id} className="border-b border-line-soft py-2.5 text-body text-ink last:border-b-0">
          {waypoint.label}
        </li>
      ))}
    </ul>
  );
}
