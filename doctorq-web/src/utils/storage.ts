/**
 * Utility para gerenciar localStorage com chave e valor criptografados em base64
 * Todas as operações de storage passam por esta camada de abstração
 */

class Storage {
  /**
   * Codifica uma string para base64
   */
  private encode(value: string): string {
    try {
      return btoa(value);
    } catch (error) {
      console.error('Erro ao codificar para base64:', error);
      return value; // Fallback para valor original
    }
  }

  /**
   * Decodifica uma string de base64
   */
  private decode(value: string): string {
    try {
      return atob(value);
    } catch (error) {
      console.error('Erro ao decodificar de base64:', error);
      return value; // Fallback para valor original
    }
  }

  /**
   * Salva um item no localStorage com chave e valor criptografados
   */
  setItem(key: string, value: string): void {
    try {
      const encodedKey = this.encode(key);
      const encodedValue = this.encode(value);
      localStorage.setItem(encodedKey, encodedValue);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Recupera um item do localStorage decodificando chave e valor
   */
  getItem(key: string): string | null {
    try {
      const encodedKey = this.encode(key);
      const encodedValue = localStorage.getItem(encodedKey);

      if (encodedValue === null) {
        return null;
      }

      return this.decode(encodedValue);
    } catch (error) {
      console.error('Erro ao recuperar do localStorage:', error);
      return null;
    }
  }

  /**
   * Remove um item do localStorage usando a chave criptografada
   */
  removeItem(key: string): void {
    try {
      const encodedKey = this.encode(key);
      localStorage.removeItem(encodedKey);
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
    }
  }

  /**
   * Verifica se uma chave existe no localStorage
   */
  hasItem(key: string): boolean {
    try {
      const encodedKey = this.encode(key);
      return localStorage.getItem(encodedKey) !== null;
    } catch (error) {
      console.error('Erro ao verificar item no localStorage:', error);
      return false;
    }
  }

  /**
   * Limpa todos os itens do localStorage (cuidado!)
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }
}

// Exportar instância singleton
export const storage = new Storage();
