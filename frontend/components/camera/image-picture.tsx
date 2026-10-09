import { Lock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImagePictureProps {
  src: string | undefined;
  restricted: boolean;
  alt: string;
  large?: boolean;
}

export function ImagePicture({ src, restricted, alt, large = false }: ImagePictureProps) {
  if (restricted) {
    return (
      <span className={cn("flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-surface-sunken text-negative", large ? "text-body" : "text-caption")}>
        <Lock className={large ? "size-6" : "size-5"} strokeWidth={1.8} />
        {large ? "Restricted image" : "Restricted"}
      </span>
    );
  }
  return (
    <span className="relative block aspect-[4/3] w-full bg-surface-sunken">
      {src ? (
        <Image src={src} alt={alt} fill unoptimized className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-caption text-ink-muted">Loading…</span>
      )}
    </span>
  );
}
