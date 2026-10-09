import { X } from "lucide-react";
import { QuietButton } from "@/components/ui/button";

interface FormPanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function FormPanel({ title, onClose, children }: FormPanelProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-5 rounded-[14px] bg-surface-form p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-form-title">{title}</h2>
        <QuietButton type="button" aria-label="Close" onClick={onClose} className="px-0">
          <X />
        </QuietButton>
      </div>
      {children}
    </section>
  );
}
