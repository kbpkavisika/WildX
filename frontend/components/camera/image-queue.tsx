"use client";

import { Chip } from "@/components/ui/chip";
import { useCameraPage } from "@/lib/camera/store";
import type { BurstView, ImageTile } from "@/lib/camera/types";
import { cn } from "@/lib/utils";
import { ImagePicture } from "./image-picture";

function TileButton({ tile, camera, picture }: { tile: ImageTile; camera: string; picture: string | undefined }) {
  const selected = useCameraPage((state) => state.selectedId === tile.id);
  const toggle = useCameraPage((state) => state.toggle);
  return (
    <button
      aria-pressed={selected}
      aria-label={`${camera} at ${tile.time}, ${tile.status.label}`}
      onClick={() => toggle(tile.id)}
      className={cn(
        "flex cursor-pointer flex-col gap-2 overflow-hidden rounded-lg border-2 bg-card pb-2 text-left",
        selected ? "border-primary ring-3 ring-lime-soft" : "border-transparent hover:border-line-strong",
      )}
    >
      <ImagePicture src={picture} restricted={tile.restricted} alt={`${camera} at ${tile.time}`} />
      <span className="flex flex-wrap items-center justify-between gap-1.5 px-2 text-caption text-ink-muted">
        {tile.time}
        <Chip tone={tile.status.tone}>{tile.status.label}</Chip>
      </span>
    </button>
  );
}

interface ImageQueueProps {
  bursts: BurstView[];
  pictures: Map<number, string>;
  emptyLabel: string;
}

export function ImageQueue({ bursts, pictures, emptyLabel }: ImageQueueProps) {
  if (bursts.length === 0) return <p className="m-0 text-body text-ink-muted">{emptyLabel}</p>;
  return (
    <div className="flex flex-col gap-[18px]">
      {bursts.map((burst) => (
        <div key={burst.key} className="flex flex-col gap-2.5 border-b border-line-soft pb-[18px] last:border-b-0 last:pb-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-label text-ink">{burst.title}</span>
            <span className="text-caption text-ink-muted">{burst.caption}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
            {burst.tiles.map((tile) => (
              <TileButton key={tile.id} tile={tile} camera={burst.camera} picture={pictures.get(tile.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
