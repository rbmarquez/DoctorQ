import { PageHeader } from '@/components/shared/layout/PageHeader';
import { ProdutosList } from './_components/ProdutosList';
import { getProdutos } from '@/lib/api/server';

export const metadata = {
  title: 'Produtos | DoctorQ Marketplace',
  description: 'Encontre os melhores produtos de estética e dermocosméticos',
};

interface ProdutosPageProps {
  searchParams: {
    page?: string;
    busca?: string;
    categoria?: string;
    promocao?: string;
  };
}

export default async function ProdutosMarketplacePage({ searchParams }: ProdutosPageProps) {
  const page = parseInt(searchParams.page || '1');
  const busca = searchParams.busca;
  const categoria = searchParams.categoria;
  const apenasPromocao = searchParams.promocao === 'true';

  // Buscar produtos da API
  const produtosData = await getProdutos({
    page,
    size: 24,
    busca,
    id_categoria: categoria,
    apenas_promocao: apenasPromocao,
  }).catch(() => ({
    items: [],
    meta: { page: 1, size: 24, total: 0, pages: 0 },
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Marketplace de Produtos" description="Dermocosméticos, equipamentos e produtos para estética" />
        <ProdutosList initialProdutos={produtosData.items} initialMeta={produtosData.meta} />
      </div>
    </div>
  );
}
