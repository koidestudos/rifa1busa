import type { Metadata, Viewport } from "next";
import { DM_Sans, Oswald } from "next/font/google";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
});

const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "Rifa Feira dos Países 2026 🇺🇸",
  description:
    "Rifa escolar da turma dos Estados Unidos na Feira dos Países 2026. Cada número custa R$ 5,00.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A3161",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${oswald.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
