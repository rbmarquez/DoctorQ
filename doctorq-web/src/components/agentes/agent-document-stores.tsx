"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DocumentStore {
  id_documento_store: string;
  nm_documento_store: string;
  ds_documento_store: string;
  nm_status: string;
  nm_search_type?: string;
  dt_criacao: string;
}

interface AgentDocumentStoresProps {
  agentId: string;
}

export function AgentDocumentStores({ agentId }: AgentDocumentStoresProps) {
  const [documentStores, setDocumentStores] = useState<DocumentStore[]>([]);
  const [availableStores, setAvailableStores] = useState<DocumentStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("embedding");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDocumentStores();
  }, [agentId]);

  const loadDocumentStores = async () => {
    try {
      const response = await fetch(`/api/agentes/${agentId}/document-stores`);
      if (!response.ok) throw new Error("Erro ao carregar Document Stores");

      const data = await response.json();
      setDocumentStores(data.document_stores || []);
    } catch (error) {
      console.error("Erro ao carregar Document Stores:", error);
      toast.error("Não foi possível carregar os Document Stores vinculados");
    }
  };

  const loadAvailableStores = async () => {
    try {
      const response = await fetch("/api/document-stores");
      if (!response.ok) throw new Error("Erro ao carregar Document Stores disponíveis");

      const data = await response.json();
      const allStores = data.items || [];

      // Filtrar stores que já estão vinculados
      const linkedIds = documentStores.map(ds => ds.id_documento_store);
      const available = allStores.filter(
        (store: DocumentStore) => !linkedIds.includes(store.id_documento_store)
      );

      setAvailableStores(available);
    } catch (error) {
      console.error("Erro ao carregar Document Stores disponíveis:", error);
      toast.error("Não foi possível carregar os Document Stores disponíveis");
    }
  };

  const handleAddStore = async () => {
    if (!selectedStoreId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/agentes/${agentId}/document-stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_store_id: selectedStoreId,
          search_type: searchType
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao vincular Document Store");
      }

      toast.success("Document Store vinculado com sucesso");

      setDialogOpen(false);
      setSelectedStoreId("");
      setSearchType("embedding");
      await loadDocumentStores();
    } catch (error: any) {
      console.error("Erro ao vincular Document Store:", error);
      toast.error(error.message || "Não foi possível vincular o Document Store");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStore = async (storeId: string) => {
    if (!confirm("Tem certeza que deseja desvincular este Document Store?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/agentes/${agentId}/document-stores/${storeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao desvincular Document Store");
      }

      toast.success("Document Store desvinculado com sucesso");

      await loadDocumentStores();
    } catch (error: any) {
      console.error("Erro ao desvincular Document Store:", error);
      toast.error(error.message || "Não foi possível desvincular o Document Store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Document Stores (RAG)</CardTitle>
            <CardDescription>
              Bases de conhecimento vinculadas ao agente para consulta durante conversas
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) loadAvailableStores();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Vincular Document Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular Document Store</DialogTitle>
                <DialogDescription>
                  Selecione um Document Store para vincular ao agente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="document-store-select">Document Store</Label>
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger id="document-store-select">
                      <SelectValue placeholder="Selecione um Document Store" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStores.map((store) => (
                        <SelectItem key={store.id_documento_store} value={store.id_documento_store}>
                          {store.nm_documento_store}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Tipo de Busca</Label>
                  <RadioGroup value={searchType} onValueChange={setSearchType}>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="embedding" id="embedding" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="embedding" className="cursor-pointer font-medium">
                          Busca Semântica (Embedding)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Usa vetores de embeddings para busca por similaridade semântica
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="text" id="text" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="text" className="cursor-pointer font-medium">
                          Busca Textual (Conteúdo)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Busca por palavras-chave no conteúdo textual dos documentos
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddStore} disabled={!selectedStoreId || loading}>
                    {loading ? "Vinculando..." : "Vincular"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documentStores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum Document Store vinculado</p>
            <p className="text-sm">Vincule Document Stores para habilitar consulta RAG</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documentStores.map((store) => (
              <div
                key={store.id_documento_store}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">{store.nm_documento_store}</h4>
                    <Badge variant={store.nm_status === "active" ? "default" : "secondary"}>
                      {store.nm_status}
                    </Badge>
                    <Badge variant="outline">
                      {store.nm_search_type === "text" ? "Busca Textual" : "Busca Semântica"}
                    </Badge>
                  </div>
                  {store.ds_documento_store && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {store.ds_documento_store}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Criado em: {new Date(store.dt_criacao).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveStore(store.id_documento_store)}
                  disabled={loading}
                  className="ml-4"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
