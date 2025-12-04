"use client";

import { Card } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function Fornecedor_PedidosPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">Gerencie os pedidos recebidos</p>
        </div>
        
        <Card className="p-8 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Módulo de pedidos em desenvolvimento</p>
        </Card>
      </div>
    </div>
  );
}
