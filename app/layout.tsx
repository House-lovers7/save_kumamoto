import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "くまもと いまどうするナビ",
  description:
    "困りごとから、熊本の公式な災害・生活支援情報へ30秒でたどり着くための案内です。",
  applicationName: "くまもと いまどうするナビ",
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#152d4a" },
    { media: "(prefers-color-scheme: dark)", color: "#0d141e" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
