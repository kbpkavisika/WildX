import { Search } from "lucide-react";
import { fieldClass } from "@/components/ui/field";
import type { IncidentTypeResponse } from "@/lib/api/incident-types";
import { SEVERITY_DISPLAY, toSeverityFilter, toTypeFilter } from "@/lib/incidents/mappers";
import { ALL, type IncidentQueueFilters } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

interface IncidentFiltersProps {
  filters: IncidentQueueFilters;
  types: IncidentTypeResponse[];
  onChange: (change: Partial<IncidentQueueFilters>) => void;
}

const SELECT = cn(fieldClass(false), "h-8 w-auto text-field-label");

export function IncidentFilters({ filters, types, onChange }: IncidentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-10 w-[280px] max-w-full items-center gap-2.5 rounded-md border border-line bg-card pr-2.5 pl-3">
        <Search className="size-[18px] shrink-0 text-ink-muted" strokeWidth={2} />
        <input
          type="search"
          aria-label="Search incidents"
          placeholder="Search incidents"
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          className="min-w-0 grow bg-transparent text-body text-ink outline-none placeholder:text-ink-muted"
        />
      </label>
      <select
        aria-label="Type"
        value={String(filters.typeId)}
        onChange={(event) => onChange({ typeId: toTypeFilter(event.target.value) })}
        className={SELECT}
      >
        <option value={ALL}>All types</option>
        {types.map((type) => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>
      <select
        aria-label="Severity"
        value={filters.severity}
        onChange={(event) => onChange({ severity: toSeverityFilter(event.target.value) })}
        className={SELECT}
      >
        <option value={ALL}>All severities</option>
        {Object.entries(SEVERITY_DISPLAY).map(([value, display]) => (
          <option key={value} value={value}>{display.label}</option>
        ))}
      </select>
    </div>
  );
}
