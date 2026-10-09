"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Edit2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import {
  fetchSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  type BoundarySegment,
  type BoundarySegmentInput,
} from "@/lib/api/boundary-segments";
import { useAuthStore } from "@/lib/auth/store";
import { can } from "@/lib/auth/permissions";
import { apiErrorMessage } from "@/lib/api/client";

export default function BoundarySegmentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const parkId = user?.parkId ?? null;
  const canManage = can(user?.role, "boundary.manage");

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<BoundarySegment | null>(null);
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["boundary-segments", parkId],
    queryFn: () => fetchSegments(parkId as number),
    enabled: parkId !== null,
  });

  const saveMutation = useMutation({
    mutationFn: (input: BoundarySegmentInput) => {
      if (editing) {
        return updateSegment(parkId as number, editing.id, input);
      }
      return createSegment(parkId as number, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boundary-segments", parkId] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSegment(parkId as number, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boundary-segments", parkId] });
    },
  });

  const openNew = () => {
    setEditing(null);
    setName("");
    setCode("");
    setLat("6.47");
    setLng("80.89");
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (segment: BoundarySegment) => {
    setEditing(segment);
    setName(segment.name);
    setCode(segment.code);
    setLat(String(segment.centerLat));
    setLng(String(segment.centerLng));
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!cleanName || !cleanCode || isNaN(parsedLat) || isNaN(parsedLng)) {
      setFormError("Please fill in all fields with valid coordinates.");
      return;
    }

    saveMutation.mutate({
      name: cleanName,
      code: cleanCode,
      centerLat: parsedLat,
      centerLng: parsedLng,
    });
  };

  const handleDelete = (segment: BoundarySegment) => {
    if (window.confirm(`Delete boundary segment ${segment.name} (${segment.code})?`)) {
      deleteMutation.mutate(segment.id);
    }
  };

  const segments = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Boundary segments"
        subtitle={
          <>
            <strong className="font-semibold text-ink">{segments.length} segments</strong> defined for SMS reporting
            and conflict hotspot detection.
          </>
        }
        action={
          canManage && (
            <Button onClick={openNew} className="gap-2">
              <Plus className="size-4" strokeWidth={2} />
              <span>New segment</span>
            </Button>
          )
        }
      />

      {formOpen && canManage && (
        <Card label="Boundary segment form">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-card-title font-semibold text-ink">
              {editing ? `Edit ${editing.name}` : "New boundary segment"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Segment name">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kumbukgaha Farmland"
                  className={fieldClass(false)}
                />
              </Field>

              <Field label="SMS landmark code (short)">
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KUMB"
                  className={fieldClass(false)}
                />
              </Field>

              <Field label="Centre latitude">
                <input
                  type="number"
                  step="any"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="6.47"
                  className={fieldClass(false)}
                />
              </Field>

              <Field label="Centre longitude">
                <input
                  type="number"
                  step="any"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="80.89"
                  className={fieldClass(false)}
                />
              </Field>
            </div>

            {formError && <p className="text-caption text-negative">{formError}</p>}
            {saveMutation.isError && (
              <p className="text-caption text-negative">{apiErrorMessage(saveMutation.error)}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
              <Button type="submit" disabled={saveMutation.isPending} className="disabled:opacity-60">
                {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Create segment"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {query.isPending && <p className="text-body text-ink-muted">Loading boundary segments…</p>}
      {query.isError && <p className="text-body text-negative">Could not load boundary segments.</p>}
      {deleteMutation.isError && (
        <p className="text-body text-negative">{apiErrorMessage(deleteMutation.error)}</p>
      )}

      {query.data && (
        <Card label="Boundary segments list">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body">
              <thead className="bg-surface-muted text-caption font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Segment name</th>
                  <th className="px-4 py-3">SMS landmark code</th>
                  <th className="px-4 py-3">Centre coordinates</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {segments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-caption text-ink-muted">
                      No boundary segments defined for this park yet.
                    </td>
                  </tr>
                )}
                {segments.map((segment) => (
                  <tr key={segment.id} className="hover:bg-surface-sunken/40">
                    <td className="px-4 py-3 font-medium text-ink">{segment.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface-sunken px-2 py-0.5 font-mono text-caption font-semibold text-primary">
                        {segment.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-caption text-ink-body">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary" />
                        <span>
                          {segment.centerLat.toFixed(4)}, {segment.centerLng.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(segment)}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-body hover:bg-surface-muted hover:text-ink"
                            title="Edit segment"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(segment)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-muted hover:bg-negative-bg hover:text-negative"
                            title="Delete segment"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
