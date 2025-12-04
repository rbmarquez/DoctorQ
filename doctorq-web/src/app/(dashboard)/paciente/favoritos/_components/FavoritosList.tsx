'use client';

import { useFavoritos } from '@/lib/api/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function FavoritosList({ id_usuario }: { id_usuario: string }) {
  const { data: favoritos, isLoading, mutate } = useFavoritos({ id_user: id_usuario });

  const handleRemove = async (id_favorito: string) => {
    if (!confirm('Remover dos favoritos?')) return;

    try {
      // Usar API diretamente em vez de hook dentro de callback
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/favoritos/${id_favorito}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao remover favorito');

      toast.success('Removido dos favoritos');
      mutate();
    } catch (error: any) {
      toast.error('Erro ao remover favorito');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!favoritos || favoritos.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Nenhum favorito ainda</h3>
          <p className="text-gray-600 mt-2">
            Comece a favoritar procedimentos, produtos e profissionais.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {favoritos.map((fav) => (
        <Card key={fav.id_favorito} className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <Badge variant="outline">{fav.ds_tipo}</Badge>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemove(fav.id_favorito)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            {fav.ds_foto_url && (
              <img
                src={fav.ds_foto_url}
                alt={fav.nm_item}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
            )}
            <h3 className="font-semibold text-gray-900 mb-1">{fav.nm_item}</h3>
            {fav.ds_descricao && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{fav.ds_descricao}</p>
            )}
            {fav.vl_preco && (
              <p className="text-lg font-bold text-blue-600">R$ {fav.vl_preco.toFixed(2)}</p>
            )}
            <div className="mt-3 flex gap-2">
              {fav.ds_tipo === 'procedimento' && (
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Calendar className="w-4 h-4 mr-1" />
                  Agendar
                </Button>
              )}
              {fav.ds_tipo === 'produto' && (
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Comprar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
