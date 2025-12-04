/**
 * Unit Tests - Factory Hooks (useQuery, useQuerySingle, useMutation)
 *
 * Testa os hooks base que são usados por todos os outros hooks do sistema.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useQuery, useQuerySingle, useMutation } from '../factory';

// Mock do fetch global
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Wrapper com SWRConfig para testes
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe('Factory Hooks - useQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar dados corretamente', async () => {
    const mockData = {
      items: [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ],
      meta: {
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useQuery({ endpoint: '/test', params: {} }),
      { wrapper }
    );

    // Inicialmente deve estar loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);

    // Aguardar dados carregarem
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar dados
    expect(result.current.data).toEqual(mockData.items);
    expect(result.current.meta).toEqual(mockData.meta);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erros de API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(
      () => useQuery({ endpoint: '/test', params: {} }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toEqual([]);
  });

  it('deve respeitar o parâmetro enabled', async () => {
    const { result } = renderHook(
      () => useQuery({ endpoint: '/test', params: {}, enabled: false }),
      { wrapper }
    );

    // Não deve fazer chamada se enabled=false
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('deve incluir parâmetros na query string', async () => {
    const mockData = { items: [], meta: { totalItems: 0, totalPages: 0, currentPage: 1 } };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    renderHook(
      () =>
        useQuery({
          endpoint: '/test',
          params: { page: 2, size: 50, search: 'teste' },
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('page=2');
    expect(callUrl).toContain('size=50');
    expect(callUrl).toContain('search=teste');
  });

  it('deve fornecer função mutate para revalidação', async () => {
    const mockData = { items: [], meta: { totalItems: 0, totalPages: 0, currentPage: 1 } };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useQuery({ endpoint: '/test', params: {} }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // mutate deve existir e ser uma função
    expect(typeof result.current.mutate).toBe('function');

    // Chamar mutate deve revalidar
    const callCountBefore = mockFetch.mock.calls.length;
    await result.current.mutate();

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callCountBefore);
    });
  });
});

describe('Factory Hooks - useQuerySingle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar dado único corretamente', async () => {
    const mockData = { id: '1', name: 'Item Único' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useQuerySingle({ endpoint: '/test/1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erro em useQuerySingle', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(
      () => useQuerySingle({ endpoint: '/test/1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });
});

describe('Factory Hooks - useMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve executar POST com sucesso', async () => {
    const mockResponse = { id: '1', message: 'Criado' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(
      () => useMutation<{ id: string; message: string }, { name: string }>({
        method: 'POST',
        endpoint: '/test',
      }),
      { wrapper }
    );

    const response = await result.current.mutate({ name: 'Novo Item' });
    expect(response).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erros em mutations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    const { result } = renderHook(
      () => useMutation<{ id: string }, { name: string }>({
        method: 'POST',
        endpoint: '/test',
      }),
      { wrapper }
    );

    await expect(result.current.mutate({ name: 'Item' })).rejects.toBeTruthy();
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
