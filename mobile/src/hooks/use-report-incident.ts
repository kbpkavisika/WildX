import { randomUUID } from "expo-crypto";
import { File, Paths } from "expo-file-system";
import { useState } from "react";
import { toIncidentCreateRequest, type ReportIncidentSubmit, type TakenPhoto } from "@/lib/incidents/report-form";
import { savedNotice } from "@/lib/outbox/overlay";
import { useConnection } from "@/lib/outbox/store";
import { save } from "@/lib/outbox/sync";
import { OUTBOX_KINDS } from "@/lib/outbox/types";
import { useIncidentTypeOptions, useParkSectors } from "./use-park-data";

const PNG_TYPE = "image/png";

async function keepPhoto(clientId: string, photo: TakenPhoto): Promise<string> {
  const extension = photo.mimeType === PNG_TYPE ? "png" : "jpg";
  const kept = new File(Paths.document, `incident-${clientId}.${extension}`);
  await new File(photo.uri).copy(kept, { overwrite: true });
  return kept.uri;
}

export function useReportIncident() {
  const types = useIncidentTypeOptions();
  const sectors = useParkSectors();
  const online = useConnection((state) => state.online);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const submit = async (values: ReportIncidentSubmit) => {
    setSaving(true);
    setError(null);
    try {
      const clientId = randomUUID();
      const typeName = types.options.find((type) => String(type.id) === values.typeId)?.name ?? "Incident";
      const photoUri = values.photo ? await keepPhoto(clientId, values.photo) : null;
      save({
        id: clientId,
        kind: OUTBOX_KINDS.INCIDENT,
        label: typeName,
        body: toIncidentCreateRequest(clientId, values, new Date()),
        photoUri,
      });
      setNotice(online ? `Saved · ${typeName} reported.` : savedNotice("Saved", false));
      setFormKey((key) => key + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the report. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return { typeOptions: types.options, typesError: types.isError, sectors, saving, notice, error, formKey, submit };
}
