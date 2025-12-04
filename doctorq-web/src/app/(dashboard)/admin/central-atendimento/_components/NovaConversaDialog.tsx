'use client';

import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, User, Phone, Mail, MessageSquare, Loader2 } from 'lucide-react';
import {
  ContatoOmni,
  CriarConversaDTO,
  CriarContatoDTO,
} from '@/lib/api/hooks/central-atendimento/useCentralAtendimento';

interface NovaConversaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contatos: ContatoOmni[];
  onCriarConversa: (dados: CriarConversaDTO) => Promise<void>;
  onCriarContato: (dados: CriarContatoDTO) => Promise<ContatoOmni>;
  onBuscarContatos: (termo: string) => Promise<{ items: ContatoOmni[]; total: number }>;
}

type CanalType = 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'email' | 'chat_web' | 'sms';

const CANAIS: { value: CanalType; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'chat_web', label: 'Chat Web' },
  { value: 'sms', label: 'SMS' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'telegram', label: 'Telegram' },
];

function NovaConversaDialogInner({
  open,
  onOpenChange,
  contatos,
  onCriarConversa,
  onCriarContato,
  onBuscarContatos,
}: NovaConversaDialogProps) {
  // Estado para busca e seleção
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ContatoOmni[]>([]);
  const [selectedContato, setSelectedContato] = useState<ContatoOmni | null>(null);
  const [canal, setCanal] = useState<CanalType>('whatsapp');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estado para novo contato
  const [novoContato, setNovoContato] = useState<CriarContatoDTO>({
    nm_contato: '',
    nr_telefone: '',
    nm_email: '',
  });

  // Tab ativa
  const [activeTab, setActiveTab] = useState<'existente' | 'novo'>('existente');

  // Refs para evitar re-renders infinitos
  const contatosRef = useRef(contatos);
  const onBuscarContatosRef = useRef(onBuscarContatos);

  // Atualizar refs quando props mudarem
  useEffect(() => {
    contatosRef.current = contatos;
    onBuscarContatosRef.current = onBuscarContatos;
  }, [contatos, onBuscarContatos]);

  // Inicializar lista quando dialog abre
  useEffect(() => {
    if (open && searchTerm.length < 2) {
      setSearchResults(contatosRef.current.slice(0, 20));
    }
  }, [open]);

  // Buscar contatos quando digita (com debounce)
  useEffect(() => {
    if (!open) return;

    if (searchTerm.length < 2) {
      setSearchResults(contatosRef.current.slice(0, 20));
      return;
    }

    setIsSearching(true);
    const debounce = setTimeout(async () => {
      try {
        const result = await onBuscarContatosRef.current(searchTerm);
        setSearchResults(result.items);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        // Fallback para busca local
        const filtered = contatosRef.current.filter(
          (c) =>
            c.nm_contato.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.nr_telefone?.includes(searchTerm) ||
            c.nm_email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, open]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedContato(null);
      setCanal('whatsapp');
      setNovoContato({ nm_contato: '', nr_telefone: '', nm_email: '' });
      setActiveTab('existente');
    }
  }, [open]);

  // Criar conversa com contato existente
  const handleCriarConversaExistente = useCallback(async () => {
    if (!selectedContato) return;

    setIsCreating(true);
    try {
      await onCriarConversa({
        id_contato: selectedContato.id_contato,
        tp_canal: canal,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    } finally {
      setIsCreating(false);
    }
  }, [selectedContato, canal, onCriarConversa, onOpenChange]);

  // Criar contato e conversa
  const handleCriarNovoContato = useCallback(async () => {
    if (!novoContato.nm_contato) return;

    setIsCreating(true);
    try {
      // Primeiro cria o contato
      const contato = await onCriarContato(novoContato);

      // Depois cria a conversa
      await onCriarConversa({
        id_contato: contato.id_contato,
        tp_canal: canal,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar contato/conversa:', error);
    } finally {
      setIsCreating(false);
    }
  }, [novoContato, canal, onCriarContato, onCriarConversa, onOpenChange]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cliente':
        return 'bg-green-100 text-green-700';
      case 'lead':
        return 'bg-blue-100 text-blue-700';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Nova Conversa
          </DialogTitle>
          <DialogDescription>
            Inicie uma nova conversa com um contato existente ou crie um novo contato.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'existente' | 'novo')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existente" className="gap-2">
              <User className="h-4 w-4" />
              Contato Existente
            </TabsTrigger>
            <TabsTrigger value="novo" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contato
            </TabsTrigger>
          </TabsList>

          {/* Tab: Contato Existente */}
          <TabsContent value="existente" className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de contatos */}
            <ScrollArea className="h-[200px] border rounded-md">
              {isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <User className="h-8 w-8 mb-2" />
                  <p className="text-sm">Nenhum contato encontrado</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {searchResults.map((contato) => (
                    <div
                      key={contato.id_contato}
                      onClick={() => setSelectedContato(contato)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedContato?.id_contato === contato.id_contato
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(contato.nm_contato)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{contato.nm_contato}</p>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(contato.st_contato)}`}>
                            {contato.st_contato}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {contato.nr_telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contato.nr_telefone}
                            </span>
                          )}
                          {contato.nm_email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              {contato.nm_email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Canal selecionado */}
            {selectedContato && (
              <div className="space-y-2">
                <Label>Canal de comunicação</Label>
                <Select value={canal} onValueChange={(v) => setCanal(v as CanalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANAIS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          {/* Tab: Novo Contato */}
          <TabsContent value="novo" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome do contato"
                value={novoContato.nm_contato}
                onChange={(e) => setNovoContato({ ...novoContato, nm_contato: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={novoContato.nr_telefone}
                onChange={(e) => setNovoContato({ ...novoContato, nr_telefone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={novoContato.nm_email}
                onChange={(e) => setNovoContato({ ...novoContato, nm_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Canal de comunicação</Label>
              <Select value={canal} onValueChange={(v) => setCanal(v as CanalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANAIS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {activeTab === 'existente' ? (
            <Button
              onClick={handleCriarConversaExistente}
              disabled={!selectedContato || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Iniciar Conversa'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCriarNovoContato}
              disabled={!novoContato.nm_contato || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar e Iniciar Conversa'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Memoizar o componente para evitar re-renders quando props não mudam
export const NovaConversaDialog = memo(NovaConversaDialogInner);

export default NovaConversaDialog;
