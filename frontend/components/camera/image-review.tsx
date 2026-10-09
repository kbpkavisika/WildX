import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import type { SelectedImageView } from "@/lib/camera/types";

interface ImageReviewProps {
  view: SelectedImageView | null;
  media: React.ReactNode;
  children?: React.ReactNode;
}

export function ImageReview({ view, media, children }: ImageReviewProps) {
  if (!view) {
    return (
      <Card label="Image review">
        <p className="m-0 text-body text-ink-muted">Select an image to review it.</p>
      </Card>
    );
  }
  return (
    <Card label="Image review">
      <div className="flex flex-col gap-2">
        <CardTitle>{view.title}</CardTitle>
        <span>
          <Chip tone={view.status.tone}>{view.status.label}</Chip>
        </span>
      </div>
      {media}
      <FactList facts={view.facts} />
      {children}
    </Card>
  );
}
