import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ScrollToTopOnRouteChange from "@/components/ScrollToTopOnRouteChange";

const inferredRepoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const configuredBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (inferredRepoName ? `/${inferredRepoName}` : "");
const basePath =
  configuredBasePath === "/"
    ? ""
    : configuredBasePath.replace(/\/+$/, "");
const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://abdul-scripts.github.io";
const withBasePath = (path: string) => `${basePath}${path}`;
const canonicalBase = withBasePath("/") || "/";

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
  manifest: withBasePath("/manifest.webmanifest"),
  alternates: {
    canonical: canonicalBase.endsWith("/") ? canonicalBase : `${canonicalBase}/`,
  },
  appleWebApp: {
    capable: true,
    title: "KeepCheck",
    statusBarStyle: "default",
  },
  icons: {
    icon: withBasePath("/favicon.ico"),
    shortcut: withBasePath("/favicon.ico"),
    apple: withBasePath("/apple-touch-icon.png"),
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
        {children}
      </body>
    </html>
  );
}
