// src/hooks/use-embedding-credential.ts
"use client";

import { useState, useEffect } from "react";

interface Credencial {
  id_credencial: string;
  nome: string;
  nome_credencial: string;
}

export function useEmbeddingCredential() {
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmbeddingCredential() {
      try {
        setLoading(true);
        setError(null);

        // Buscar credenciais do tipo Embedding
        const response = await fetch(`/api/credenciais?page=1&size=100`);

        if (!response.ok) {
          throw new Error("Erro ao buscar credenciais");
        }

        const data = await response.json();
        // A API retorna credenciais dentro de um objeto credenciais ou data
        const credenciais: Credencial[] =
          data.credenciais || data.data || [];

        console.log(
          `🔍 Total de credenciais encontradas: ${credenciais.length}`
        );

        // Buscar credencial com nome_credencial = "azureOpenIaEmbbedApi"
        const embeddingCredential = credenciais.find(
          (cred) => cred.nome_credencial === "azureOpenIaEmbbedApi"
        );

        if (embeddingCredential) {
          setCredentialId(embeddingCredential.id_credencial);
          console.log(
            `✅ Credencial de embedding encontrada: ${embeddingCredential.nome} (${embeddingCredential.id_credencial})`
          );
        } else {
          console.warn("⚠️  Nenhuma credencial de embedding encontrada");
          setError("Credencial de embedding não encontrada");
        }
      } catch (err) {
        console.error("❌ Erro ao buscar credencial de embedding:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchEmbeddingCredential();
  }, []);

  return { credentialId, loading, error };
}
