import {
  ArrowLeftRight, CalendarClock, ChartPie, Crown, LayoutDashboard, PiggyBank, Settings, Tags, Target, Users, Wallet, type LucideIcon,
} from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon; premium?: boolean }[] = [
  { href: "/dasbor", label: "Dasbor", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/anggaran", label: "Anggaran", icon: PiggyBank },
  { href: "/tabungan", label: "Tabungan", icon: Target },
  { href: "/tagihan", label: "Tagihan", icon: CalendarClock, premium: true },
  { href: "/laporan", label: "Laporan", icon: ChartPie },
  { href: "/dompet", label: "Dompet", icon: Wallet },
  { href: "/kategori", label: "Kategori", icon: Tags },
  { href: "/pasangan", label: "Pasangan", icon: Users, premium: true },
];
export const NAV_BOTTOM = [
  { href: "/langganan", label: "Langganan", icon: Crown },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

