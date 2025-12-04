"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { FileText, Upload, Download, Trash2, Eye, Share2, Lock, Folder, File, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ParceiroDocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  // TODO: Fetch from API
  const documentos = [
    {
      id: "1",
      nome: "Contrato de Parceria 2025.pdf",
      tipo: "Contrato",
      tamanho: "2.4 MB",
      data_upload: "15/01/2025",
      status: "aprovado",
      obrigatorio: true,
      validade: "15/01/2026",
    },
    {
      id: "2",
      nome: "CNPJ - Comprovante.pdf",
      tipo: "Documento Legal",
      tamanho: "850 KB",
      data_upload: "10/01/2025",
      status: "aprovado",
      obrigatorio: true,
      validade: null,
    },
    {
      id: "3",
      nome: "Alvará de Funcionamento.pdf",
      tipo: "Documento Legal",
      tamanho: "1.2 MB",
      data_upload: "10/01/2025",
      status: "pendente",
      obrigatorio: true,
      validade: "10/07/2025",
    },
    {
      id: "4",
      nome: "Certificado de Qualidade.pdf",
      tipo: "Certificação",
      tamanho: "3.1 MB",
      data_upload: "05/01/2025",
      status: "aprovado",
      obrigatorio: false,
      validade: "05/01/2026",
    },
    {
      id: "5",
      nome: "Nota Fiscal Template.xlsx",
      tipo: "Fiscal",
      tamanho: "450 KB",
      data_upload: "20/12/2024",
      status: "aprovado",
      obrigatorio: false,
      validade: null,
    },
    {
      id: "6",
      nome: "Termo de Responsabilidade.pdf",
      tipo: "Contrato",
      tamanho: "1.8 MB",
      data_upload: "28/12/2024",
      status: "rejeitado",
      obrigatorio: true,
      validade: null,
      motivo_rejeicao: "Documento ilegível. Por favor, envie uma versão com melhor qualidade.",
    },
  ];

  const categorias = [
    { id: "contratos", nome: "Contratos", total: 2, icon: FileText },
    { id: "legais", nome: "Documentos Legais", total: 2, icon: Lock },
    { id: "certificacoes", nome: "Certificações", total: 1, icon: CheckCircle },
    { id: "fiscal", nome: "Fiscais", total: 1, icon: File },
  ];

  const stats = {
    total_documentos: documentos.length,
    aprovados: documentos.filter((d) => d.status === "aprovado").length,
    pendentes: documentos.filter((d) => d.status === "pendente").length,
    rejeitados: documentos.filter((d) => d.status === "rejeitado").length,
  };

  const filteredDocumentos = documentos.filter((doc) => {
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "todos" || doc.tipo === tipoFilter;
    const matchesStatus = statusFilter === "todos" || doc.status === statusFilter;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    if (status === "aprovado") return <Badge className="bg-green-500">Aprovado</Badge>;
    if (status === "pendente") return <Badge className="bg-yellow-500">Pendente</Badge>;
    if (status === "rejeitado") return <Badge className="bg-red-500">Rejeitado</Badge>;
    return <Badge variant="outline">Desconhecido</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === "aprovado") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "pendente") return <Clock className="h-5 w-5 text-yellow-600" />;
    if (status === "rejeitado") return <AlertCircle className="h-5 w-5 text-red-600" />;
    return null;
  };

  const handleUpload = () => {
    // TODO: Implement file upload
    alert("Funcionalidade de upload em breve!");
  };

  const handleDownload = (doc: typeof documentos[0]) => {
    // TODO: Call API to download document
    alert(`Baixando ${doc.nome}...`);
  };

  const handleDelete = (doc: typeof documentos[0]) => {
    // TODO: Call API to delete document
    if (confirm(`Tem certeza que deseja excluir ${doc.nome}?`)) {
      alert("Documento excluído!");
    }
  };

  const formatDate = (dateStr: string) => {
    return dateStr;
  };

  const isProximoVencimento = (validade: string | null) => {
    if (!validade) return false;
    const hoje = new Date();
    const dataValidade = new Date(validade.split("/").reverse().join("-"));
    const diasRestantes = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diasRestantes <= 30 && diasRestantes >= 0;
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-500" />
              Documentos
            </h1>
            <p className="text-gray-600">Gerencie seus documentos e certificações</p>
          </div>

          <Button onClick={handleUpload} className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Upload className="h-4 w-4 mr-2" />
            Enviar Documento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <File className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{stats.total_documentos}</p>
              <p className="text-sm text-gray-600">Total de Documentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{stats.aprovados}</p>
              <p className="text-sm text-gray-600">Aprovados</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold">{stats.pendentes}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold">{stats.rejeitados}</p>
              <p className="text-sm text-gray-600">Rejeitados</p>
            </CardContent>
          </Card>
        </div>

        {/* Categorias */}
        <div>
          <h2 className="text-lg font-bold mb-4">Categorias</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {categorias.map((categoria) => {
              const Icon = categoria.icon;
              return (
                <Card key={categoria.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{categoria.nome}</p>
                        <p className="text-sm text-gray-600">{categoria.total} documentos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Alertas */}
        {documentos.some((d) => isProximoVencimento(d.validade)) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-2">Documentos Próximos do Vencimento</p>
                  <p className="text-sm text-gray-700">
                    {documentos.filter((d) => isProximoVencimento(d.validade)).length} documento(s) vencem nos
                    próximos 30 dias. Renove antes do prazo para evitar interrupções.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Contrato">Contratos</SelectItem>
                  <SelectItem value="Documento Legal">Documentos Legais</SelectItem>
                  <SelectItem value="Certificação">Certificações</SelectItem>
                  <SelectItem value="Fiscal">Fiscais</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="rejeitado">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Documentos ({filteredDocumentos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDocumentos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum documento encontrado</p>
                </div>
              ) : (
                filteredDocumentos.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 border rounded-lg ${
                      isProximoVencimento(doc.validade) ? "border-orange-300 bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getStatusIcon(doc.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{doc.nome}</p>
                            {doc.obrigatorio && <Badge variant="outline">Obrigatório</Badge>}
                            {getStatusBadge(doc.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                            <span>{doc.tipo}</span>
                            <span>•</span>
                            <span>{doc.tamanho}</span>
                            <span>•</span>
                            <span>Enviado em {doc.data_upload}</span>
                            {doc.validade && (
                              <>
                                <span>•</span>
                                <span
                                  className={isProximoVencimento(doc.validade) ? "text-orange-600 font-medium" : ""}
                                >
                                  Validade: {doc.validade}
                                </span>
                              </>
                            )}
                          </div>
                          {doc.status === "rejeitado" && doc.motivo_rejeicao && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                              <strong>Motivo da rejeição:</strong> {doc.motivo_rejeicao}
                            </div>
                          )}
                          {isProximoVencimento(doc.validade) && (
                            <div className="p-2 bg-orange-100 border border-orange-300 rounded text-sm text-orange-800">
                              ⚠️ Este documento vence em breve. Atualize antes do prazo.
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!doc.obrigatorio && (
                          <Button variant="outline" size="sm" onClick={() => handleDelete(doc)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-2">Seus Documentos Estão Seguros</p>
                <p className="text-sm text-gray-700 mb-3">
                  Todos os documentos são armazenados de forma segura com criptografia de ponta a ponta. Apenas
                  você e a equipe de verificação têm acesso aos seus arquivos.
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Documentos obrigatórios devem ser enviados em até 30 dias</li>
                  <li>• Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</li>
                  <li>• Documentos rejeitados podem ser reenviados a qualquer momento</li>
                  <li>• Mantenha seus documentos atualizados para evitar suspensões</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
