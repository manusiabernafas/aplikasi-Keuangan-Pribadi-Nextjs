import { Logo } from "@/components/brand/logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Logo />
      <article className="mt-10 rounded-[28px] border border-line bg-card p-6 sm:p-10 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted">
        <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
        <p className="!mt-2 text-sm">Terakhir diperbarui {updated}</p>
        {children}
      </article>
    </div>
  );
}
