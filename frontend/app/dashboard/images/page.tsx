"use client";

import { ImageQueue } from "@/components/camera/image-queue";
import { ImageReview } from "@/components/camera/image-review";
import { SecondaryLink } from "@/components/devices/secondary-link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { useCameraImages } from "@/hooks/use-camera-images";
import { useCameraPage } from "@/lib/camera/store";
import type { CameraView } from "@/lib/camera/types";
import { counted } from "@/lib/devices/mappers";

function Summary({ view, restrictedOnly }: { view: CameraView; restrictedOnly: boolean }) {
  if (restrictedOnly) {
    return <strong className="font-semibold text-ink">{counted(view.restrictedCount, "restricted image", "restricted images")}.</strong>;
  }
  return (
    <>
      <strong className="font-semibold text-ink">{counted(view.pendingCount, "image", "images")}</strong> to review in{" "}
      {counted(view.pendingBurstCount, "burst", "bursts")}.
    </>
  );
}

export default function CameraTrapsPage() {
  const { parkId, canView, restrictedOnly, canTag, isPending, isError, view, pictures } = useCameraImages();
  const { filter, setFilter } = useCameraPage();
  const emptyLabel = restrictedOnly ? "No restricted images." : "No images match this filter.";

  return (
    <>
      <PageHeader
        title="Camera traps"
        subtitle={view && <Summary view={view} restrictedOnly={restrictedOnly} />}
        action={canTag && <SecondaryLink href="/dashboard/simulator">Simulator</SecondaryLink>}
      />
      {parkId === null && <p className="text-body text-ink-muted">Your account is not linked to a park.</p>}
      {parkId !== null && !canView && <p className="text-body text-ink-muted">Only park managers and the LEL can review camera images.</p>}
      {parkId !== null && canView && isPending && <p className="text-body text-ink-muted">Loading images…</p>}
      {isError && <p className="text-body text-negative">Could not load images. Retrying.</p>}
      {view && (
        <div className="flex flex-wrap items-start gap-5">
          <Card label="Image queue" className="flex-[3_1_420px]">
            {!restrictedOnly && (
              <div className="flex flex-wrap items-center gap-2">
                {view.filters.map((option) => (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    count={option.count}
                    pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                  />
                ))}
              </div>
            )}
            <ImageQueue bursts={view.bursts} pictures={pictures} emptyLabel={emptyLabel} />
          </Card>
          <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-5">
            <ImageReview view={view.selected} picture={view.selected ? pictures.get(view.selected.id) : undefined} />
          </div>
        </div>
      )}
    </>
  );
}
