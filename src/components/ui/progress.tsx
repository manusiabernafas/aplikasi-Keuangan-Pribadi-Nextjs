import { cn } from "@/lib/utils";

export function Progress({ value, tone = "caramel", className, label }: { value: number; tone?: "caramel" | "income" | "expense" | "mocha" | "sky"; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const bg = { caramel: "bg-caramel", income: "bg-income", expense: "bg-expense", mocha: "bg-mocha", sky: "bg-sky" }[tone];
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-latte-2", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-[width]", bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}
