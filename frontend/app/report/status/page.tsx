"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Search, ShieldAlert } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT } from "@/lib/i18n";

export default function ReportStatusLookupPage() {
  const router = useRouter();
  const { t } = useT();
  const [searchInput, setSearchInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = searchInput.trim().toUpperCase();
    if (!clean) {
      setError(t("searchPlaceholder"));
      return;
    }
    if (!clean.startsWith("R-") && /^\d+$/.test(clean)) {
      clean = `R-${clean}`;
    }
    router.push(`/report/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-body text-ink">
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link href="/report" className="flex min-h-12 items-center gap-2 text-ink-body hover:text-ink">
            <ArrowLeft className="size-4" strokeWidth={2.2} />
            <span className="text-body font-medium">{t("backToHome")}</span>
          </Link>
          <LanguageSwitcher compact />
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-secondary-soft text-primary">
              <Clock className="size-6" strokeWidth={2.2} />
            </div>
            <h1 className="mt-4 text-page-title text-ink">{t("statusTitle")}</h1>
            <p className="mt-1 text-body text-ink-muted">{t("statusSubtitle")}</p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 sm:p-7 shadow-sm">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <label htmlFor="ref-input" className="text-field-label text-ink-body font-medium">
                {t("referenceLabel")}
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <input
                  id="ref-input"
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t("searchPlaceholder")}
                  className="h-12 w-full rounded-md border border-line-strong bg-surface pl-10 pr-3 text-body text-ink font-mono uppercase focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>

              {error && <p className="text-caption text-negative">{error}</p>}

              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-label font-medium text-white transition-colors hover:bg-primary-hover"
              >
                {t("checkStatus")}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-line bg-surface-sunken p-4 text-body text-ink-muted">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              <span>Need to report a new animal conflict?</span>
            </div>
            <Link
              href="/report"
              className="font-medium text-primary hover:underline hover:text-primary-hover"
            >
              {t("reportTitle")} →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
