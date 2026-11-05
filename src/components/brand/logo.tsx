import Link from "next/link";
import { cn } from "@/lib/utils";

/** Kepala Boma versi kecil untuk logo dan favicon */
export function BomaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M8 18 L9 4 L20 12 Z" fill="#b98257" stroke="#3a2a20" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M40 18 L39 4 L28 12 Z" fill="#fff" stroke="#3a2a20" strokeWidth="2.4" strokeLinejoin="round" />
      <ellipse cx="24" cy="27" rx="19" ry="16" fill="#fff" />
      <clipPath id="boma-mark-head">
        <ellipse cx="24" cy="27" rx="19" ry="16" />
      </clipPath>
      <path clipPath="url(#boma-mark-head)" d="M3 14 C 10 8 20 9 22 17 C 24 25 18 31 11 32 C 6 33 3 26 3 14 Z" fill="#b98257" />
      <ellipse cx="24" cy="27" rx="19" ry="16" fill="none" stroke="#3a2a20" strokeWidth="2.4" />
      <ellipse cx="17" cy="27" rx="2.6" ry="3.2" fill="#3a2a20" />
      <ellipse cx="31" cy="27" rx="2.6" ry="3.2" fill="#3a2a20" />
      <path d="M22 32 h4 l-2 2.4 Z" fill="#e88f89" stroke="#3a2a20" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-xl", className)} aria-label="Boma, ke beranda">
      <BomaMark className="size-9" />
      <span className="font-display text-2xl font-extrabold tracking-tight text-mocha">boma</span>
    </Link>
  );
}
