import { BomaCat, type BomaPose } from "@/components/illustrations/boma-cat";
import { cn } from "@/lib/utils";

export function EmptyState({ pose = "think", title, text, action, className }: { pose?: BomaPose; title: string; text?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-3xl border-2 border-dashed border-line bg-card px-6 py-10 text-center", className)}>
      <BomaCat pose={pose} className="w-32" title="" />
      <p className="mt-3 font-display text-lg font-bold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
