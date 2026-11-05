/**
 * Boma, maskot kucing coklat-putih. Ilustrasi vektor datar (tanpa gradasi), satu komponen
 * dengan beberapa pose supaya gaya garis, warna, dan proporsinya selalu konsisten.
 */
export type BomaPose = "wave" | "coin" | "chart" | "sleep" | "happy" | "think" | "sit";
export type BomaVariant = "boma" | "mochi";

const BASE = {
  line: "#3a2a20",
  fur: "#ffffff",
  shade: "#f4ece3",
  brown: "#b98257",
  brownDark: "#8f5e3d",
  pinkInner: "#f6c4bf",
  nose: "#e88f89",
  cheek: "#f7c7c2",
  gold: "#efbe5a",
  goldDark: "#c98f2c",
};
// Mochi, teman Boma (dipakai di fitur partner): bulu abu-abu lembut
const MOCHI = { ...BASE, brown: "#9aa3b2", brownDark: "#6f7889" };

const stroke = { stroke: BASE.line, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function BomaCat({
  pose = "sit",
  className,
  title = "Boma, kucing maskot",
  animated = false,
  variant = "boma",
}: {
  pose?: BomaPose;
  variant?: BomaVariant;
  className?: string;
  title?: string;
  animated?: boolean;
}) {
  const C = variant === "mochi" ? MOCHI : BASE;
  const id = `${variant}-${pose}`;
  const eyes = pose === "sleep" ? "sleep" : pose === "happy" ? "happy" : "open";
  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label={title}>
      <defs>
        <clipPath id={`kepala-${id}`}>
          <ellipse cx="120" cy="100" rx="64" ry="54" />
        </clipPath>
        <clipPath id={`badan-${id}`}>
          <path d="M66 214 C 58 170 78 140 120 140 C 162 140 182 170 174 214 Z" />
        </clipPath>
      </defs>

      {/* bayangan lantai */}
      <ellipse cx="120" cy="222" rx="70" ry="9" fill="#e9dccd" />

      {/* ekor */}
      <path d="M166 206 C 214 206 220 160 200 146" fill="none" stroke={C.line} strokeWidth="20" strokeLinecap="round" />
      <path d="M166 206 C 214 206 220 160 200 146" fill="none" stroke={C.brown} strokeWidth="13" strokeLinecap="round" />
      <path d="M203 150 C 207 156 208 162 207 168" fill="none" stroke={C.brownDark} strokeWidth="3" strokeLinecap="round" />

      {/* badan */}
      <path d="M66 214 C 58 170 78 140 120 140 C 162 140 182 170 174 214 Z" fill={C.fur} {...stroke} />
      <g clipPath={`url(#badan-${id})`}>
        <ellipse cx="170" cy="170" rx="30" ry="40" fill={C.brown} />
        <ellipse cx="120" cy="196" rx="30" ry="26" fill={C.shade} />
      </g>
      <path d="M66 214 C 58 170 78 140 120 140 C 162 140 182 170 174 214 Z" fill="none" {...stroke} />

      {/* kaki depan bawah */}
      <ellipse cx="98" cy="214" rx="17" ry="9" fill={C.fur} {...stroke} />
      <ellipse cx="142" cy="214" rx="17" ry="9" fill={C.fur} {...stroke} />
      <path d="M92 214 v-3 M98 215 v-3 M136 214 v-3 M142 215 v-3" stroke={C.line} strokeWidth="2" strokeLinecap="round" />

      {/* properti di depan badan */}
      {pose === "coin" && <Coin />}
      {pose === "chart" && <Tablet />}

      {/* tangan */}
      {(pose === "coin" || pose === "chart") && (
        <>
          <ellipse cx="90" cy="172" rx="13" ry="11" fill={C.fur} {...stroke} />
          <ellipse cx="150" cy="172" rx="13" ry="11" fill={C.fur} {...stroke} />
        </>
      )}
      {(pose === "sit" || pose === "happy" || pose === "sleep") && (
        <>
          <ellipse cx="104" cy="168" rx="11" ry="12" fill={C.fur} {...stroke} />
          <ellipse cx="136" cy="168" rx="11" ry="12" fill={C.fur} {...stroke} />
        </>
      )}
      {pose === "wave" && <ellipse cx="102" cy="168" rx="11" ry="12" fill={C.fur} {...stroke} />}
      {pose === "think" && <ellipse cx="100" cy="170" rx="11" ry="12" fill={C.fur} {...stroke} />}

      {/* telinga */}
      <path d="M70 76 L72 30 L108 58 Z" fill={C.brown} {...stroke} />
      <path d="M78 66 L79 42 L98 57 Z" fill={C.pinkInner} />
      <path d="M170 76 L168 30 L132 58 Z" fill={C.fur} {...stroke} />
      <path d="M162 66 L161 42 L142 57 Z" fill={C.pinkInner} />

      {/* kepala */}
      <ellipse cx="120" cy="100" rx="64" ry="54" fill={C.fur} />
      <g clipPath={`url(#kepala-${id})`}>
        <path d="M50 60 C 70 44 104 46 112 70 C 118 92 100 112 76 116 C 60 118 52 100 50 60 Z" fill={C.brown} />
        <path d="M112 50 q2 10 0 18 M121 47 q1 12 0 22 M130 50 q-2 10 0 18" stroke={C.brownDark} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <ellipse cx="120" cy="140" rx="40" ry="16" fill={C.shade} />
      </g>
      <ellipse cx="120" cy="100" rx="64" ry="54" fill="none" {...stroke} />

      {/* mata */}
      {eyes === "open" && (
        <>
          <ellipse cx="96" cy="102" rx="8.5" ry="10.5" fill={C.line} />
          <ellipse cx="144" cy="102" rx="8.5" ry="10.5" fill={C.line} />
          <circle cx="99" cy="98" r="3.2" fill="#fff" />
          <circle cx="147" cy="98" r="3.2" fill="#fff" />
          <circle cx="94" cy="106" r="1.5" fill="#fff" />
          <circle cx="142" cy="106" r="1.5" fill="#fff" />
        </>
      )}
      {eyes === "happy" && (
        <path d="M87 104 q9 -11 18 0 M135 104 q9 -11 18 0" fill="none" {...stroke} strokeWidth="3.6" />
      )}
      {eyes === "sleep" && (
        <path d="M87 102 q9 8 18 0 M135 102 q9 8 18 0" fill="none" {...stroke} strokeWidth="3.6" />
      )}

      {/* pipi, hidung, mulut, kumis */}
      <ellipse cx="82" cy="120" rx="10" ry="6" fill={C.cheek} />
      <ellipse cx="158" cy="120" rx="10" ry="6" fill={C.cheek} />
      <path d="M114 114 h12 l-6 7 Z" fill={C.nose} stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
      {pose === "happy" ? (
        <path d="M110 124 q10 14 20 0 Z" fill="#c9605a" stroke={C.line} strokeWidth="2.6" strokeLinejoin="round" />
      ) : (
        <path d="M110 124 q5 6 10 0 q5 6 10 0" fill="none" stroke={C.line} strokeWidth="2.6" strokeLinecap="round" />
      )}
      <path d="M68 114 L44 108 M68 121 L42 122 M172 114 L196 108 M172 121 L198 122" stroke={C.line} strokeWidth="2.2" strokeLinecap="round" />

      {/* tangan yang terangkat digambar di depan kepala */}
      {pose === "wave" && (
        <g className={animated ? "boma-wave" : undefined}>
          <path d="M160 160 C 176 146 184 122 182 100" fill="none" stroke={C.line} strokeWidth="21" strokeLinecap="round" />
          <path d="M160 160 C 176 146 184 122 182 100" fill="none" stroke={C.fur} strokeWidth="14" strokeLinecap="round" />
          <circle cx="182" cy="96" r="13" fill={C.fur} {...stroke} />
          <path d="M176 90 v5 M182 88 v6 M188 90 v5" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {pose === "think" && (
        <g>
          <path d="M150 168 C 160 150 150 136 140 132" fill="none" stroke={C.line} strokeWidth="21" strokeLinecap="round" />
          <path d="M150 168 C 160 150 150 136 140 132" fill="none" stroke={C.fur} strokeWidth="14" strokeLinecap="round" />
          <circle cx="138" cy="130" r="12" fill={C.fur} {...stroke} />
        </g>
      )}
      {/* tambahan */}
      {pose === "sleep" && (
        <g fill={C.brownDark} fontFamily="var(--font-heading), sans-serif" fontWeight="800">
          <text x="176" y="56" fontSize="22">z</text>
          <text x="194" y="38" fontSize="16">z</text>
        </g>
      )}
      {pose === "think" && (
        <g>
          <circle cx="186" cy="54" r="22" fill="#fff" {...stroke} />
          <circle cx="166" cy="80" r="5" fill="#fff" {...stroke} strokeWidth="2.6" />
          <path d="M180 48 q6 -8 12 0 q2 6 -6 9 v5" fill="none" stroke={C.brownDark} strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="186" cy="68" r="2.2" fill={C.brownDark} />
        </g>
      )}
      {pose === "happy" && (
        <g fill={C.gold} stroke={C.line} strokeWidth="2">
          <path d="M40 60 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z" />
          <path d="M200 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
        </g>
      )}
    </svg>
  );
}

function Coin() {
  return (
    <g>
      <circle cx="120" cy="176" r="30" fill={BASE.gold} stroke={BASE.line} strokeWidth="3.2" />
      <circle cx="120" cy="176" r="21" fill="none" stroke={BASE.goldDark} strokeWidth="3" />
      <text x="120" y="184" textAnchor="middle" fontSize="20" fontWeight="800" fill={BASE.goldDark} fontFamily="var(--font-heading), sans-serif">Rp</text>
    </g>
  );
}

function Tablet() {
  return (
    <g>
      <rect x="84" y="150" width="72" height="54" rx="9" fill="#fff" stroke={BASE.line} strokeWidth="3.2" />
      <rect x="96" y="180" width="9" height="14" rx="2" fill="#e8b47c" />
      <rect x="110" y="172" width="9" height="22" rx="2" fill="#c98a5a" />
      <rect x="124" y="164" width="9" height="30" rx="2" fill="#7a4f33" />
      <path d="M96 172 L112 162 L128 156 L142 160" fill="none" stroke="#3f8a5c" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  );
}
