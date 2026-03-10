import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ScrollToTopOnRouteChange from "@/components/ScrollToTopOnRouteChange";
import ConnectivityMode from "@/components/ConnectivityMode";
import OrientationController from "@/components/OrientationController";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://keepcheck.vercel.app/";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "KeepCheck",
  description: "Track and manage business checks",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    title: "KeepCheck",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <ServiceWorkerRegistration />
        <ScrollToTopOnRouteChange />
        <ConnectivityMode />
        <OrientationController />
        {children}
      </body>
    </html>
  );
}
