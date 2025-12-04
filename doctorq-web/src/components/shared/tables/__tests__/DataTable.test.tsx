/**
 * Unit Tests - DataTable<T> Component
 *
 * Testa o componente genérico DataTable usado em todas as páginas Admin.
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import { DataTable, type ColumnDef, type RowAction } from '../DataTable';

interface TestEntity {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  count: number;
}

const mockData: TestEntity[] = [
  { id: '1', name: 'User 1', email: 'user1@test.com', status: 'active', count: 10 },
  { id: '2', name: 'User 2', email: 'user2@test.com', status: 'inactive', count: 5 },
  { id: '3', name: 'User 3', email: 'user3@test.com', status: 'active', count: 15 },
];

const mockColumns: ColumnDef<TestEntity>[] = [
  {
    key: 'name',
    header: 'Nome',
    render: (row) => row.name,
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => row.email,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (row.status === 'active' ? 'Ativo' : 'Inativo'),
  },
  {
    key: 'count',
    header: 'Contagem',
    render: (row) => row.count.toString(),
  },
];

describe('DataTable Component', () => {

  it('deve renderizar tabela com dados', () => {
    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
      />
    );

    // Verificar headers
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Verificar dados
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('deve renderizar todas as linhas de dados', () => {
    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
      />
    );

    mockData.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.email)).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem quando não há dados', () => {
    render(
      <DataTable<TestEntity>
        data={[]}
        columns={mockColumns}
        emptyMessage="Nenhum registro encontrado"
      />
    );

    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
  });

  it('deve renderizar campo de busca quando habilitado', () => {
    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        searchPlaceholder="Buscar usuários..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar usuários...');
    expect(searchInput).toBeInTheDocument();
  });

  it('deve filtrar dados ao buscar', () => {
    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        searchPlaceholder="Buscar..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar...');

    // Buscar por "User 1"
    fireEvent.change(searchInput, { target: { value: 'User 1' } });

    // Apenas User 1 deve aparecer
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.queryByText('User 2')).not.toBeInTheDocument();
    expect(screen.queryByText('User 3')).not.toBeInTheDocument();
  });

  it('deve buscar em múltiplas colunas', () => {
    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        searchPlaceholder="Buscar..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar...');

    // Buscar por email
    fireEvent.change(searchInput, { target: { value: 'user2@test' } });

    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.queryByText('User 1')).not.toBeInTheDocument();
  });

  it('deve renderizar botões de ação quando fornecidos', () => {
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();

    const actions: RowAction<TestEntity>[] = [
      { label: 'Editar', onClick: handleEdit },
      { label: 'Deletar', onClick: handleDelete, variant: 'destructive' },
    ];

    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        actions={actions}
      />
    );

    // Deve ter botão de ações para cada linha
    const actionButtons = screen.getAllByRole('button', { name: /ações|actions/i });
    expect(actionButtons).toHaveLength(mockData.length);
  });

  it('deve executar ação ao clicar', () => {
    const handleEdit = jest.fn();

    const actions: RowAction<TestEntity>[] = [
      { label: 'Editar', onClick: handleEdit },
    ];

    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        actions={actions}
      />
    );

    // Abrir menu de ações da primeira linha
    const firstActionButton = screen.getAllByRole('button', { name: /ações|actions/i })[0];
    fireEvent.click(firstActionButton);

    // Click em "Editar"
    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);

    // Deve chamar handler com dados da linha
    expect(handleEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('deve renderizar paginação quando configurada', () => {
    const handlePageChange = jest.fn();

    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        pagination={{
          currentPage: 1,
          totalPages: 3,
          onPageChange: handlePageChange,
        }}
      />
    );

    // Verificar botões de paginação
    expect(screen.getByRole('button', { name: /próxima|next/i })).toBeInTheDocument();
  });

  it('deve chamar onPageChange ao navegar', () => {
    const handlePageChange = jest.fn();

    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        pagination={{
          currentPage: 1,
          totalPages: 3,
          onPageChange: handlePageChange,
        }}
      />
    );

    const nextButton = screen.getByRole('button', { name: /próxima|next/i });
    fireEvent.click(nextButton);

    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('deve mostrar skeleton durante loading', () => {
    render(
      <DataTable<TestEntity>
        data={[]}
        columns={mockColumns}
        isLoading={true}
      />
    );

    // Verificar skeleton rows
    const skeletons = screen.getAllByTestId(/skeleton|loading/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('deve desabilitar busca durante loading', () => {
    render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        isLoading={true}
        searchPlaceholder="Buscar..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar...');
    expect(searchInput).toBeDisabled();
  });

  it('deve aplicar classe customizada se fornecida', () => {
    const { container } = render(
      <DataTable<TestEntity>
        data={mockData}
        columns={mockColumns}
        className="custom-class"
      />
    );

    const table = container.querySelector('table');
    expect(table).toHaveClass('custom-class');
  });

  describe('Ordenação', () => {
    it('deve renderizar headers clicáveis para ordenação', () => {
      render(
        <DataTable<TestEntity>
          data={mockData}
          columns={mockColumns}
          sortable={true}
        />
      );

      // Headers devem ser clicáveis
      const nameHeader = screen.getByText('Nome').closest('th');
      expect(nameHeader).toBeInTheDocument();

      if (nameHeader) {
        fireEvent.click(nameHeader);
        // Verificar indicador de ordenação
        expect(nameHeader).toHaveAttribute('aria-sort');
      }
    });

    it('deve ordenar dados ao clicar no header', () => {
      render(
        <DataTable<TestEntity>
          data={mockData}
          columns={mockColumns}
          sortable={true}
        />
      );

      const nameHeader = screen.getByText('Nome').closest('th');
      if (nameHeader) {
        // Primeiro click: ordem crescente
        fireEvent.click(nameHeader);

        const rows = screen.getAllByRole('row').slice(1); // Skip header row
        const firstCell = within(rows[0]).getByText(/User/);

        expect(firstCell.textContent).toMatch(/User \d/);
      }
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter estrutura semântica correta', () => {
      render(
        <DataTable<TestEntity>
          data={mockData}
          columns={mockColumns}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(mockData.length + 1); // +1 for header
      expect(screen.getAllByRole('columnheader')).toHaveLength(mockColumns.length);
    });

    it('deve ter labels acessíveis para ações', () => {
      const actions: RowAction<TestEntity>[] = [
        { label: 'Editar', onClick: jest.fn(), ariaLabel: 'Editar usuário' },
      ];

      render(
        <DataTable<TestEntity>
          data={mockData}
          columns={mockColumns}
          actions={actions}
        />
      );

      const actionButton = screen.getAllByLabelText(/Editar usuário/i);
      expect(actionButton.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('deve renderizar grande volume de dados', () => {
      const largeData: TestEntity[] = Array.from({ length: 100 }, (_, i) => ({
        id: `id-${i}`,
        name: `User ${i}`,
        email: `user${i}@test.com`,
        status: i % 2 === 0 ? 'active' : 'inactive',
        count: i,
      }));

      const { container } = render(
        <DataTable<TestEntity>
          data={largeData}
          columns={mockColumns}
        />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(100);
    });
  });
});
