import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-mocha text-white hover:bg-mocha-hover",
  secondary: "border-2 border-latte bg-card text-ink hover:border-caramel",
  soft: "bg-mocha-soft text-mocha hover:bg-latte",
  ghost: "text-muted hover:bg-latte-2 hover:text-ink",
  danger: "bg-expense text-white hover:bg-[#a9432f]",
  "danger-soft": "bg-expense-soft text-expense hover:bg-[#f6d3cb]",
} as const;
const sizes = { sm: "h-9 px-3 text-sm rounded-xl", md: "h-11 px-4 text-sm rounded-2xl", lg: "h-13 px-6 text-base rounded-2xl" } as const;

export type ButtonVariant = keyof typeof variants;
type Common = { variant?: ButtonVariant; size?: keyof typeof sizes; className?: string };

export function buttonClass({ variant = "primary", size = "md", className }: Common = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-55",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({ variant, size, className, type = "button", ...props }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: Common & React.ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />;
}
