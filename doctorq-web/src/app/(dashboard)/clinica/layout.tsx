"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ClinicaSidebar } from "@/components/clinica/ClinicaSidebar";
import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/guards";

export default function ClinicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (user?.id && pathname !== "/clinica/onboarding") {
      checkAndRedirectOnboarding(user.id);
    } else {
      setIsCheckingOnboarding(false);
    }
  }, [user?.id, pathname]);

  const checkAndRedirectOnboarding = async (userId: string) => {
    try {
      // Verificar se usuário pulou o onboarding
      const skipped = localStorage.getItem(`onboarding_skipped_${userId}`);
      if (skipped) {
        setIsCheckingOnboarding(false);
        return;
      }

      // Verificar status do onboarding no backend
      const response = await fetch(`/api/onboarding/dashboard/${userId}`);
      if (response.ok) {
        const data = await response.json();

        // Se não completou ainda (progress < 100%), redirecionar
        if (data.progress?.nr_progress_percentage < 100) {
          router.push("/clinica/onboarding");
          return;
        }
      }
    } catch (error) {
      console.error("Erro ao verificar onboarding:", error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando seu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard fallbackUrl="/clinica/dashboard">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex h-screen overflow-hidden">
          <ClinicaSidebar />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
