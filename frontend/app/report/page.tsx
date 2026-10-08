"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Check, CheckCircle2, ChevronRight, Clock, Compass, MapPin, Phone, ShieldAlert, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT } from "@/lib/i18n";
import { fetchPublicSegments, submitPublicReport, type BoundarySegment } from "@/lib/api/public-report";
import { cn } from "@/lib/utils";

type ReportType = "SIGHTING" | "CROP_DAMAGE" | "OTHER";

export default function VillagerReportPage() {
  const { t } = useT();

  const [type, setType] = useState<ReportType>("SIGHTING");
  const [animalCount, setAnimalCount] = useState<number>(1);
  const [phone, setPhone] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [locationMode, setLocationMode] = useState<"gps" | "landmark">("gps");
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [segments, setSegments] = useState<BoundarySegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicSegments(1)
      .then((data) => {
        setSegments(data);
        if (data.length > 0) {
          setSelectedSegmentId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleAcquireGps = () => {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError(t("gpsError"));
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsError(t("gpsError"));
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError(t("phoneHint"));
      return;
    }

    setSubmitting(true);
    try {
      const selectedSegment = segments.find((s) => s.id === selectedSegmentId);
      const res = await submitPublicReport(
        {
          parkId: 1,
          type,
          animalCount,
          reporterPhone: cleanPhone,
          description: description.trim() || undefined,
          segmentId: locationMode === "landmark" ? selectedSegmentId ?? undefined : undefined,
          landmarkCode: locationMode === "landmark" ? selectedSegment?.code : undefined,
          lat: locationMode === "gps" && latLng ? latLng.lat : undefined,
          lng: locationMode === "gps" && latLng ? latLng.lng : undefined,
        },
        photo || undefined
      );
      setSuccessRef(res.referenceCode);
    } catch {
      setError(t("errorSubmitting"));
    } finally {
      setSubmitting(false);
    }
  };

  if (successRef) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher compact />
          </div>
          <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex size-14 items-center justify-center rounded-full bg-positive-bg text-positive">
              <CheckCircle2 className="size-8" strokeWidth={2.2} />
            </div>
            <h1 className="mt-4 text-page-title text-ink">{t("reportSuccess")}</h1>
            <p className="mt-1 text-body text-ink-muted">{t("successNotice")}</p>

            <div className="mt-6 rounded-lg border border-line bg-surface-sunken p-4 text-center">
              <span className="text-caption font-medium uppercase tracking-wider text-ink-muted">
                {t("referenceLabel")}
              </span>
              <div className="mt-1 select-all text-hero-number font-semibold text-primary">
                {successRef}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/report/${encodeURIComponent(successRef)}`}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-label font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <span>{t("trackReport")}</span>
                <ChevronRight className="size-4" strokeWidth={2} />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSuccessRef(null);
                  setPhone("");
                  setDescription("");
                  removePhoto();
                  setLatLng(null);
                }}
                className="flex min-h-12 w-full items-center justify-center rounded-md border border-line bg-surface px-4 text-label text-ink transition-colors hover:bg-surface-muted"
              >
                {t("submitAnother")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const typeOptions: { value: ReportType; label: string; icon: typeof ShieldAlert }[] = [
    { value: "SIGHTING", label: t("sighting"), icon: Compass },
    { value: "CROP_DAMAGE", label: t("cropDamage"), icon: ShieldAlert },
    { value: "OTHER", label: t("other"), icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-body text-ink">
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-secondary">
              <span className="font-sans text-lg font-bold">W</span>
            </div>
            <span className="text-wordmark font-semibold tracking-tight text-ink">WildX</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/report/status"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-caption font-medium text-ink hover:bg-surface-muted transition-colors"
            >
              <Clock className="size-3.5 text-primary" />
              <span>{t("trackExisting")}</span>
            </Link>
            <LanguageSwitcher compact />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} noValidate className="mx-auto flex max-w-lg flex-col gap-5">
          <div>
            <h1 className="text-page-title text-ink">{t("reportTitle")}</h1>
            <p className="mt-1 text-body text-ink-muted">{t("reportSubtitle")}</p>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-surface-sunken px-3.5 py-2.5 text-caption text-ink-muted">
              <span>{t("haveReferenceCode")}</span>
              <Link
                href="/report/status"
                className="font-medium text-primary hover:underline hover:text-primary-hover"
              >
                {t("trackExisting")} →
              </Link>
            </div>
          </div>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="text-field-label text-ink-body">{t("reportType")}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {typeOptions.map((opt) => {
                const active = type === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-secondary-soft text-ink ring-2 ring-primary"
                        : "border-line bg-surface text-ink-body hover:bg-surface-muted"
                    )}
                  >
                    <Icon className={cn("size-5 shrink-0", active ? "text-primary" : "text-ink-muted")} />
                    <span className="text-label font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field label={t("animalCount")}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAnimalCount((c) => Math.max(1, c - 1))}
                className="flex size-12 items-center justify-center rounded-md border border-line bg-surface text-lg font-semibold text-ink transition-colors hover:bg-surface-muted"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={1000}
                value={animalCount}
                onChange={(e) => setAnimalCount(Math.max(1, parseInt(e.target.value) || 1))}
                className={cn(fieldClass(false), "h-12 text-center text-metric font-semibold text-primary")}
              />
              <button
                type="button"
                onClick={() => setAnimalCount((c) => c + 1)}
                className="flex size-12 items-center justify-center rounded-md border border-line bg-surface text-lg font-semibold text-ink transition-colors hover:bg-surface-muted"
              >
                +
              </button>
            </div>
          </Field>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="text-field-label text-ink-body">{t("location")}</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocationMode("gps");
                  if (!latLng && !gpsLoading) handleAcquireGps();
                }}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-label font-medium transition-colors",
                  locationMode === "gps"
                    ? "border-primary bg-secondary-soft text-ink ring-2 ring-primary"
                    : "border-line bg-surface text-ink-body hover:bg-surface-muted"
                )}
              >
                <Compass className="size-4 shrink-0 text-primary" />
                <span>GPS</span>
              </button>
              <button
                type="button"
                onClick={() => setLocationMode("landmark")}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-label font-medium transition-colors",
                  locationMode === "landmark"
                    ? "border-primary bg-secondary-soft text-ink ring-2 ring-primary"
                    : "border-line bg-surface text-ink-body hover:bg-surface-muted"
                )}
              >
                <MapPin className="size-4 shrink-0 text-primary" />
                <span>{t("landmarkLabel")}</span>
              </button>
            </div>

            {locationMode === "gps" ? (
              <div className="rounded-lg border border-line bg-surface-sunken p-3.5">
                {latLng ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-positive">
                      <Check className="size-5 shrink-0" strokeWidth={2.4} />
                      <span className="text-body font-medium">{t("gpsSuccess")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAcquireGps}
                      disabled={gpsLoading}
                      className="text-caption font-medium text-primary underline"
                    >
                      {gpsLoading ? t("gpsAcquiring") : "Refresh"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAcquireGps}
                    disabled={gpsLoading}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-body font-medium text-ink transition-colors hover:bg-surface-muted"
                  >
                    <Compass className="size-5 text-primary" />
                    <span>{gpsLoading ? t("gpsAcquiring") : t("useGps")}</span>
                  </button>
                )}
                {gpsError && <p className="mt-2 text-caption text-negative">{gpsError}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <select
                  value={selectedSegmentId ?? ""}
                  onChange={(e) => setSelectedSegmentId(Number(e.target.value))}
                  className={cn(fieldClass(false), "h-12 text-body font-medium")}
                >
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.id}>
                      {seg.name} ({seg.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>

          <Field label={t("phone")} error={error && !phone ? error : undefined}>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                className={cn(fieldClass(Boolean(error && !phone)), "h-12 pl-10 text-body")}
              />
            </div>
            <span className="mt-1 text-caption text-ink-muted">{t("phoneHint")}</span>
          </Field>

          <Field label={t("notes")}>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className={cn(fieldClass(false), "h-auto py-2.5 text-body")}
            />
          </Field>

          <Field label={t("photo")}>
            {photoPreview ? (
              <div className="relative mt-1 overflow-hidden rounded-lg border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Selected photo" className="max-h-48 w-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-ink/70 text-white hover:bg-ink"
                >
                  <X className="size-4" strokeWidth={2.4} />
                </button>
              </div>
            ) : (
              <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-dashed border-line-strong bg-surface px-4 py-3 text-body font-medium text-ink transition-colors hover:bg-surface-muted">
                <Camera className="size-5 text-primary" />
                <span>{t("photo")}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>
            )}
          </Field>

          {error && <p className="text-body font-medium text-negative">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="mt-2 min-h-12 w-full text-label font-semibold shadow-none disabled:opacity-60"
          >
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </main>
    </div>
  );
}
