import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Orba",
  title: {
    default: "Orba",
    template: "%s · Orba",
  },
  description: "A calm, personal dashboard for understanding your money.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Orba",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
