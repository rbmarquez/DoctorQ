'use client';

import { useState } from 'react';
import { useFotos, useAlbuns } from '@/lib/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Upload, Trash2, Eye, Plus, Folder } from 'lucide-react';
import { toast } from 'sonner';

export function FotosGallery({ id_paciente }: { id_paciente: string }) {
  const [tipoFiltro, setTipoFiltro] = useState<'todas' | 'antes' | 'depois' | 'durante' | 'resultado'>('todas');
  const [albumSelecionado, setAlbumSelecionado] = useState<string | undefined>();

  const { data: fotos, isLoading: loadingFotos, mutate } = useFotos({
    id_paciente,
    ds_tipo: tipoFiltro === 'todas' ? undefined : tipoFiltro,
    id_album: albumSelecionado,
  });

  const { data: albuns, isLoading: loadingAlbuns } = useAlbuns(id_paciente);

  const handleDelete = async (id_foto: string) => {
    if (!confirm('Deseja realmente excluir esta foto?')) return;

    try {
      // Usar API diretamente em vez de hook dentro de callback
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/fotos/${id_foto}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao excluir foto');

      toast.success('Foto excluída com sucesso');
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir foto');
    }
  };

  if (loadingFotos || loadingAlbuns) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Álbuns */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro por Tipo */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Foto</label>
            <Tabs value={tipoFiltro} onValueChange={(v: any) => setTipoFiltro(v)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="antes">Antes</TabsTrigger>
                <TabsTrigger value="depois">Depois</TabsTrigger>
                <TabsTrigger value="durante">Durante</TabsTrigger>
                <TabsTrigger value="resultado">Resultado</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filtro por Álbum */}
          {albuns && albuns.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Álbum</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!albumSelecionado ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlbumSelecionado(undefined)}
                >
                  Todos
                </Button>
                {albuns.map((album) => (
                  <Button
                    key={album.id_album}
                    variant={albumSelecionado === album.id_album ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAlbumSelecionado(album.id_album)}
                  >
                    <Folder className="w-4 h-4 mr-1" />
                    {album.nm_album} ({album.nr_total_fotos})
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Fotos */}
      {fotos && fotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map((foto) => (
            <Card key={foto.id_foto} className="group overflow-hidden hover:shadow-lg transition-all">
              <div className="relative aspect-square">
                <img
                  src={foto.ds_url_foto}
                  alt={foto.nm_titulo || 'Foto'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" className="bg-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(foto.id_foto)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Badge
                  className="absolute top-2 right-2"
                  variant={
                    foto.ds_tipo === 'antes'
                      ? 'secondary'
                      : foto.ds_tipo === 'depois'
                      ? 'default'
                      : 'outline'
                  }
                >
                  {foto.ds_tipo}
                </Badge>
              </div>
              {(foto.nm_titulo || foto.ds_descricao) && (
                <CardContent className="p-3">
                  {foto.nm_titulo && (
                    <h4 className="font-semibold text-sm text-gray-900 truncate">{foto.nm_titulo}</h4>
                  )}
                  {foto.ds_descricao && (
                    <p className="text-xs text-gray-600 truncate mt-1">{foto.ds_descricao}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(foto.dt_foto).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Nenhuma foto encontrada</h3>
            <p className="text-gray-600 mt-2">
              {tipoFiltro === 'todas'
                ? 'Faça upload da sua primeira foto para começar.'
                : `Nenhuma foto do tipo "${tipoFiltro}" encontrada.`}
            </p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
