"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./card-theme.css";
import "./battle-feedback.css";
import "./battle-combat.css";
import "./command-ui.css";
import { AuthProvider } from "@/components/AuthProvider";
import I18nProvider from "@/components/I18nProvider";
import { PlayerProvider } from "@/components/command/PlayerProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <title>Fable Armageddon</title>
        <meta name="description" content="An epic trading card game" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <I18nProvider><PlayerProvider>{children}</PlayerProvider></I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
