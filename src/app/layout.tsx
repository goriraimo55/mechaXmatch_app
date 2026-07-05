import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/game";
import { AppNav } from "@/components/app-nav";
import { CelebrationOverlay } from "@/components/celebration";

export const metadata: Metadata = {
  title: "MechaXMatch — 高専生の技術者ギルド",
  description:
    "企業の小さな技術課題を、高専生の成長クエストに変える学習・仕事マッチングアプリ(プロトタイプ)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <GameProvider>
          <AppNav />
          <main className="lg:ml-60">
            <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</div>
          </main>
          <CelebrationOverlay />
        </GameProvider>
      </body>
    </html>
  );
}
