// src/app/layout/MainLayout.tsx
"use client";

import HeaderMain from "@/components/common/HeaderMain";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import "@/lib/debug-repeat";
import CartSidebar from "@/components/marketplace/CartSidebar";
import FavoritesSidebar from "@/components/marketplace/FavoritesSidebar";
import ComparisonModal from "@/components/marketplace/ComparisonModal";
import { useUserType } from "@/contexts/UserTypeContext";
import { MarketplaceHighlights } from "@/components/marketplace/MarketplaceHighlights";
import { applyChromeRuntimeFixes } from "@/lib/chrome-runtime-fix";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutContent({
  children,
  isLoggedIn,
  showAdminUI,
}: {
  children: ReactNode;
  isLoggedIn: boolean;
  showAdminUI: boolean;
}) {
  const { open } = useSidebar();
  const { user } = useUserType();
  const isProfessional = user?.ds_tipo_usuario === "profissional";

  return (
    <div className="flex h-dvh flex-col bg-background">
      {showAdminUI && <HeaderMain />}
      <div className="flex flex-1 relative">
        {showAdminUI && <AppSidebar />}
        <SidebarInset className="flex-1" style={{
          marginLeft: showAdminUI ? (open ? 'var(--sidebar-width)' : '0') : '0',
          transition: 'margin-left 300ms'
        }}>
          <main className="flex-1 flex flex-col items-center mx-auto w-full overflow-auto">
            <div className="flex-1 flex flex-col w-full mx-auto p-2 pt-20 sm:pt-5 min-h-full">
              {showAdminUI && isProfessional && (
                <div className="mb-4 sm:mb-6">
                  <MarketplaceHighlights />
                </div>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      {/* Cart, Favorites, and Comparison */}
      {showAdminUI && (
        <>
          <CartSidebar />
          <FavoritesSidebar />
          <ComparisonModal />
        </>
      )}
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session, status } = useSession();
  const { role, isAuthenticated } = useAuth();
  const isLoggedIn = !!session && status === "authenticated";
  const isLoading = status === "loading";
  const normalizedRole = role?.toString().toLowerCase();
  const isAdminRole =
    normalizedRole === "admin" ||
    normalizedRole === "administrador" ||
    normalizedRole === "administrator" ||
    normalizedRole === "superadmin";
  const showAdminUI = isLoggedIn && isAuthenticated && isAdminRole;

  useEffect(() => {
    console.log("[MainLayout] verificação de acesso admin", {
      status,
      isLoggedIn,
      isAuthenticated,
      role,
      normalizedRole,
      isAdminRole,
      showAdminUI,
      sessionUser: session?.user,
    });
  }, [status, isLoggedIn, isAuthenticated, role, normalizedRole, isAdminRole, showAdminUI, session]);

  // Apply Chrome runtime fixes
  useEffect(() => {
    applyChromeRuntimeFixes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!showAdminUI) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider collapsible={true} defaultOpen={true}>
      <MainLayoutContent isLoggedIn={isLoggedIn} showAdminUI={showAdminUI}>
        {children}
      </MainLayoutContent>
    </SidebarProvider>
  );
}
