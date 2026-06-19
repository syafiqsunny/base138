import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetaKuasa News Harvester",
  description: "Editorial review queue and political news monitoring dashboard."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
