import { CAMERA_IMAGE_STATUSES } from "@/lib/enums";
import type { ChipView, DetailFact } from "@/lib/incidents/types";
import type { TagValues } from "./tag-form";

export const CAMERA_FILTERS = { ...CAMERA_IMAGE_STATUSES, ALL: "ALL" } as const;
export type CameraFilter = (typeof CAMERA_FILTERS)[keyof typeof CAMERA_FILTERS];

export interface ImageTile {
  id: number;
  time: string;
  status: ChipView;
  restricted: boolean;
}

export interface BurstView {
  key: string;
  camera: string;
  title: string;
  caption: string;
  tiles: ImageTile[];
}

export interface CameraFilterOption {
  value: CameraFilter;
  label: string;
  count: number;
}

export interface SelectedImageView {
  id: number;
  title: string;
  status: ChipView;
  facts: DetailFact[];
  restricted: boolean;
  tag: TagValues;
}

export interface CameraView {
  bursts: BurstView[];
  filters: CameraFilterOption[];
  pendingCount: number;
  pendingBurstCount: number;
  selected: SelectedImageView | null;
}
