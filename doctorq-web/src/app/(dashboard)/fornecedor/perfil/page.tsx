"use client";

import { Card } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function Fornecedor_PerfilPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Minha Empresa</h1>
          <p className="text-gray-600 mt-1">Informações da empresa fornecedora</p>
        </div>
        
        <Card className="p-8 text-center">
          <Building className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Perfil da empresa em desenvolvimento</p>
        </Card>
      </div>
    </div>
  );
}
