import type { ResponderResponse } from "@/lib/api/dispatches";
import { formatAgo, formatKm, initialsOf } from "@/lib/format";
import type { ResponderOption } from "./types";

const NO_DISTANCE = "Distance unknown";

function presence(responder: ResponderResponse, now: Date): ResponderOption["presence"] {
  const seen = responder.lastSeenAt ? ` · seen ${formatAgo(new Date(responder.lastSeenAt), now)}` : "";
  return responder.offline
    ? { tone: "negative", label: `Offline${seen}` }
    : { tone: "positive", label: `On patrol${seen}` };
}

export function toResponderOptions(responders: ResponderResponse[], now: Date): ResponderOption[] {
  return responders.map((responder) => ({
    id: responder.id,
    name: responder.name,
    initials: initialsOf(responder.name),
    distance: responder.distanceM === null ? NO_DISTANCE : `${formatKm(responder.distanceM)} away`,
    presence: presence(responder, now),
  }));
}
