// src/hooks/useLocalStorage.ts
import { useState } from 'react';

/**
 * Hook personalizado para gerenciar localStorage de forma segura
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial se não houver valor salvo
 * @returns [value, setValue] - Valor atual e função para atualizar
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Inicialização lazy para evitar problemas de SSR
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Validar se é do tipo esperado
        if (Array.isArray(initialValue) && !Array.isArray(parsed)) {
          console.warn(`Valor inválido no localStorage para ${key}, usando valor inicial`);
          return initialValue;
        }
        return parsed;
      }
    } catch (error) {
      console.warn(`Erro ao carregar ${key} do localStorage:`, error);
    }
    
    return initialValue;
  });

  // Não precisa mais do useEffect para carregar, isso é feito na inicialização lazy

  // Função para salvar valor
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Erro ao salvar ${key} no localStorage:`, error);
      // Ainda atualiza o estado mesmo se não conseguir salvar
      setStoredValue(value);
    }
  };

  return [storedValue, setValue];
}
