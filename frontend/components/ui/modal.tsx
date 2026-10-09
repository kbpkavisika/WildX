"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { QuietButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  wide?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, wide = false, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.showModal();
    return () => opener?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] overflow-y-auto rounded-lg bg-card p-6 text-ink shadow-float backdrop:bg-ink/40",
        wide ? "max-w-[640px]" : "max-w-[560px]",
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-form-title">{title}</h2>
          <QuietButton type="button" aria-label="Close" onClick={onClose} className="px-0">
            <X />
          </QuietButton>
        </div>
        {children}
      </div>
    </dialog>
  );
}
