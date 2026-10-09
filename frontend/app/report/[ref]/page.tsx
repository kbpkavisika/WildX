"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, MapPin, Search } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT, type TranslationKey } from "@/lib/i18n";
import { fetchPublicReport, type PublicReportResponse } from "@/lib/api/public-report";
import { cn } from "@/lib/utils";

function getStatusBadgeConfig(status: string, t: (k: TranslationKey) => string) {
  switch (status) {
    case "NEW":
      return {
        label: t("statusNew"),
        className: "bg-surface-sunken text-ink-body border-line",
      };
    case "NEEDS_LOCATION":
      return {
        label: t("statusNeedsLocation"),
        className: "bg-negative-bg text-negative border-negative-line",
      };
    case "VALIDATED":
      return {
        label: t("statusValidated"),
        className: "bg-secondary-soft text-primary border-line",
      };
    case "DISPATCHED":
      return {
        label: t("statusDispatched"),
        className: "bg-[#FFF4ED] text-[#C2410C] border-[#FDBA8C]",
      };
    case "CLOSED":
      return {
        label: t("statusClosed"),
        className: "bg-positive-bg text-positive border-positive-line",
      };
    case "INVALID":
      return {
        label: t("statusInvalid"),
        className: "bg-negative-bg text-negative border-negative-line",
      };
    case "DUPLICATE":
      return {
        label: t("statusDuplicate"),
        className: "bg-surface-sunken text-ink-muted border-line",
      };
    default:
      return {
        label: status,
        className: "bg-surface-sunken text-ink border-line",
      };
  }
}

export default function PublicReportStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useT();

  const refParam = typeof params.ref === "string" ? decodeURIComponent(params.ref) : "";
  const [searchInput, setSearchInput] = useState<string>("");

  const { data: report, isPending, isError } = useQuery<PublicReportResponse>({
    queryKey: ["public-report", refParam],
    queryFn: () => fetchPublicReport(refParam),
    enabled: Boolean(refParam),
    refetchInterval: 15_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = searchInput.trim().toUpperCase();
    if (clean) {
      if (!clean.startsWith("R-") && /^\d+$/.test(clean)) {
        clean = `R-${clean}`;
      }
      router.push(`/report/${encodeURIComponent(clean)}`);
    }
  };

  const baseApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/api\/v1\/?$/, "");
  const photoUrl = report
    ? `${baseApiUrl}/api/v1/public/reports/${encodeURIComponent(report.referenceCode)}/photo`
    : "";

  const statusConfig = report ? getStatusBadgeConfig(report.status, t) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-body text-ink">
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link href="/report" className="flex items-center gap-2 text-ink-body hover:text-ink">
            <ArrowLeft className="size-4" strokeWidth={2.2} />
            <span className="text-body font-medium">{t("backToHome")}</span>
          </Link>
          <LanguageSwitcher compact />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-xl flex-col gap-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-11 w-full rounded-md border border-line-strong bg-surface pl-10 pr-3 text-body text-ink focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex h-11 items-center justify-center rounded-md bg-primary px-4 text-body font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {t("checkStatus")}
            </button>
          </form>

          {isPending && <p className="text-body text-ink-muted">{t("loading")}</p>}

          {isError && (
            <div className="rounded-xl border border-line bg-surface p-6 text-center">
              <p className="text-body text-negative">{t("notFound")}</p>
              <Link
                href="/report"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-label font-medium text-white"
              >
                {t("submitAnother")}
              </Link>
            </div>
          )}

          {report && (
            <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <span className="text-caption font-medium uppercase tracking-wider text-ink-muted">
                    {t("referenceLabel")}
                  </span>
                  <h1 className="text-card-title font-semibold text-primary">{report.referenceCode}</h1>
                </div>
                {statusConfig && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-caption font-medium",
                      statusConfig.className
                    )}
                  >
                    {statusConfig.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-body">
                <div>
                  <span className="text-caption text-ink-muted">{t("reportType")}</span>
                  <p className="font-medium text-ink">{report.type}</p>
                </div>
                <div>
                  <span className="text-caption text-ink-muted">{t("animalsLabel")}</span>
                  <p className="font-medium text-ink">{report.animalCount}</p>
                </div>
                {(report.segmentName || report.landmarkCode) && (
                  <div className="col-span-2 flex items-center gap-2 text-ink-body">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span>
                      {report.segmentName ? report.segmentName : ""}
                      {report.landmarkCode ? ` (${report.landmarkCode})` : ""}
                    </span>
                  </div>
                )}
                {report.createdAt && (
                  <div className="col-span-2 flex items-center gap-2 text-caption text-ink-muted">
                    <Clock className="size-3.5 shrink-0" />
                    <span>
                      {t("reportedOn")}: {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {report.description && (
                <div className="rounded-lg bg-surface-sunken p-3.5">
                  <span className="text-caption font-medium text-ink-muted">{t("notes")}</span>
                  <p className="mt-1 text-body text-ink">{report.description}</p>
                </div>
              )}

              {report.outcome && (
                <div className="rounded-lg border border-positive-line bg-positive-bg p-4">
                  <div className="flex items-center gap-2 text-positive">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span className="font-medium">{t("outcomeLabel")}</span>
                  </div>
                  <p className="mt-1.5 text-body text-ink">{report.outcome}</p>
                </div>
              )}

              {report.photoPath && (
                <div className="mt-2">
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-caption font-medium text-ink-muted">Photo Evidence</span>
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:underline"
                    >
                      <span>Open original</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-line bg-black/95">
                    <img
                      src={photoUrl}
                      alt={`Evidence for ${report.referenceCode}`}
                      className="max-h-80 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-col gap-2 pt-2">
                <Link
                  href="/report"
                  className="flex min-h-12 w-full items-center justify-center rounded-md border border-line bg-surface text-label font-medium text-ink transition-colors hover:bg-surface-muted"
                >
                  {t("submitAnother")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
