"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Key } from "lucide-react";
import type { Agente } from "@/types/agentes";

interface ApiKey {
  id: string;
  keyName: string;
  apiKey: string;
  updatedDate: string;
}

interface AgentApiUrlProps {
  agente: Agente;
  onApiKeyChange?: (apiKeyId: string) => void;
  isOpen?: boolean;
}

export function AgentApiUrl({ agente, onApiKeyChange, isOpen }: AgentApiUrlProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [selectedKeyFull, setSelectedKeyFull] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/v1/predictions/${agente.id_agente}`;

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await fetch('/api/apikeys');
        if (response.ok) {
          const keys = await response.json();
          setApiKeys(keys);

          // Selecionar a primeira API key disponível se houver
          if (keys.length > 0) {
            setSelectedApiKey(keys[0].id);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar API keys:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  const handleApiKeyChange = (newApiKeyId: string) => {
    setSelectedApiKey(newApiKeyId);
    if (onApiKeyChange) {
      onApiKeyChange(newApiKeyId);
    }
  };

  const resetToAgentApiKey = () => {
    // Reset para a primeira API key disponível
    if (apiKeys.length > 0) {
      setSelectedApiKey(apiKeys[0].id);
    }
  };

  useEffect(() => {
    if (apiKeys.length > 0) {
      resetToAgentApiKey();
    }
  }, [apiKeys]);

  useEffect(() => {
    if (isOpen && apiKeys.length > 0) {
      resetToAgentApiKey();
    }
  }, [isOpen, apiKeys]);

  useEffect(() => {
    const fetchFullApiKey = async () => {
      if (!selectedApiKey) {
        setSelectedKeyFull(null);
        return;
      }

      try {
        const response = await fetch(`/api/apikeys/${selectedApiKey}`);

        if (response.ok) {
          const fullKey = await response.json();
          setSelectedKeyFull(fullKey);
        }
      } catch (error) {
        console.error('Erro ao carregar API key completa:', error);
      }
    };

    fetchFullApiKey();
  }, [selectedApiKey]);

  const postBody = {
    "message": "Olá, como vai você?",
    "user_id": "string",
    "user_name": "João",
    "user_email": "joao@example.com",
    "user_login": "joao",
    "conversation_token": "",
    "filter_sources": []
  };

  const javascriptCode = `const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"${selectedKeyFull ? `,
    "Authorization": "Bearer ${selectedKeyFull.apiKey}"` : ''}
  },
  body: JSON.stringify(${JSON.stringify(postBody, null, 4)})
});

const data = await response.json();
console.log(data);`;

  const curlCode = `curl ${apiUrl} \\
  -X POST \\
  -H "Content-Type: application/json"${selectedKeyFull ? ` \\
  -H "Authorization: Bearer ${selectedKeyFull.apiKey}"` : ''} \\
  -d '${JSON.stringify(postBody)}'`;

  const copyToClipboard = async (text: string, tab: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <Tabs defaultValue="javascript" className="w-full">
        <div className="flex items-center gap-4 mb-4 sticky top-0 bg-background z-10 pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedApiKey} onValueChange={handleApiKeyChange} disabled={loading}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={loading ? "Carregando..." : "Selecionar API Key"} />
              </SelectTrigger>
              <SelectContent>
                {apiKeys.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.keyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="javascript" className="mt-4">
          <Card className="min-h-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">JavaScript</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(javascriptCode, 'javascript')}
                  className="h-8 px-3"
                >
                  {copiedTab === 'javascript' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="relative">
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                  <code>{javascriptCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curl" className="mt-4">
          <Card className="min-h-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">cURL</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(curlCode, 'curl')}
                  className="h-8 px-3"
                >
                  {copiedTab === 'curl' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="relative">
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                  <code>{curlCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
