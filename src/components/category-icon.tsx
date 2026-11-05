import {
  Briefcase, Bus, Car, Circle, Coffee, Dumbbell, Gift, GraduationCap, HeartPulse, Home, Landmark, Laptop, PawPrint, Plane, Popcorn, Receipt,
  ShoppingBag, ShoppingCart, Shirt, Smartphone, Sparkles, Store, Target, TrendingUp, Utensils, Wallet, Wifi, Zap, Baby, Fuel, PiggyBank, CreditCard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, coffee: Coffee, bus: Bus, car: Car, fuel: Fuel, "shopping-bag": ShoppingBag, "shopping-cart": ShoppingCart, receipt: Receipt,
  home: Home, zap: Zap, wifi: Wifi, smartphone: Smartphone, "heart-pulse": HeartPulse, dumbbell: Dumbbell, popcorn: Popcorn, plane: Plane,
  "graduation-cap": GraduationCap, baby: Baby, "paw-print": PawPrint, shirt: Shirt, gift: Gift, briefcase: Briefcase, sparkles: Sparkles,
  store: Store, laptop: Laptop, "trending-up": TrendingUp, landmark: Landmark, wallet: Wallet, "piggy-bank": PiggyBank, "credit-card": CreditCard,
  target: Target, circle: Circle,
};
export const ICON_NAMES = Object.keys(ICONS);

export const COLORS = {
  caramel: "bg-caramel-soft text-[#9a5f22]",
  mocha: "bg-mocha-soft text-mocha",
  nose: "bg-nose-soft text-[#b4504a]",
  sky: "bg-sky-soft text-[#3d6e98]",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  latte: "bg-latte-2 text-muted",
} as const;
export type ColorName = keyof typeof COLORS;
export const COLOR_NAMES = Object.keys(COLORS) as ColorName[];
export const COLOR_SWATCH: Record<ColorName, string> = { caramel: "#d99b5b", mocha: "#7a4f33", nose: "#f0a8a4", sky: "#6f9fc7", income: "#3f8a5c", expense: "#c4553f", latte: "#ead8c6" };

export function CategoryIcon({ icon, color, className, size = "md" }: { icon: string; color: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const I = ICONS[icon] ?? Circle;
  const box = { sm: "size-8 rounded-lg", md: "size-10 rounded-xl", lg: "size-12 rounded-2xl" }[size];
  return (
    <span className={cn("grid shrink-0 place-items-center", box, COLORS[color as ColorName] ?? COLORS.latte, className)} aria-hidden>
      <I className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}
