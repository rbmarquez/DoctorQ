// provider/providers.tsx

"use client";

import { AgentProvider } from "@/app/contexts/AgentContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { ChatInitialProvider } from "@/app/contexts/ChatInitialContext";
import { MarketplaceProvider } from "@/app/contexts/MarketplaceContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { UserTypeProvider } from "@/contexts/UserTypeContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SessionProvider } from "next-auth/react";
import { AuthTokenSync } from "@/components/AuthTokenSync";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

function CoreProviders({ children }: ProvidersProps) {
  return (
    <SessionProvider
      refetchInterval={30 * 60} // 30 minutos (reduzido de 10)
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {/* Sincronizar token JWT da sessão com apiClient */}
      <AuthTokenSync />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

function FeatureProviders({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <UserTypeProvider>
        <AgentProvider>
          <MarketplaceProvider>
            <BookingProvider>
              <ChatInitialProvider>{children}</ChatInitialProvider>
            </BookingProvider>
          </MarketplaceProvider>
        </AgentProvider>
      </UserTypeProvider>
    </AuthProvider>
  );
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CoreProviders>
      <FeatureProviders>{children}</FeatureProviders>
    </CoreProviders>
  );
}

export { CoreProviders, FeatureProviders };
