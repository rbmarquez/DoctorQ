"use client";

import React, { useState, useEffect } from "react";
import { useToolsCustom } from "@/hooks/useToolsCustom";
import { useCredenciais } from "@/hooks/useCredenciais";
import {
  Tool,
  ToolType,
  TOOL_TYPE_LABELS,
  getDefaultToolConfig,
  ApiToolConfig,
  RagQdrantConfig,
  RagPostgresConfig,
  McpToolConfig,
  GenericToolConfig,
} from "@/types/tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Eye, EyeOff, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ToolFormCompleteProps {
  tool?: Tool | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ToolFormComplete({ tool, onSuccess, onCancel }: ToolFormCompleteProps) {
  const { createTool, updateTool } = useToolsCustom();
  const { credenciais } = useCredenciais();

  // Estados do formulário
  const [nmTool, setNmTool] = useState("");
  const [dsTool, setDsTool] = useState("");
  const [tpTool, setTpTool] = useState<ToolType>(ToolType.API);
  const [fgAtivo, setFgAtivo] = useState(true);
  const [config, setConfig] = useState<GenericToolConfig>({});
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Inicializar form se estiver editando
  useEffect(() => {
    if (tool) {
      setNmTool(tool.nm_tool);
      setDsTool(tool.ds_tool || "");
      setTpTool(tool.tp_tool);
      setFgAtivo(tool.fg_ativo);
      setConfig(tool.ds_config || tool.config_tool || {});
    } else {
      // Novo tool - config padrão
      setConfig(getDefaultToolConfig(tpTool));
    }
  }, [tool]);

  // Atualizar config quando tipo mudar
  useEffect(() => {
    if (!tool) {
      setConfig(getDefaultToolConfig(tpTool));
    }
  }, [tpTool, tool]);

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nmTool.trim()) {
      toast.error("Nome da tool é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nm_tool: nmTool.trim(),
        ds_tool: dsTool.trim() || undefined,
        tp_tool: tpTool,
        ds_config: config,
        fg_ativo: fgAtivo,
      };

      if (tool) {
        await updateTool(tool.id_tool, payload);
        toast.success("Tool atualizada com sucesso");
      } else {
        await createTool(payload);
        toast.success("Tool criada com sucesso");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar tool");
    } finally {
      setLoading(false);
    }
  };

  // Renderizar campos específicos por tipo
  const renderConfigFields = () => {
    switch (tpTool) {
      case ToolType.API:
        return renderApiConfig();
      case ToolType.RAG_QDRANT:
        return renderRagQdrantConfig();
      case ToolType.RAG_POSTGRES:
        return renderRagPostgresConfig();
      case ToolType.MCP:
        return renderMcpConfig();
      case ToolType.FUNCTION:
      case ToolType.EXTERNAL:
      case ToolType.RAG:
      case ToolType.CUSTOM_INTERNA:
        return renderJsonConfig();
      default:
        return renderJsonConfig();
    }
  };

  // Config API
  const renderApiConfig = () => {
    const apiConfig = config as ApiToolConfig;
    const auth = apiConfig.auth || { type: "none" };
    const endpoint = apiConfig.endpoint || { url: "", method: "GET", headers: {}, timeout: 30, max_retries: 3 };

    return (
      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auth">Autenticação</TabsTrigger>
          <TabsTrigger value="endpoint">Endpoint</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autenticação da API</CardTitle>
              <CardDescription>Configure como autenticar na API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Autenticação</Label>
                <Select
                  value={auth.type || "none"}
                  onValueChange={(v) => setConfig({ ...config, auth: { ...auth, type: v as any } } as ApiToolConfig)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Autenticação</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {auth.type === "bearer" && (
                <div>
                  <Label>Bearer Token</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.bearer ? "text" : "password"}
                      value={auth.token || ""}
                      onChange={(e) => setConfig({ ...config, auth: { ...auth, token: e.target.value } } as ApiToolConfig)}
                      placeholder="token_secreto"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPasswords({ ...showPasswords, bearer: !showPasswords.bearer })}
                    >
                      {showPasswords.bearer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {auth.type === "basic" && (
                <>
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={auth.username || ""}
                      onChange={(e) => setConfig({ ...config, auth: { ...auth, username: e.target.value } } as ApiToolConfig)}
                      placeholder="usuario"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.basic ? "text" : "password"}
                        value={auth.password || ""}
                        onChange={(e) => setConfig({ ...config, auth: { ...auth, password: e.target.value } } as ApiToolConfig)}
                        placeholder="senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPasswords({ ...showPasswords, basic: !showPasswords.basic })}
                      >
                        {showPasswords.basic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {auth.type === "api_key" && (
                <>
                  <div>
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.apikey ? "text" : "password"}
                        value={auth.api_key || ""}
                        onChange={(e) => setConfig({ ...config, auth: { ...auth, api_key: e.target.value } } as ApiToolConfig)}
                        placeholder="sua_api_key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPasswords({ ...showPasswords, apikey: !showPasswords.apikey })}
                      >
                        {showPasswords.apikey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Nome do Header (Opcional)</Label>
                    <Input
                      value={auth.header_name || ""}
                      onChange={(e) => setConfig({ ...config, auth: { ...auth, header_name: e.target.value } } as ApiToolConfig)}
                      placeholder="X-API-Key"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Padrão: Authorization
                    </p>
                  </div>
                </>
              )}

              {auth.type === "oauth2" && (
                <>
                  <div>
                    <Label>Client ID</Label>
                    <Input
                      value={auth.client_id || ""}
                      onChange={(e) => setConfig({ ...config, auth: { ...auth, client_id: e.target.value } } as ApiToolConfig)}
                      placeholder="client_id"
                    />
                  </div>
                  <div>
                    <Label>Client Secret</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.oauth ? "text" : "password"}
                        value={auth.client_secret || ""}
                        onChange={(e) => setConfig({ ...config, auth: { ...auth, client_secret: e.target.value } } as ApiToolConfig)}
                        placeholder="client_secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPasswords({ ...showPasswords, oauth: !showPasswords.oauth })}
                      >
                        {showPasswords.oauth ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Endpoint</CardTitle>
              <CardDescription>URL e método HTTP da API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL do Endpoint</Label>
                <Input
                  value={endpoint.url || ""}
                  onChange={(e) => setConfig({ ...config, endpoint: { ...endpoint, url: e.target.value } } as ApiToolConfig)}
                  placeholder="https://api.exemplo.com/v1/recurso"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Método HTTP</Label>
                  <Select
                    value={endpoint.method || "GET"}
                    onValueChange={(v) => setConfig({ ...config, endpoint: { ...endpoint, method: v as any } } as ApiToolConfig)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeout (segundos)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="300"
                    value={endpoint.timeout || 30}
                    onChange={(e) => setConfig({ ...config, endpoint: { ...endpoint, timeout: Number(e.target.value) } } as ApiToolConfig)}
                  />
                </div>
              </div>
              <div>
                <Label>Máximo de Tentativas</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={endpoint.max_retries || 3}
                  onChange={(e) => setConfig({ ...config, endpoint: { ...endpoint, max_retries: Number(e.target.value) } } as ApiToolConfig)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="headers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Headers Customizados</CardTitle>
              <CardDescription>Headers adicionais a serem enviados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Formato JSON:</Label>
                <Textarea
                  rows={6}
                  value={JSON.stringify(endpoint.headers || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      setConfig({ ...config, endpoint: { ...endpoint, headers } } as ApiToolConfig);
                    } catch {}
                  }}
                  placeholder='{"Content-Type": "application/json", "X-Custom-Header": "value"}'
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  // Config RAG Qdrant
  const renderRagQdrantConfig = () => {
    const ragConfig = config as RagQdrantConfig;
    const qdrantCreds = credenciais.filter((c) => c.ds_provedor === "qdrant");
    const embeddingCreds = credenciais.filter((c) => c.ds_provedor === "azure_openai_embedding");

    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração RAG Qdrant</CardTitle>
          <CardDescription>Busca semântica com Qdrant Vector Database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome da Collection</Label>
            <Input
              value={ragConfig.collection_name || ""}
              onChange={(e) => setConfig({ ...config, collection_name: e.target.value } as RagQdrantConfig)}
              placeholder="documents"
            />
          </div>
          <div>
            <Label>Credencial Qdrant</Label>
            <Select
              value={ragConfig.qdrant_credential_id || ""}
              onValueChange={(v) => setConfig({ ...config, qdrant_credential_id: v } as RagQdrantConfig)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma credencial" />
              </SelectTrigger>
              <SelectContent>
                {qdrantCreds.map((cred) => (
                  <SelectItem key={cred.id_credencial} value={cred.id_credencial}>
                    {cred.nm_credencial} ({cred.ds_provedor})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Credencial Embedding (Azure OpenAI)</Label>
            <Select
              value={ragConfig.embedding_credential_id || ""}
              onValueChange={(v) => setConfig({ ...config, embedding_credential_id: v } as RagQdrantConfig)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma credencial" />
              </SelectTrigger>
              <SelectContent>
                {embeddingCreds.map((cred) => (
                  <SelectItem key={cred.id_credencial} value={cred.id_credencial}>
                    {cred.nm_credencial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Threshold de Similaridade (0-1)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={ragConfig.similarity_threshold || 0.7}
                onChange={(e) => setConfig({ ...config, similarity_threshold: Number(e.target.value) } as RagQdrantConfig)}
              />
            </div>
            <div>
              <Label>Máximo de Resultados</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={ragConfig.max_results || 5}
                onChange={(e) => setConfig({ ...config, max_results: Number(e.target.value) } as RagQdrantConfig)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Config RAG Postgres
  const renderRagPostgresConfig = () => {
    const ragConfig = config as RagPostgresConfig;
    const pgCreds = credenciais.filter((c) => c.ds_provedor === "postgresql");
    const embeddingCreds = credenciais.filter((c) => c.ds_provedor === "azure_openai_embedding");

    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração RAG PostgreSQL</CardTitle>
          <CardDescription>Busca semântica com pgvector</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Credencial PostgreSQL</Label>
            <Select
              value={ragConfig.postgresql_credential_id || ""}
              onValueChange={(v) => setConfig({ ...config, postgresql_credential_id: v } as RagPostgresConfig)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma credencial" />
              </SelectTrigger>
              <SelectContent>
                {pgCreds.map((cred) => (
                  <SelectItem key={cred.id_credencial} value={cred.id_credencial}>
                    {cred.nm_credencial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Namespace/Schema</Label>
            <Input
              value={ragConfig.namespace || "public"}
              onChange={(e) => setConfig({ ...config, namespace: e.target.value } as RagPostgresConfig)}
              placeholder="public"
            />
          </div>
          <div>
            <Label>Credencial Embedding (Azure OpenAI)</Label>
            <Select
              value={ragConfig.embedding_credential_id || ""}
              onValueChange={(v) => setConfig({ ...config, embedding_credential_id: v } as RagPostgresConfig)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma credencial" />
              </SelectTrigger>
              <SelectContent>
                {embeddingCreds.map((cred) => (
                  <SelectItem key={cred.id_credencial} value={cred.id_credencial}>
                    {cred.nm_credencial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Threshold de Similaridade (0-1)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={ragConfig.similarity_threshold || 0.7}
                onChange={(e) => setConfig({ ...config, similarity_threshold: Number(e.target.value) } as RagPostgresConfig)}
              />
            </div>
            <div>
              <Label>Máximo de Resultados</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={ragConfig.max_results || 5}
                onChange={(e) => setConfig({ ...config, max_results: Number(e.target.value) } as RagPostgresConfig)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Config MCP
  const renderMcpConfig = () => {
    const mcpConfig = config as McpToolConfig;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração MCP (Model Context Protocol)</CardTitle>
          <CardDescription>Integração com servidores MCP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Comando MCP</Label>
            <Select
              value={mcpConfig.command || ""}
              onValueChange={(v) => setConfig({ ...config, command: v } as McpToolConfig)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um comando" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="search">Search</SelectItem>
                <SelectItem value="generate_text">Generate Text</SelectItem>
                <SelectItem value="summarize">Summarize</SelectItem>
                <SelectItem value="database_query">Database Query</SelectItem>
                <SelectItem value="uvx">UVX</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Argumentos (JSON Array)</Label>
            <Textarea
              rows={3}
              value={JSON.stringify(mcpConfig.arguments || [], null, 2)}
              onChange={(e) => {
                try {
                  const args = JSON.parse(e.target.value);
                  setConfig({ ...config, arguments: args } as McpToolConfig);
                } catch {}
              }}
              placeholder='["arg1", "arg2"]'
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label>Capabilities (JSON Array)</Label>
            <Textarea
              rows={3}
              value={JSON.stringify(mcpConfig.capabilities || [], null, 2)}
              onChange={(e) => {
                try {
                  const caps = JSON.parse(e.target.value);
                  setConfig({ ...config, capabilities: caps } as McpToolConfig);
                } catch {}
              }}
              placeholder='["capability1", "capability2"]'
              className="font-mono text-sm"
            />
          </div>
          {mcpConfig.base_url !== undefined && (
            <div>
              <Label>Base URL (Opcional)</Label>
              <Input
                value={mcpConfig.base_url || ""}
                onChange={(e) => setConfig({ ...config, base_url: e.target.value } as McpToolConfig)}
                placeholder="https://mcp.exemplo.com"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Config JSON genérico
  const renderJsonConfig = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração JSON</CardTitle>
          <CardDescription>Configure a tool em formato JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={12}
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setConfig(parsed);
              } catch {}
            }}
            placeholder="{}"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Cole ou edite a configuração JSON da tool. Certifique-se de que o JSON seja válido.
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{tool ? "Editar Tool" : "Nova Tool"}</h2>
        <p className="text-sm text-muted-foreground">
          {tool ? "Atualize as informações da tool" : "Crie uma nova ferramenta para os agentes"}
        </p>
      </div>

      <Separator />

      {/* Campos Básicos */}
      <div className="space-y-4">
        <div>
          <Label>Nome da Tool</Label>
          <Input
            value={nmTool}
            onChange={(e) => setNmTool(e.target.value)}
            placeholder="Nome descritivo da tool"
            required
          />
        </div>

        <div>
          <Label>Descrição (Opcional)</Label>
          <Textarea
            value={dsTool}
            onChange={(e) => setDsTool(e.target.value)}
            placeholder="Descrição detalhada sobre o que a tool faz"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo de Tool</Label>
            <Select value={tpTool} onValueChange={(v) => setTpTool(v as ToolType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOOL_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="fg-ativo">Tool Ativa</Label>
            <Switch
              id="fg-ativo"
              checked={fgAtivo}
              onCheckedChange={setFgAtivo}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Configuração Específica */}
      {renderConfigFields()}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {tool ? "Atualizar Tool" : "Criar Tool"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
