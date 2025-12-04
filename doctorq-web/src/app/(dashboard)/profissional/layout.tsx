"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    // Não verificar se já estiver na página de onboarding
    if (pathname?.includes("/onboarding")) {
      return;
    }

    if (user?.id) {
      checkAndRedirectOnboarding(user.id);
    }
  }, [user?.id, pathname]);

  const checkAndRedirectOnboarding = async (userId: string) => {
    // Verificar se o usuário pulou o onboarding
    const skipped = localStorage.getItem(`professional_onboarding_skipped_${userId}`);
    if (skipped) return;

    try {
      const response = await fetch(`/api/onboarding/dashboard/${userId}`);
      if (response.ok) {
        const data = await response.json();

        // Se o progresso for menor que 100% e não for a área de profissional, redirecionar
        if (data.progress && data.progress.nr_progress_percentage < 100) {
          router.push("/profissional/onboarding");
        }
      }
    } catch (error) {
      console.error("Erro ao verificar onboarding:", error);
      // Em caso de erro, assume que precisa fazer onboarding
      router.push("/profissional/onboarding");
    }
  };

  return <>{children}</>;
}
