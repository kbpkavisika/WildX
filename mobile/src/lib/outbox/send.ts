import { acknowledgeAlert, resolveAlert } from "@/lib/api/alerts";
import { acknowledgeDispatch, completeDispatch, declineDispatch } from "@/lib/api/dispatches";
import { reportIncident } from "@/lib/api/incidents";
import { endPatrol, recordPoints, startPatrol } from "@/lib/api/patrols";
import { POINT_BATCH_MAX } from "@/lib/constants";
import { atBody, bodyOf, completeBody, declineBody, incidentBody, pointBody, resolveBody } from "./bodies";
import { OUTBOX_KINDS, type OutboxRow } from "./types";

const PNG_EXTENSION = ".png";

function requireId(value: number | null): number {
  if (value === null) throw new Error("Saved item has no target");
  return value;
}

function photoType(uri: string): string {
  return uri.toLowerCase().endsWith(PNG_EXTENSION) ? "image/png" : "image/jpeg";
}

export function nextBatch(rows: OutboxRow[]): OutboxRow[] {
  const [first] = rows;
  if (!first) return [];
  if (first.kind !== OUTBOX_KINDS.TRACK_POINT) return [first];
  const batch: OutboxRow[] = [];
  for (const row of rows) {
    if (row.kind !== OUTBOX_KINDS.TRACK_POINT || row.patrolId !== first.patrolId || batch.length === POINT_BATCH_MAX) break;
    batch.push(row);
  }
  return batch;
}

export async function sendBatch(batch: OutboxRow[]): Promise<void> {
  const [row] = batch;
  switch (row.kind) {
    case OUTBOX_KINDS.PATROL_START:
      await startPatrol(requireId(row.patrolId), bodyOf(row, atBody).at);
      return;
    case OUTBOX_KINDS.PATROL_END:
      await endPatrol(requireId(row.patrolId), bodyOf(row, atBody).at);
      return;
    case OUTBOX_KINDS.TRACK_POINT: {
      const points = batch.map((point) => bodyOf(point, pointBody)).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      await recordPoints(requireId(row.patrolId), points);
      return;
    }
    case OUTBOX_KINDS.INCIDENT:
      await reportIncident(bodyOf(row, incidentBody), row.photoUri ? { uri: row.photoUri, mimeType: photoType(row.photoUri) } : null);
      return;
    case OUTBOX_KINDS.DISPATCH_ACK:
      await acknowledgeDispatch(requireId(row.targetId));
      return;
    case OUTBOX_KINDS.DISPATCH_COMPLETE:
      await completeDispatch(requireId(row.targetId), bodyOf(row, completeBody).outcome);
      return;
    case OUTBOX_KINDS.DISPATCH_DECLINE:
      await declineDispatch(requireId(row.targetId), bodyOf(row, declineBody).reason);
      return;
    case OUTBOX_KINDS.ALERT_ACK:
      await acknowledgeAlert(requireId(row.targetId));
      return;
    case OUTBOX_KINDS.ALERT_RESOLVE:
      await resolveAlert(requireId(row.targetId), bodyOf(row, resolveBody).disposition);
      return;
  }
}

export function queryKeysFor(row: OutboxRow): unknown[][] {
  switch (row.kind) {
    case OUTBOX_KINDS.PATROL_START:
    case OUTBOX_KINDS.PATROL_END:
      return [["patrols"]];
    case OUTBOX_KINDS.TRACK_POINT:
      return [["patrols", row.patrolId, "track"]];
    case OUTBOX_KINDS.INCIDENT:
      return [["incidents"]];
    case OUTBOX_KINDS.DISPATCH_ACK:
    case OUTBOX_KINDS.DISPATCH_COMPLETE:
    case OUTBOX_KINDS.DISPATCH_DECLINE:
      return [["dispatches"], ["incidents"], ["alerts"]];
    case OUTBOX_KINDS.ALERT_ACK:
    case OUTBOX_KINDS.ALERT_RESOLVE:
      return [["alerts"]];
  }
}
