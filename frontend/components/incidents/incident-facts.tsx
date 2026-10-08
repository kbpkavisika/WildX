import Image from "next/image";
import type { DetailFact } from "@/lib/incidents/types";

interface IncidentFactsProps {
  facts: DetailFact[];
  hasPhoto: boolean;
  photoUrl: string | null;
  photoError: boolean;
}

function PhotoSlot({ hasPhoto, photoUrl, photoError }: Omit<IncidentFactsProps, "facts">) {
  if (!hasPhoto) return <p className="m-0 text-body text-ink-muted">No photo attached.</p>;
  if (photoError) return <p className="m-0 text-body text-negative">Could not load the photo.</p>;
  if (!photoUrl) return <p className="m-0 text-body text-ink-muted">Loading photo…</p>;
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-lg border border-line bg-surface-muted">
      <Image src={photoUrl} alt="Incident photo" fill unoptimized className="object-contain" />
    </div>
  );
}

export function IncidentFacts({ facts, ...photo }: IncidentFactsProps) {
  return (
    <div className="flex flex-col gap-[18px]">
      <dl className="m-0 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-body">
        {facts.map((fact) => (
          <div key={fact.label} className="contents">
            <dt className="text-ink-muted">{fact.label}</dt>
            <dd className="m-0 break-words text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <PhotoSlot {...photo} />
    </div>
  );
}
