import type { Metadata, Viewport } from "next";
import { Rajdhani, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/auth-context";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-machinic",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DRONE PILOT | Flight Telemetry & Simulation",
  description: "Next-generation interactive drone simulation, digital twin telemetry, and flight training platform.",
  icons: {
    icon: "/drone-icon.png",
    apple: "/drone-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF5500",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${rajdhani.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-white text-neutral-900 antialiased selection:bg-[#FF5500] selection:text-white`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
