/**
 * Ilustrasi pendukung Boma: benda-benda keuangan bergaya sama dengan maskot
 * (garis coklat tua 3px, isi warna solid pastel, tanpa gradasi).
 */
const L = "#3a2a20";
const s = { stroke: L, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

type P = { className?: string; title?: string };

function Svg({ className, title, children, vb = "0 0 200 160" }: P & { children: React.ReactNode; vb?: string }) {
  return (
    <svg viewBox={vb} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {children}
    </svg>
  );
}

/** Dompet terbuka dengan uang kertas dan koin */
export function WalletArt(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="146" rx="70" ry="7" fill="#e9dccd" />
      <rect x="58" y="34" width="70" height="44" rx="6" fill="#cfe6d6" {...s} transform="rotate(-10 93 56)" />
      <rect x="70" y="30" width="70" height="44" rx="6" fill="#e3f2e8" {...s} transform="rotate(6 105 52)" />
      <circle cx="106" cy="52" r="9" fill="none" stroke="#3f8a5c" strokeWidth="3" />
      <rect x="36" y="62" width="128" height="78" rx="14" fill="#b98257" {...s} />
      <path d="M36 82 h128" stroke="#8f5e3d" strokeWidth="3" />
      <rect x="120" y="88" width="52" height="30" rx="10" fill="#d99b5b" {...s} />
      <circle cx="136" cy="103" r="6" fill="#fff" {...s} strokeWidth="2.5" />
      <circle cx="170" cy="40" r="14" fill="#efbe5a" {...s} />
      <path d="M170 33 v14" stroke="#c98f2c" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

/** Toples tabungan berisi koin */
export function JarArt(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="148" rx="56" ry="7" fill="#e9dccd" />
      <rect x="66" y="18" width="68" height="16" rx="5" fill="#b98257" {...s} />
      <path d="M62 40 C 50 54 48 120 58 136 C 64 146 136 146 142 136 C 152 120 150 54 138 40 Z" fill="#eef6fb" {...s} />
      <g {...s} strokeWidth="2.6" fill="#efbe5a">
        <ellipse cx="80" cy="126" rx="16" ry="7" />
        <ellipse cx="118" cy="128" rx="16" ry="7" />
        <ellipse cx="98" cy="114" rx="16" ry="7" />
        <ellipse cx="80" cy="104" rx="16" ry="7" />
        <ellipse cx="118" cy="104" rx="16" ry="7" />
        <ellipse cx="100" cy="92" rx="16" ry="7" />
      </g>
      <path d="M74 52 C 70 66 70 80 72 90" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="84" y="56" width="32" height="20" rx="5" fill="#fde9e7" {...s} strokeWidth="2.4" />
      <path d="M93 66 l5 4 9 -8" stroke="#c4553f" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Diagram donat anggaran */
export function BudgetPieArt(p: P) {
  // lingkaran r=44, keliling 276.5
  const seg = [
    { c: "#7a4f33", v: 0.38 },
    { c: "#d99b5b", v: 0.27 },
    { c: "#f0a8a4", v: 0.2 },
    { c: "#6f9fc7", v: 0.15 },
  ];
  const K = 2 * Math.PI * 44;
  let off = 0;
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="148" rx="60" ry="7" fill="#e9dccd" />
      <circle cx="100" cy="78" r="60" fill="#fff" {...s} />
      <g transform="rotate(-90 100 78)">
        {seg.map((x) => {
          const el = (
            <circle key={x.c} cx="100" cy="78" r="44" fill="none" stroke={x.c} strokeWidth="22" strokeDasharray={`${x.v * K - 3} ${K}`} strokeDashoffset={-off} />
          );
          off += x.v * K;
          return el;
        })}
      </g>
      <circle cx="100" cy="78" r="30" fill="#fbf6f0" {...s} strokeWidth="2.5" />
      <text x="100" y="85" textAnchor="middle" fontSize="20" fontWeight="800" fill={L} fontFamily="var(--font-heading), sans-serif">
        Rp
      </text>
    </Svg>
  );
}

/** Target / tujuan tabungan dengan bendera */
export function GoalArt(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="148" rx="60" ry="7" fill="#e9dccd" />
      <circle cx="100" cy="84" r="58" fill="#fff" {...s} />
      <circle cx="100" cy="84" r="42" fill="#fde9e7" {...s} />
      <circle cx="100" cy="84" r="26" fill="#fff" {...s} />
      <circle cx="100" cy="84" r="11" fill="#c4553f" {...s} />
      <path d="M100 84 L150 30" {...s} strokeWidth="4" />
      <path d="M150 30 l4 -16 M150 30 l16 -4" stroke="#d99b5b" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 22 v52" {...s} />
      <path d="M40 24 h30 l-8 10 8 10 h-30 Z" fill="#d99b5b" {...s} />
    </Svg>
  );
}

/** Kalender tagihan dengan tanda jatuh tempo */
export function CalendarArt(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="148" rx="64" ry="7" fill="#e9dccd" />
      <rect x="40" y="26" width="120" height="114" rx="14" fill="#fff" {...s} />
      <path d="M40 58 h120 V40 a14 14 0 0 0 -14 -14 H54 a14 14 0 0 0 -14 14 Z" fill="#b98257" {...s} />
      <path d="M70 16 v20 M130 16 v20" {...s} strokeWidth="5" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => {
          const due = r === 1 && c === 3;
          const paid = (r === 0 && c === 1) || (r === 2 && c === 0);
          return (
            <rect
              key={`${r}${c}`}
              x={52 + c * 20}
              y={68 + r * 17}
              width="14"
              height="11"
              rx="3"
              fill={due ? "#c4553f" : paid ? "#3f8a5c" : "#f3e7da"}
            />
          );
        }),
      )}
      <circle cx="160" cy="118" r="20" fill="#efbe5a" {...s} />
      <path d="M160 108 v11 l7 5" {...s} />
    </Svg>
  );
}

