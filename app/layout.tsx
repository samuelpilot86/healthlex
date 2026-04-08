import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./components/LanguageProvider";

export const metadata: Metadata = {
  title: "HealthLex — HealthTech Regulatory Assistant",
  description:
    "Posez vos questions juridiques sur le RGPD, MDR, AI Act, NIS2, HDS… HealthLex vous répond en citant ses sources réglementaires.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
