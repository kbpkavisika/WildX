import type { DetailFact } from "@/lib/incidents/types";

export function FactList({ facts }: { facts: DetailFact[] }) {
  return (
    <dl className="m-0 grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-body">
      {facts.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className="text-ink-muted">{fact.label}</dt>
          <dd className="m-0 break-words text-ink">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
