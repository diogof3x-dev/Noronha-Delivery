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
    url: "https://noronhadelivery.com.br",
    siteName: "Noronha Delivery",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noronha Delivery — aqui você tem Tudo",
    description: "O super app de Fernando de Noronha.",
  },
  metadataBase: new URL("https://noronhadelivery.com.br"),
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
