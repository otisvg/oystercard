import type { Metadata, Viewport } from "next";
import { Amiri, Cormorant_Garamond } from "next/font/google";
import { Suspense } from "react";
import { AppNav, NavFallback } from "@/components/AppNav";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant" });
const arabic = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri" });

export const metadata: Metadata = {
  title: { default: "Suhba — company on the way to the masjid", template: "%s · Suhba" },
  description:
    "Suhba helps reverts and Muslims who find it hard to practise build consistency, and find a companion to go to the mosque with. UAE first.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eee4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1213" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${arabic.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<NavFallback />}>
          <AppNav />
        </Suspense>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 md:pb-16">{children}</main>
      </body>
    </html>
  );
}
