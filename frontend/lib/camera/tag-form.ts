import { z } from "zod";
import type { CameraImageResponse, CameraTagRequest } from "@/lib/api/camera-images";
import { CAMERA_IMAGE_STATUSES } from "@/lib/enums";

const SPECIES_MAX_LENGTH = 255;
const COUNT_MAX = 10_000;
const NO_CHOICE = "";

const TAG_STATUSES = {
  TAGGED: CAMERA_IMAGE_STATUSES.TAGGED,
  EMPTY: CAMERA_IMAGE_STATUSES.EMPTY,
  UNIDENTIFIABLE: CAMERA_IMAGE_STATUSES.UNIDENTIFIABLE,
  RESTRICTED: CAMERA_IMAGE_STATUSES.RESTRICTED,
} as const;
type TagStatus = (typeof TAG_STATUSES)[keyof typeof TAG_STATUSES];

export const TAG_OPTIONS: { value: TagStatus; label: string; caption: string }[] = [
  { value: TAG_STATUSES.TAGGED, label: "Animals", caption: "Name the species and how many you can count." },
  { value: TAG_STATUSES.EMPTY, label: "Empty", caption: "Nothing in the frame." },
  { value: TAG_STATUSES.UNIDENTIFIABLE, label: "Unidentifiable", caption: "Something is there but you cannot tell what." },
  {
    value: TAG_STATUSES.RESTRICTED,
    label: "Restricted",
    caption: "A suspected poacher. Hides the image from everyone except managers, and raises a critical alert.",
  },
];

export const tagSchema = z
  .object({
    status: z.union([z.enum(TAG_STATUSES), z.literal(NO_CHOICE)]),
    species: z.string().trim(),
    animalCount: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (values.status === NO_CHOICE) {
      ctx.addIssue({ code: "custom", path: ["status"], message: "Choose what is in the image" });
      return;
    }
    if (values.status !== TAG_STATUSES.TAGGED) return;
    if (values.species === "") ctx.addIssue({ code: "custom", path: ["species"], message: "Enter a species" });
    if (values.species.length > SPECIES_MAX_LENGTH) {
      ctx.addIssue({ code: "custom", path: ["species"], message: `Keep it under ${SPECIES_MAX_LENGTH} characters` });
    }
    const count = Number(values.animalCount);
    if (!/^\d+$/.test(values.animalCount) || count < 1 || count > COUNT_MAX) {
      ctx.addIssue({ code: "custom", path: ["animalCount"], message: `Enter a count from 1 to ${COUNT_MAX}` });
    }
  })
  .transform((values) => {
    if (values.status === NO_CHOICE) return z.NEVER;
    return { ...values, status: values.status };
  });

export type TagValues = z.input<typeof tagSchema>;
export type TagRequestValues = z.output<typeof tagSchema>;

export function toTagValues(image: CameraImageResponse): TagValues {
  return {
    status: image.status === CAMERA_IMAGE_STATUSES.PENDING ? NO_CHOICE : image.status,
    species: image.species ?? "",
    animalCount: image.animalCount === null ? "" : String(image.animalCount),
  };
}

export function isAnimals(status: TagValues["status"]): boolean {
  return status === TAG_STATUSES.TAGGED;
}

export function toTagRequest(values: TagRequestValues): CameraTagRequest {
  const animals = isAnimals(values.status);
  return {
    status: values.status,
    species: animals ? values.species : null,
    animalCount: animals ? Number(values.animalCount) : null,
  };
}
