import { getProdutos } from '@/lib/api/server';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { ProdutosList } from './_components/ProdutosList';

export const metadata = { title: 'Produtos | DoctorQ Admin', description: 'Catálogo de produtos do marketplace' };

export default async function ProdutosPage({ searchParams }: { searchParams: { page?: string; busca?: string; em_promocao?: string } }) {
  const { items, meta } = await getProdutos({
    page: parseInt(searchParams.page || '1'),
    size: 20,
    busca: searchParams.busca,
    em_promocao: searchParams.em_promocao === 'true',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Produtos" description="Gerencie o catálogo do marketplace" action={{ label: 'Novo Produto', href: '/admin/marketplace/produtos/novo' }} />
        <ProdutosList initialProdutos={items} initialMeta={meta} />
      </div>
    </div>
  );
}
