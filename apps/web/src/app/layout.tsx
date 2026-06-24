import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo'z Parking",
  description: "Pilotage software-only pour propriétaires-exploitants de parking.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
