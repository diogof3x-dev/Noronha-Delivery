import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Noronha Delivery — aqui você tem Tudo",
    template: "%s · Noronha Delivery",
  },
  description:
    "O super app de Fernando de Noronha. Delivery, transporte, passeios, hospedagem, aluguel, clima e mais — tudo num lugar só.",
  keywords: [
    "Fernando de Noronha",
    "delivery noronha",
    "uber noronha",
    "passeios noronha",
    "hospedagem noronha",
    "clima noronha",
    "aluguel buggy noronha",
  ],
  openGraph: {
    title: "Noronha Delivery — aqui você tem Tudo",
    description:
      "O super app de Fernando de Noronha. Delivery, transporte, passeios, hospedagem, aluguel, clima e mais.",
    locale: "pt_BR",
    type: "website",
    url: "https://noronhadelivery.com",
    siteName: "Noronha Delivery",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Baía dos Porcos e Morro Dois Irmãos — Fernando de Noronha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noronha Delivery — aqui você tem Tudo",
    description: "O super app de Fernando de Noronha.",
    images: ["/og-image.jpg"],
  },
  metadataBase: new URL("https://noronhadelivery.com"),
  manifest: "/manifest.webmanifest",
  themeColor: "#0B7FA8",
  appleWebApp: {
    capable: true,
    title: "Noronha",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
