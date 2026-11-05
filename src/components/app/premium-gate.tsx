import { Check, Crown } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function PremiumGate({ title, text, art, points, isOwner }: { title: string; text: string; art: React.ReactNode; points: string[]; isOwner: boolean }) {
  return (
    <div className="grid items-center gap-8 rounded-[32px] border border-line bg-card p-6 sm:p-10 md:grid-cols-[0.9fr_1.1fr]">
      <div className="grid place-items-center rounded-3xl bg-caramel-soft p-6">{art}</div>
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel-soft px-3 py-1 text-xs font-bold text-mocha">
          <Crown className="size-3.5" /> Fitur Premium
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
        <p className="mt-2 text-muted">{text}</p>
        <ul className="mt-5 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2 font-semibold text-ink">
              <Check className="mt-0.5 size-4 shrink-0 text-income" strokeWidth={3} /> {p}
            </li>
          ))}
        </ul>
        {isOwner ? (
          <ButtonLink href="/langganan" className="mt-6" size="lg">Lihat paket Premium</ButtonLink>
        ) : (
          <p className="mt-6 rounded-2xl bg-cream-2 px-4 py-3 text-sm font-semibold text-muted">Fitur ini mengikuti paket pemilik buku keuangan ini.</p>
        )}
      </div>
    </div>
  );
}
