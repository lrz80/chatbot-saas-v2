// src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClientWrapper from "./ClientWrapper";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import Script from "next/script"; // ✅ AÑADIR
import I18nProvider from "./I18nProvider";


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aamy.ai"),

  title: {
    default: "Aamy AI",
    template: "%s | Aamy AI"
  },

  description:
    "Automate your business with Aamy AI — the advanced conversational AI that handles WhatsApp, Instagram, Facebook, and voice interactions 24/7.",

  applicationName: "Aamy AI",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "https://www.aamy.ai",
    title: "Aamy AI — Advanced Conversational AI for Sales & Automation",
    description:
      "Automate WhatsApp, Instagram, Facebook, and voice channels with real conversational intelligence, intent detection, follow-ups, and real-time tracking.",
    siteName: "Aamy AI",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aamy AI — Conversational AI Automation",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Aamy AI — Conversational AI Automation",
    description:
      "Automate customer messages 24/7, detect buying intent, run follow-ups, and optimize ads with Pixel/CAPI.",
    images: ["/og-image.png"],
    creator: "@aamyai", // Optional — add only if you create a real Twitter/X handle
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0a1e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Facebook domain verification */}
        <meta
          name="facebook-domain-verification"
          content="yw55oh02053to5oxntgp0pvm19sw2z"
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ✅ META PIXEL (Script) */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2071845716992749');
            fbq('track', 'PageView');
          `}
        </Script>

        {/* ✅ META PIXEL (Noscript) */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2071845716992749&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <I18nProvider>
          <ConditionalNavbar />
          <ClientWrapper>{children}</ClientWrapper>
          <ToastContainer position="top-right" autoClose={3000} />
        </I18nProvider>
      </body>
    </html>
  );
}
