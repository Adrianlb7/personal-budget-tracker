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
  themeColor: "#f6f8f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var choice=localStorage.getItem('orba-appearance');var dark=choice==='dark'||(choice!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#11191b':'#f6f8f7'}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
