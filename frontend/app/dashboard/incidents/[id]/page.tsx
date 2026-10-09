"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IncidentDetail } from "@/components/incidents/incident-detail";

export default function IncidentDetailPage() {
  const id = Number(useParams<{ id: string }>().id);

  return (
    <>
      <Link href="/dashboard/incidents" className="inline-flex items-center gap-1.5 self-start text-field-label text-ink-body hover:text-ink">
        <ArrowLeft className="size-4" strokeWidth={1.8} />
        Incidents
      </Link>
      <IncidentDetail id={id} className="max-w-[720px]" />
    </>
  );
}
