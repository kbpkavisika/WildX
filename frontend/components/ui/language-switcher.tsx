"use client";

import { useT, LANGUAGES, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useT();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={cn("inline-flex items-center rounded-lg border border-line bg-surface p-1 shadow-none", className)}
    >
      {LANGUAGES.map((lang) => {
        const active = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code as Language)}
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center rounded-md font-medium transition-colors",
              compact
                ? "h-8 px-2.5 text-caption"
                : "min-h-12 px-3.5 text-body sm:min-h-9 sm:px-3 sm:text-caption",
              active
                ? "bg-primary font-semibold text-white"
                : "text-ink-body hover:bg-surface-muted hover:text-ink"
            )}
          >
            {lang.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