/** Perisai keamanan dengan gembok */
export function ShieldArt(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="148" rx="54" ry="7" fill="#e9dccd" />
      <path d="M100 14 L154 32 C 156 86 136 122 100 140 C 64 122 44 86 46 32 Z" fill="#e5f0f8" {...s} />
      <path d="M100 28 L140 42 C 140 82 126 108 100 124 Z" fill="#cfe1ef" />
      <rect x="78" y="70" width="44" height="36" rx="8" fill="#7a4f33" {...s} />
      <path d="M86 70 v-10 a14 14 0 0 1 28 0 v10" fill="none" {...s} strokeWidth="4" />
      <circle cx="100" cy="86" r="5" fill="#fbf6f0" />
      <path d="M100 90 v8" stroke="#fbf6f0" strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

/** Struk belanja */
export function ReceiptArt(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="148" rx="50" ry="7" fill="#e9dccd" />
      <path d="M58 14 h84 v124 l-10 -7 -11 7 -10 -7 -11 7 -11 -7 -10 7 -11 -7 -10 7 Z" fill="#fff" {...s} />
      <rect x="72" y="28" width="56" height="10" rx="4" fill="#ead8c6" />
      {[50, 66, 82].map((y, i) => (
        <g key={y}>
          <path d={`M72 ${y} h34`} stroke="#c9b3a0" strokeWidth="5" strokeLinecap="round" />
          <path d={`M116 ${y} h12`} stroke={i === 2 ? "#3f8a5c" : "#c4553f"} strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
      <path d="M72 100 h56" stroke={L} strokeWidth="2" strokeDasharray="4 4" />
      <path d="M72 114 h22" stroke={L} strokeWidth="5" strokeLinecap="round" />
      <path d="M108 114 h20" stroke="#7a4f33" strokeWidth="5" strokeLinecap="round" />
    </Svg>
  );
}

/** Dua rumah kecil + hati: keuangan bersama pasangan */
export function HomeHeartArt(p: P) {
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="148" rx="74" ry="7" fill="#e9dccd" />
      <path d="M40 140 V84 L80 52 L120 84 V140 Z" fill="#fff" {...s} />
      <path d="M30 90 L80 48 L130 90" fill="none" {...s} strokeWidth="5" stroke="#b98257" />
      <rect x="68" y="104" width="24" height="36" rx="4" fill="#b98257" {...s} />
      <rect x="50" y="92" width="14" height="14" rx="3" fill="#e5f0f8" {...s} strokeWidth="2.4" />
      <path d="M150 52 c-8 -14 -30 -8 -26 8 c3 12 26 26 26 26 s23 -14 26 -26 c4 -16 -18 -22 -26 -8 Z" fill="#f0a8a4" {...s} />
      <circle cx="160" cy="118" r="18" fill="#efbe5a" {...s} />
      <circle cx="132" cy="128" r="12" fill="#efbe5a" {...s} />
    </Svg>
  );
}

/** Jejak kaki kucing kecil sebagai ornamen */
export function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <g fill="currentColor">
        <ellipse cx="20" cy="27" rx="9" ry="8" />
        <ellipse cx="9" cy="17" rx="4" ry="5" />
        <ellipse cx="16" cy="10" rx="4" ry="5" />
        <ellipse cx="24" cy="10" rx="4" ry="5" />
        <ellipse cx="31" cy="17" rx="4" ry="5" />
      </g>
    </svg>
  );
}
