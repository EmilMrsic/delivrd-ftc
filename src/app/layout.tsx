import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

import FcmTokenProvider from "@/components/FcmTokenProvider";
import { ReduxProvider } from "./redux/provider";
import Script from "next/script";
import { ContextProviders } from "@/components/context-providers";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoutes/ProtectedRoute";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Delivrd",
  description: "Vehicle bidding app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          strategy="lazyOnload"
          src="https://tools.luckyorange.com/core/lo.js?site-id=f5c07028"
        />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProviders>
          <ProtectedRoute>
            <FcmTokenProvider />
            <Toaster />
            {children}
          </ProtectedRoute>
        </ContextProviders>
      </body>
      <GoogleAnalytics gaId="G-C8BHC9K2PS" />
    </html>
  );
}
