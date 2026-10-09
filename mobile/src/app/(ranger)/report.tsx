import { ReportIncidentForm } from "@/components/incidents/report-incident-form";
import { WaitingReportsCard } from "@/components/offline-reports/waiting-reports-card";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Screen } from "@/components/ui/screen";
import { SuccessBlock } from "@/components/ui/success-block";
import { useReportIncident } from "@/hooks/use-report-incident";

export default function ReportIncidentScreen() {
  const { typeOptions, typesError, sectors, saving, notice, error, formKey, submit } = useReportIncident();

  return (
    <Screen>
      <PageHeader title="Report incident" subtitle="Type and location are required." />
      <WaitingReportsCard />
      {notice && <SuccessBlock>{notice}</SuccessBlock>}
      {typesError && <Notice tone="negative">Could not load incident types.</Notice>}
      <ReportIncidentForm
        key={formKey}
        typeOptions={typeOptions}
        sectors={sectors}
        saving={saving}
        error={error}
        onSubmit={submit}
      />
    </Screen>
  );
}
