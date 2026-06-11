import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Prospecting AI",
  description: "Private lead discovery, ranking, and manual review workspace."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
