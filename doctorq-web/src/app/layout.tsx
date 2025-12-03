import Providers from "@/components/providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"; // --- ADICIONADO ---
import "./globals.css";
import "./chrome-fixes.css"; // Chrome compatibility fixes
import MinimalLayout from "./layout/MinimalLayout";
// Import side-effect guard to prevent negative repeat crashes
import "@/lib/debug-repeat";
import { ServiceWorkerRegister } from "@/components/common/ServiceWorkerRegister";
import { GiseleChatWidget } from "@/components/chat/GiseleChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ",
  description: process.env.NEXT_PUBLIC_APP_TAGLINE || "Sua saúde em primeiro lugar!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      style={{ colorScheme: 'light only', backgroundColor: '#F0F7FF' }}
      className="light"
    >
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="theme-color" content="#F0F7FF" />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background-color: #F0F7FF !important; }
        `}} />
      </head>
      <body
        className={inter.className}
        suppressHydrationWarning
        style={{ backgroundColor: '#F0F7FF', colorScheme: 'light only' }}
      >
        <Providers>
          <MinimalLayout>{children}</MinimalLayout>
          {/* --- COMPONENTE TOAST PARA DA FEEDBACK DE VALOR COPIADO AO USUAÁRIO  --- */}
          <Toaster richColors position="bottom-right" />
          <ServiceWorkerRegister />
          {/* --- GISELE CHAT WIDGET - ASSISTENTE VIRTUAL --- */}
          <GiseleChatWidget />
        </Providers>
      </body>
    </html>
  );
}
