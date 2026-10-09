import type { PatrolHistoryResponse, PatrolResponse, TrackPointResponse } from "@/lib/api/patrols";
import { formatDate, formatDuration, formatKm, formatTime, fromIsoDate } from "@/lib/format";
import { toTrack, toWaypoints } from "./mappers";
import { timeRange } from "./table-mappers";
import type { ReplayView } from "./types";

const NO_VALUE = "—";

export function toReplayView(
  patrol: PatrolResponse,
  history: PatrolHistoryResponse | undefined,
  points: TrackPointResponse[],
  scrubIndex: number | null,
): ReplayView {
  const track = toTrack(points);
  const maxIndex = Math.max(0, track.length - 1);
  const index = scrubIndex === null ? maxIndex : Math.min(scrubIndex, maxIndex);
  const timeAt = (i: number) => (points[i] ? formatTime(new Date(points[i].recordedAt)) : NO_VALUE);
  return {
    title: patrol.route.name,
    subtitle: `PT-${patrol.id} · ${patrol.rangerName} · ${formatDate(fromIsoDate(patrol.scheduledDate))}`,
    metrics: [
      { label: "Distance", value: history ? formatKm(history.distanceM) : NO_VALUE },
      { label: "Duration", value: history ? formatDuration(history.durationSeconds) : NO_VALUE },
      { label: "Time", value: timeRange(patrol) ?? NO_VALUE },
    ],
    track,
    walked: track.slice(0, index + 1),
    position: track[index] ?? null,
    scrubTime: timeAt(index),
    endTime: timeAt(maxIndex),
    maxIndex,
    waypoints: toWaypoints(points),
  };
}
