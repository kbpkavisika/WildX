"use client";

import { ReportIncidentForm } from "@/components/incidents/report-incident-form";
import { PageHeader } from "@/components/layout/page-header";
import { useReportIncident } from "@/hooks/use-report-incident";

export default function ReportIncidentPage() {
  const { typeOptions, typesError, sectors, submit } = useReportIncident();

  return (
    <>
      <PageHeader title="Report incident" subtitle="Type and location are required." />
      {submit.isSuccess && (
        <p role="status" className="m-0 rounded-lg border border-positive-line bg-positive-bg px-4 py-3 text-body text-positive">
          Saved · {submit.data.typeName} reported{submit.data.sectorName ? ` in ${submit.data.sectorName}` : ""}.
        </p>
      )}
      {typesError && <p className="m-0 text-body text-negative">Could not load incident types.</p>}
      <ReportIncidentForm
        key={submit.data?.id ?? "new"}
        typeOptions={typeOptions}
        sectors={sectors}
        saving={submit.isPending}
        error={submit.error}
        onSubmit={(values) => submit.mutate(values)}
      />
    </>
  );
}
