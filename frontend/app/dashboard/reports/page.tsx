import { redirect } from "next/navigation";
import { REPORT_TABS } from "@/components/layout/report-tab-items";

export default function ReportsPage() {
  redirect(REPORT_TABS[0].href);
}
