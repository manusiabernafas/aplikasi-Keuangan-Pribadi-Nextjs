import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const heading = Outfit({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const body = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Boma — Atur uang jadi tenang", template: "%s · Boma" },
  description:
    "Boma membantu kamu mencatat pemasukan dan pengeluaran, membuat anggaran bulanan, menabung untuk target, dan mengatur keuangan bersama pasangan.",
};

export const viewport: Viewport = { themeColor: "#fbf6f0" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${heading.variable} ${body.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
