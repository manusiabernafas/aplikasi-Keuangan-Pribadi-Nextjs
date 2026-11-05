import { BomaCat, type BomaPose } from "@/components/illustrations/boma-cat";

export function PageHeader({ title, text, action, pose }: { title: string; text?: string; action?: React.ReactNode; pose?: BomaPose }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {pose && <BomaCat pose={pose} className="hidden w-16 sm:block" title="" />}
        <div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
          {text && <p className="mt-1 text-muted">{text}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
