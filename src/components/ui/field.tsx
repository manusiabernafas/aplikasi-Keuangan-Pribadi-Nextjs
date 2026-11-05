import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-2xl border-2 border-line bg-card px-4 py-2.5 text-base text-ink placeholder:text-[#a8968a] transition-colors outline-none hover:border-latte focus:border-caramel aria-invalid:border-expense disabled:bg-cream-2";

export function Field({ label, htmlFor, error, hint, children, className, optional }: { label: string; htmlFor: string; error?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string; optional?: boolean }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-bold text-ink">
        {label}
        {optional && <span className="text-xs font-medium text-muted">boleh dikosongkan</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm font-semibold text-expense">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "min-h-20 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237c6758%22 stroke-width=%222.5%22 stroke-linecap=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_14px_center] bg-no-repeat pr-10", className)} {...props}>
      {children}
    </select>
  );
}

/** Atribut aksesibilitas untuk input yang punya error */
export function errProps(id: string, error?: string) {
  return error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};
}
