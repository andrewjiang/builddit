import { Inter } from "next/font/google";
import "./globals.css";
import "@farcaster/auth-kit/styles.css";
import { Providers } from "@/components/Providers";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SomeoneBuild.Fun",
  description: "Explore and fulfill requests in /someone-build",
  metadataBase: new URL("https://someonebuild.fun"),
  openGraph: {
    title: "SomeoneBuild.Fun",
    description: "Explore and fulfill requests in /someone-build",
    url: "https://someonebuild.fun",
    siteName: "SomeoneBuild.Fun",
    images: [
      {
        url: "/images/original.jpg",
        width: 1200,
        height: 630,
        alt: "SomeoneBuild.Fun",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SomeoneBuild.Fun",
    description: "Explore and fulfill requests in /someone-build",
    images: ["/images/original.jpg"],
    creator: "@ok",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon.ico", sizes: "any" },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-oid="-c7jvc_">
      <body className={inter.className} data-oid="czgqetj">
        <Providers data-oid="foq03zf">{children}</Providers>
      </body>
    </html>
  );
}
