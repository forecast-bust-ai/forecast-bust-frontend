import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forecast Bust AI • NCMRWF NWP Confidence Indicator",
  description: "AI-Based Medium-Range Weather Forecast Bust Detection & Spatial Synoptic Radar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#050914] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
