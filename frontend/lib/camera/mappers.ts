import type { CameraBurstResponse, CameraImageResponse } from "@/lib/api/camera-images";
import { CAMERA_IMAGE_STATUSES } from "@/lib/enums";
import { formatDayLabel, formatDayTime, formatTime, isSameDay } from "@/lib/format";
import type { ChipView } from "@/lib/incidents/types";
import { toTagValues } from "./tag-form";
import { CAMERA_FILTERS, type BurstView, type CameraFilter, type CameraFilterOption, type CameraView, type ImageTile, type SelectedImageView } from "./types";

const LOCALE = "en-US";
const MS_PER_MINUTE = 60_000;
const NO_VALUE = "—";

const FILTER_LABELS: Record<CameraFilter, string> = {
  [CAMERA_FILTERS.PENDING]: "To review",
  [CAMERA_FILTERS.TAGGED]: "Tagged",
  [CAMERA_FILTERS.EMPTY]: "Empty",
  [CAMERA_FILTERS.UNIDENTIFIABLE]: "Unidentifiable",
  [CAMERA_FILTERS.RESTRICTED]: "Restricted",
  [CAMERA_FILTERS.ALL]: "All",
};

function timeWithSeconds(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
}

function statusOf(image: CameraImageResponse): ChipView {
  switch (image.status) {
    case CAMERA_IMAGE_STATUSES.TAGGED:
      return { tone: "positive", label: image.species ? `${image.species} · ${image.animalCount ?? 1}` : "Tagged" };
    case CAMERA_IMAGE_STATUSES.RESTRICTED:
      return { tone: "negative", label: "Restricted" };
    default:
      return { tone: "neutral", label: FILTER_LABELS[image.status] };
  }
}

function byCaptureTime(a: CameraImageResponse, b: CameraImageResponse): number {
  return a.capturedAt.localeCompare(b.capturedAt);
}

function toTile(image: CameraImageResponse): ImageTile {
  return {
    id: image.id,
    time: timeWithSeconds(new Date(image.capturedAt)),
    status: statusOf(image),
    restricted: image.status === CAMERA_IMAGE_STATUSES.RESTRICTED,
  };
}

function toBurst(cameraCode: string, images: CameraImageResponse[], now: Date): BurstView {
  const sorted = [...images].sort(byCaptureTime);
  const first = new Date(sorted[0].capturedAt);
  const last = new Date(sorted[sorted.length - 1].capturedAt);
  const sameMinute = formatTime(first) === formatTime(last);
  const minutes = Math.max(1, Math.ceil((last.getTime() - first.getTime()) / MS_PER_MINUTE));
  return {
    key: `${cameraCode}-${sorted[0].id}`,
    camera: cameraCode,
    title: `${cameraCode} · ${formatDayTime(first, now)}${sameMinute ? "" : ` – ${formatTime(last)}`}`,
    caption: sorted.length === 1 ? "1 image" : `${sorted.length} images in ${minutes} min`,
    tiles: sorted.map(toTile),
  };
}

function matches(image: CameraImageResponse, filter: CameraFilter): boolean {
  return filter === CAMERA_FILTERS.ALL || image.status === filter;
}

function filterOptions(images: CameraImageResponse[]): CameraFilterOption[] {
  return Object.values(CAMERA_FILTERS).map((value) => ({
    value,
    label: FILTER_LABELS[value],
    count: images.filter((image) => matches(image, value)).length,
  }));
}

function reviewedText(image: CameraImageResponse, now: Date): string {
  if (!image.reviewedAt) return NO_VALUE;
  const time = formatDayTime(new Date(image.reviewedAt), now);
  return image.reviewedByName ? `${image.reviewedByName} · ${time}` : time;
}

function toSelected(image: CameraImageResponse, now: Date): SelectedImageView {
  const captured = new Date(image.capturedAt);
  const day = isSameDay(captured, now) ? "Today" : formatDayLabel(captured);
  return {
    id: image.id,
    title: `${image.cameraCode} · ${formatDayTime(captured, now)}`,
    status: statusOf(image),
    facts: [
      { label: "Camera", value: image.cameraCode },
      { label: "Captured", value: `${day} · ${timeWithSeconds(captured)}` },
      { label: "Reviewed", value: reviewedText(image, now) },
    ],
    restricted: image.status === CAMERA_IMAGE_STATUSES.RESTRICTED,
    tag: toTagValues(image),
  };
}

export function toCameraView(bursts: CameraBurstResponse[], filter: CameraFilter, selectedId: number | null, now: Date): CameraView {
  const images = bursts.flatMap((burst) => burst.images);
  const pending = (image: CameraImageResponse) => image.status === CAMERA_IMAGE_STATUSES.PENDING;
  const selected = images.find((image) => image.id === selectedId);
  return {
    bursts: bursts.flatMap((burst) => {
      const shown = burst.images.filter((image) => matches(image, filter));
      return shown.length > 0 ? [toBurst(burst.cameraCode, shown, now)] : [];
    }),
    filters: filterOptions(images),
    pendingCount: images.filter(pending).length,
    pendingBurstCount: bursts.filter((burst) => burst.images.some(pending)).length,
    restrictedCount: images.filter((image) => image.status === CAMERA_IMAGE_STATUSES.RESTRICTED).length,
    selected: selected ? toSelected(selected, now) : null,
  };
}
