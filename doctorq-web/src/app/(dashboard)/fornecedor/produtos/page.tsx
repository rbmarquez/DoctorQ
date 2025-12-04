"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

export default function Fornecedor_ProdutosPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Produtos</h1>
            <p className="text-gray-600 mt-1">Gerencie o catálogo de produtos</p>
          </div>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600">
            <Plus className="h-5 w-5 mr-2" />
            Novo Produto
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Módulo de produtos em desenvolvimento</p>
        </Card>
      </div>
    </div>
  );
}
