"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthAccessModal } from "@/components/auth/AuthAccessModal";

interface BuscaInteligenteButtonProps {
  className?: string;
}

export function BuscaInteligenteButton({ className }: BuscaInteligenteButtonProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleClick = () => {
    // Verificar se usuário está autenticado
    if (status === "authenticated" && session) {
      // Usuário logado → redirecionar para busca inteligente
      router.push("/paciente/busca-inteligente");
    } else {
      // Usuário NÃO logado → mostrar modal de autenticação
      setShowAuthDialog(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    router.push("/paciente/busca-inteligente");
  };

  return (
    <>
      {/* Card de CTA para Busca Inteligente */}
      <Card className={`border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg hover:shadow-xl transition-all ${className}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Ícone */}
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Texto */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Busca Inteligente com IA Gisele
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                Deixe nossa IA encontrar os profissionais <strong>perfeitos</strong> para suas necessidades
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 justify-center md:justify-start">
                <span className="bg-white px-2 py-1 rounded-full">✨ Matching Inteligente</span>
                <span className="bg-white px-2 py-1 rounded-full">🎯 Personalizado</span>
                <span className="bg-white px-2 py-1 rounded-full">⚡ Rápido</span>
              </div>
            </div>

            {/* Botão */}
            <div className="flex-shrink-0">
              <Button
                onClick={handleClick}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Começar Busca Inteligente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Autenticação */}
      <AuthAccessModal
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        initialMode="login"
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
