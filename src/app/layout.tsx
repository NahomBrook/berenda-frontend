// src/app/layout.tsx
"use client"; // required for using components with hooks

import "../styles/globals.css";
import AIChatButton from "@/components/chat/AIChatButton";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          {children}
          {/* AI Chat Button - appears on every page */}
          <AIChatButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
