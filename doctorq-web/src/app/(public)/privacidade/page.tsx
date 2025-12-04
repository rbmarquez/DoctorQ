"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PrivacidadePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para /legal/privacidade
    router.replace("/legal/privacidade");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-600 font-medium text-lg">
          Redirecionando...
        </p>
      </div>
    </div>
  );
}
