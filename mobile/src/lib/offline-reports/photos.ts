import { Directory, File, Paths } from "expo-file-system";

const FOLDER_NAME = "offline-reports";
const PNG_EXTENSION = "png";
const JPEG_EXTENSION = "jpg";

export async function keepPhoto(id: string, uri: string): Promise<string> {
  const folder = new Directory(Paths.document, FOLDER_NAME);
  if (!folder.exists) folder.create({ idempotent: true });
  const extension = uri.toLowerCase().endsWith(`.${PNG_EXTENSION}`) ? PNG_EXTENSION : JPEG_EXTENSION;
  const kept = new File(folder, `${id}.${extension}`);
  await new File(uri).copy(kept, { overwrite: true });
  return kept.uri;
}

export function deletePhoto(uri: string | null): void {
  if (!uri) return;
  const photo = new File(uri);
  if (photo.exists) photo.delete();
}
