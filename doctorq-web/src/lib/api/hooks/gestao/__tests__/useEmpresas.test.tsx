/**
 * Unit Tests - useEmpresas Hook
 *
 * Testa o hook específico de Empresas que usa o factory pattern.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import {
  useEmpresas,
  useEmpresa,
  useCreateEmpresa,
  useUpdateEmpresa,
  useDeleteEmpresa,
} from '../useEmpresas';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe('useEmpresas Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useEmpresas - Lista', () => {
    it('deve buscar lista de empresas', async () => {
      const mockEmpresas = {
        items: [
          {
            id_empresa: '1',
            nm_razao_social: 'Empresa Teste 1',
            nm_fantasia: 'Teste 1',
            nr_cnpj: '12345678000100',
            nm_plano: 'premium',
            fl_ativa: true,
          },
          {
            id_empresa: '2',
            nm_razao_social: 'Empresa Teste 2',
            nm_fantasia: 'Teste 2',
            nr_cnpj: '98765432000100',
            nm_plano: 'basic',
            fl_ativa: true,
          },
        ],
        meta: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmpresas,
      } as Response);

      const { result } = renderHook(
        () => useEmpresas({ page: 1, size: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].nm_razao_social).toBe('Empresa Teste 1');
      expect(result.current.meta.totalItems).toBe(2);
    });

    it('deve aplicar filtros de busca', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          meta: { totalItems: 0, totalPages: 0, currentPage: 1 },
        }),
      } as Response);

      renderHook(
        () => useEmpresas({ busca: 'Teste', plano: 'premium' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('busca=Teste');
      expect(callUrl).toContain('plano=premium');
    });

    it('deve aplicar filtro de status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          meta: { totalItems: 0, totalPages: 0, currentPage: 1 },
        }),
      } as Response);

      renderHook(
        () => useEmpresas({ fl_ativa: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('fl_ativa=false');
    });
  });

  describe('useEmpresa - Item Único', () => {
    it('deve buscar empresa específica', async () => {
      const mockEmpresa = {
        id_empresa: '123',
        nm_razao_social: 'Empresa Específica',
        nm_fantasia: 'Específica',
        nr_cnpj: '12345678000100',
        nm_plano: 'premium',
        fl_ativa: true,
        ds_endereco: 'Rua Teste, 123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmpresa,
      } as Response);

      const { result } = renderHook(
        () => useEmpresa('123'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.id_empresa).toBe('123');
      expect(result.current.isError).toBe(false);
    });

    it('deve lidar com erro ao buscar empresa', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(
        () => useEmpresa('999'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useCreateEmpresa - Mutation', () => {
    it('deve criar empresa com sucesso', async () => {
      const novaEmpresa = {
        nm_razao_social: 'Empresa Nova Ltda',
        nr_cnpj: '11111111000111',
        nm_plano: 'premium',
      };

      const mockResponse = {
        id_empresa: '123',
        ...novaEmpresa,
        fl_ativa: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(
        () => useCreateEmpresa(),
        { wrapper }
      );

      const response = await result.current.trigger(novaEmpresa);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/empresas/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(novaEmpresa),
        })
      );
    });
  });

  describe('useUpdateEmpresa - Mutation', () => {
    it('deve atualizar empresa', async () => {
      const updateData = {
        nm_fantasia: 'Empresa Atualizada',
        nm_plano: 'enterprise',
      };

      const updatedEmpresa = {
        id_empresa: '123',
        nm_razao_social: 'Empresa Teste',
        ...updateData,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedEmpresa,
      } as Response);

      const { result } = renderHook(
        () => useUpdateEmpresa('123'),
        { wrapper }
      );

      const response = await result.current.trigger(updateData);

      expect(response).toEqual(updatedEmpresa);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/empresas/123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('useDeleteEmpresa - Mutation', () => {
    it('deve deletar empresa com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(
        () => useDeleteEmpresa('123'),
        { wrapper }
      );

      await result.current.trigger(undefined);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/empresas/123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('deve rejeitar se empresa não existir', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Empresa não encontrada' }),
      } as Response);

      const { result } = renderHook(
        () => useDeleteEmpresa('999'),
        { wrapper }
      );

      await expect(result.current.trigger(undefined)).rejects.toThrow();
    });
  });

  describe('Fluxo Completo - CRUD', () => {
    it('deve executar CRUD completo', async () => {
      // 1. CREATE
      const newEmpresa = {
        nm_razao_social: 'Test CRUD Ltda',
        nr_cnpj: '22222222000122',
        nm_plano: 'premium',
      };

      const created = { id_empresa: 'crud-1', ...newEmpresa, fl_ativa: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => created,
      } as Response);

      const { result: createResult } = renderHook(
        () => useCreateEmpresa(),
        { wrapper }
      );

      const createdEmpresa = await createResult.current.trigger(newEmpresa);
      expect(createdEmpresa.id_empresa).toBe('crud-1');

      // 2. READ
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => created,
      } as Response);

      const { result: readResult } = renderHook(
        () => useEmpresa('crud-1'),
        { wrapper }
      );

      await waitFor(() => {
        expect(readResult.current.data?.id_empresa).toBe('crud-1');
      });

      // 3. UPDATE
      const updated = { ...created, nm_fantasia: 'Updated Name' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updated,
      } as Response);

      const { result: updateResult } = renderHook(
        () => useUpdateEmpresa('crud-1'),
        { wrapper }
      );

      const updatedEmpresa = await updateResult.current.trigger({ nm_fantasia: 'Updated Name' });
      expect(updatedEmpresa.nm_fantasia).toBe('Updated Name');

      // 4. DELETE
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result: deleteResult } = renderHook(
        () => useDeleteEmpresa('crud-1'),
        { wrapper }
      );

      await deleteResult.current.trigger(undefined);

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/empresas/crud-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
