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
        <script src="https://accounts.google.com/gsi/client" async defer></script>
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