import SidebarWrapper from "../components/SidebarWrapper";
import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";
import "./globals.css";

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host-grotesk",
});

const SITE_NAME = "SPEUI Admin";
const SITE_DESCRIPTION =
  "Administrative Panel for SPE Student Chapter, University of Ibadan";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-icon.png",
        width: 512,
        height: 512,
        alt: "SPE University of Ibadan Admin",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og-icon.png"],
  },

  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hostGrotesk.variable} font-sans antialiased text-gray-900 bg-[#f8faff]`}>
        <SidebarWrapper>
          {children}
        </SidebarWrapper>
      </body>
    </html>
  );
}
