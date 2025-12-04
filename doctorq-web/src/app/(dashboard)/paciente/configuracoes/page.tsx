"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Bell,
  Eye,
  Shield,
  Trash2,
  Save,
  Camera,
  Edit2,
  Globe,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  const [dadosPessoais, setDadosPessoais] = useState({
    nm_completo: "Maria Silva Santos",
    nm_email: "maria.silva@email.com",
    nr_telefone: "(11) 98765-4321",
    dt_nascimento: "1990-05-15",
    ds_endereco: "Rua das Flores, 123",
    ds_cidade: "São Paulo",
    ds_estado: "SP",
    nr_cep: "01234-567",
  });

  const [senhas, setSenhas] = useState({
    senha_atual: "",
    senha_nova: "",
    senha_confirmacao: "",
  });

  const [notificacoes, setNotificacoes] = useState({
    email_agendamentos: true,
    email_promocoes: true,
    email_lembretes: true,
    push_agendamentos: true,
    push_promocoes: false,
    push_mensagens: true,
    sms_agendamentos: false,
    sms_lembretes: false,
  });

  const [privacidade, setPrivacidade] = useState({
    perfil_publico: false,
    avaliacoes_publicas: true,
    fotos_publicas: false,
    compartilhar_dados: false,
  });

  const handleSalvarDadosPessoais = () => {
    toast.success("Dados pessoais atualizados com sucesso!");
  };

  const handleAlterarSenha = () => {
    if (senhas.senha_nova !== senhas.senha_confirmacao) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (senhas.senha_nova.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }
    toast.success("Senha alterada com sucesso!");
    setSenhas({ senha_atual: "", senha_nova: "", senha_confirmacao: "" });
  };

  const handleSalvarNotificacoes = () => {
    toast.success("Preferências de notificações atualizadas!");
  };

  const handleSalvarPrivacidade = () => {
    toast.success("Configurações de privacidade atualizadas!");
  };

  const handleExcluirConta = () => {
    if (
      confirm(
        "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão permanentemente removidos."
      )
    ) {
      toast.error("Conta excluída. Você será redirecionado...");
    }
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações e preferências</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
            <TabsTrigger value="privacidade">Privacidade</TabsTrigger>
          </TabsList>

          {/* Perfil */}
          <TabsContent value="perfil" className="space-y-6 mt-6">
            {/* Foto de Perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>Sua foto será exibida em avaliações e mensagens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl">
                      MS
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600">
                      <Camera className="h-4 w-4 mr-2" />
                      Alterar Foto
                    </Button>
                    <p className="text-xs text-gray-500">JPG, PNG ou GIF. Máximo 5MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Mantenha suas informações sempre atualizadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={dadosPessoais.nm_completo}
                      onChange={(e) => setDadosPessoais({ ...dadosPessoais, nm_completo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={dadosPessoais.nm_email}
                      onChange={(e) => setDadosPessoais({ ...dadosPessoais, nm_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={dadosPessoais.nr_telefone}
                      onChange={(e) => setDadosPessoais({ ...dadosPessoais, nr_telefone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nascimento">Data de Nascimento</Label>
                    <Input
                      id="nascimento"
                      type="date"
                      value={dadosPessoais.dt_nascimento}
                      onChange={(e) => setDadosPessoais({ ...dadosPessoais, dt_nascimento: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Endereço</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={dadosPessoais.ds_endereco}
                        onChange={(e) => setDadosPessoais({ ...dadosPessoais, ds_endereco: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={dadosPessoais.ds_cidade}
                        onChange={(e) => setDadosPessoais({ ...dadosPessoais, ds_cidade: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={dadosPessoais.ds_estado}
                        onChange={(e) => setDadosPessoais({ ...dadosPessoais, ds_estado: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={dadosPessoais.nr_cep}
                        onChange={(e) => setDadosPessoais({ ...dadosPessoais, nr_cep: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSalvarDadosPessoais}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="seguranca" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    value={senhas.senha_atual}
                    onChange={(e) => setSenhas({ ...senhas, senha_atual: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="senha-nova">Nova Senha</Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    value={senhas.senha_nova}
                    onChange={(e) => setSenhas({ ...senhas, senha_nova: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo de 8 caracteres</p>
                </div>
                <div>
                  <Label htmlFor="senha-confirmacao">Confirmar Nova Senha</Label>
                  <Input
                    id="senha-confirmacao"
                    type="password"
                    value={senhas.senha_confirmacao}
                    onChange={(e) => setSenhas({ ...senhas, senha_confirmacao: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAlterarSenha} className="bg-gradient-to-r from-blue-500 to-cyan-600">
                    <Lock className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autenticação em Duas Etapas</CardTitle>
                <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação 2FA</p>
                    <p className="text-sm text-gray-600">Receba códigos de verificação por SMS</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis na sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-900">Excluir Conta</p>
                    <p className="text-sm text-red-700">
                      Exclua permanentemente sua conta e todos os seus dados
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleExcluirConta}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notificacoes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notificações por E-mail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Confirmações de Agendamento</p>
                    <p className="text-sm text-gray-600">Receba confirmações quando agendar procedimentos</p>
                  </div>
                  <Switch
                    checked={notificacoes.email_agendamentos}
                    onCheckedChange={(checked) =>
                      setNotificacoes({ ...notificacoes, email_agendamentos: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promoções e Ofertas</p>
                    <p className="text-sm text-gray-600">Fique por dentro de descontos e novidades</p>
                  </div>
                  <Switch
                    checked={notificacoes.email_promocoes}
                    onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, email_promocoes: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lembretes de Procedimentos</p>
                    <p className="text-sm text-gray-600">Receba lembretes antes dos seus agendamentos</p>
                  </div>
                  <Switch
                    checked={notificacoes.email_lembretes}
                    onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, email_lembretes: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações Push
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Agendamentos</p>
                    <p className="text-sm text-gray-600">Notificações sobre seus agendamentos</p>
                  </div>
                  <Switch
                    checked={notificacoes.push_agendamentos}
                    onCheckedChange={(checked) =>
                      setNotificacoes({ ...notificacoes, push_agendamentos: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promoções</p>
                    <p className="text-sm text-gray-600">Ofertas e descontos especiais</p>
                  </div>
                  <Switch
                    checked={notificacoes.push_promocoes}
                    onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, push_promocoes: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mensagens</p>
                    <p className="text-sm text-gray-600">Novas mensagens de profissionais</p>
                  </div>
                  <Switch
                    checked={notificacoes.push_mensagens}
                    onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, push_mensagens: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Notificações por SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Confirmações de Agendamento</p>
                    <p className="text-sm text-gray-600">SMS com confirmações e detalhes</p>
                  </div>
                  <Switch
                    checked={notificacoes.sms_agendamentos}
                    onCheckedChange={(checked) =>
                      setNotificacoes({ ...notificacoes, sms_agendamentos: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lembretes</p>
                    <p className="text-sm text-gray-600">Lembretes por SMS antes dos procedimentos</p>
                  </div>
                  <Switch
                    checked={notificacoes.sms_lembretes}
                    onCheckedChange={(checked) => setNotificacoes({ ...notificacoes, sms_lembretes: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSalvarNotificacoes}
                className="bg-gradient-to-r from-blue-500 to-cyan-600"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </Button>
            </div>
          </TabsContent>

          {/* Privacidade */}
          <TabsContent value="privacidade" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurações de Privacidade
                </CardTitle>
                <CardDescription>Controle quem pode ver suas informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Perfil Público</p>
                    <p className="text-sm text-gray-600">Permita que outros usuários vejam seu perfil</p>
                  </div>
                  <Switch
                    checked={privacidade.perfil_publico}
                    onCheckedChange={(checked) => setPrivacidade({ ...privacidade, perfil_publico: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Avaliações Públicas</p>
                    <p className="text-sm text-gray-600">Suas avaliações serão visíveis para outros usuários</p>
                  </div>
                  <Switch
                    checked={privacidade.avaliacoes_publicas}
                    onCheckedChange={(checked) =>
                      setPrivacidade({ ...privacidade, avaliacoes_publicas: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Fotos Públicas</p>
                    <p className="text-sm text-gray-600">Compartilhe suas fotos antes/depois publicamente</p>
                  </div>
                  <Switch
                    checked={privacidade.fotos_publicas}
                    onCheckedChange={(checked) => setPrivacidade({ ...privacidade, fotos_publicas: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compartilhamento de Dados</p>
                    <p className="text-sm text-gray-600">
                      Permita análise anônima dos dados para melhorar serviços
                    </p>
                  </div>
                  <Switch
                    checked={privacidade.compartilhar_dados}
                    onCheckedChange={(checked) =>
                      setPrivacidade({ ...privacidade, compartilhar_dados: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seus Dados</CardTitle>
                <CardDescription>Gerencie e exporte seus dados pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Dados Coletados
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Exportar Meus Dados
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSalvarPrivacidade} className="bg-gradient-to-r from-blue-500 to-cyan-600">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
