import { ReportTabs } from "@/components/layout/report-tabs";

export default function ReportsLayout({ children }: LayoutProps<"/dashboard/reports">) {
  return (
    <>
      <ReportTabs />
      {children}
    </>
  );
}
