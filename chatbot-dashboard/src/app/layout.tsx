// src/app/layout.tsx

import type { Metadata } from "next";
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
  title: "Aamy AI",
  description: "Automatiza tu negocio con Aamy.AI, tu asistente 24/7.",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f0a1e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <meta httpEquiv="content-language" content="es" />

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
