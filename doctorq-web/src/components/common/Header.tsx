// components/common/Header.tsx

"use client";

import { useOptimizedSession } from "@/hooks/useOptimizedSession";
import { MessageSquareIcon } from "lucide-react";
import { memo } from "react";

const Header = memo(() => {
  const { isAuthenticated, isLoading } = useOptimizedSession();

  // Evita o flash do menu enquanto o estado de autenticacao esta carregando
  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/95 shadow-sm backdrop-blur-sm px-3 dark:bg-white">
      <div className="flex h-16 items-center justify-between max-w-7xl mx-auto w-full text-slate-900">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ"}
          </h1>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
