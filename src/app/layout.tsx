import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Duck | Premium Brand AI",
  description: "Generate and deconstruct brand assets with style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jakarta.variable} font-sans antialiased bg-black text-white min-h-screen overflow-x-hidden`}
      >
        {/* Subtle persistent gradient background */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,_#050505_0%,_#000000_100%)] opacity-50" />
        {children}
      </body>
    </html>
  );
}
