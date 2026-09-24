import type { Metadata } from "next";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "RAINCOR | India Rainfall Monitoring & Weather Intelligence",
  description:
    "India-focused operational rainfall forecasting and regime intelligence platform (NWP + AI + Regime Post-Processing + Adaptive Bias Correction)",
  keywords: [
    "Rainfall Forecasting",
    "India Weather Intelligence",
    "MoES",
    "NCMRWF",
    "IMD",
    "Monsoon Regime",
    "Bias Correction",
    "0.25 Degree Grid",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F3F8FC] text-[#0B2A4A] min-h-screen">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
