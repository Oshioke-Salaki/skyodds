import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ParticleConnectkit } from "@/components/connectkit";
import { Toaster } from "@/components/ui/sonner";
// import { ParticleAuthkit } from "@/components/Authkit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outcome - Flight Prediction Market",
  description: "Decentralized flight prediction market on Mantle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ParticleConnectkit>
            <Toaster />
            {children}
          </ParticleConnectkit>
        </Providers>
        {/* <ParticleAuthkit>{children}</ParticleAuthkit> */}
      </body>
    </html>
  );
}
