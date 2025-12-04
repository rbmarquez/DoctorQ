"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to API
    console.log("Form submitted:", formData);
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        assunto: "",
        mensagem: "",
      });
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Entre em Contato
          </h1>
          <p className="text-gray-600">
            Estamos aqui para ajudar! Entre em contato através de qualquer um dos canais abaixo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Phone */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefone</h3>
                    <p className="text-sm text-gray-600 mb-2">0800 123 4567</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Seg-Sex: 8h-20h</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>Sábado: 9h-13h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-sm text-gray-600 mb-1">suporte@doctorq.com.br</p>
                    <p className="text-xs text-gray-500">Resposta em até 24h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Chat ao Vivo</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Fale com nosso time em tempo real
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Iniciar Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Endereço</h3>
                    <p className="text-sm text-gray-600">
                      Av. Paulista, 1000 - Conj. 501<br />
                      Bela Vista, São Paulo - SP<br />
                      CEP: 01310-100
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Hours */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-2">Horário de Atendimento</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Segunda a Sexta:</span>
                        <span className="font-medium">8h - 20h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sábado:</span>
                        <span className="font-medium">9h - 13h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Domingo:</span>
                        <span className="font-medium">Fechado</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Feriados:</span>
                        <span className="font-medium">Fechado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Envie uma Mensagem</CardTitle>
                <p className="text-sm text-gray-600">
                  Preencha o formulário abaixo e entraremos em contato em breve
                </p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-900 mb-2">
                      Mensagem Enviada!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Obrigado pelo contato. Responderemos em breve.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                    >
                      Enviar Outra Mensagem
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => handleChange("nome", e.target.value)}
                          placeholder="Seu nome"
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="seu@email.com"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          type="tel"
                          value={formData.telefone}
                          onChange={(e) => handleChange("telefone", e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="assunto">Assunto *</Label>
                        <Select
                          value={formData.assunto}
                          onValueChange={(value) => handleChange("assunto", value)}
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um assunto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suporte">Suporte Técnico</SelectItem>
                            <SelectItem value="agendamento">Dúvida sobre Agendamento</SelectItem>
                            <SelectItem value="pagamento">Pagamentos e Faturas</SelectItem>
                            <SelectItem value="marketplace">Marketplace/Produtos</SelectItem>
                            <SelectItem value="profissional">Sou Profissional</SelectItem>
                            <SelectItem value="privacidade">Privacidade e Dados</SelectItem>
                            <SelectItem value="parceria">Parceria Comercial</SelectItem>
                            <SelectItem value="feedback">Feedback/Sugestão</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mensagem">Mensagem *</Label>
                      <Textarea
                        id="mensagem"
                        value={formData.mensagem}
                        onChange={(e) => handleChange("mensagem", e.target.value)}
                        placeholder="Descreva sua dúvida ou mensagem..."
                        rows={6}
                        required
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Seja o mais específico possível para que possamos ajudá-lo melhor
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <strong>💡 Dica:</strong> Antes de enviar, confira nossa{" "}
                        <a href="/faq" className="text-blue-600 hover:underline">
                          página de FAQ
                        </a>{" "}
                        ou a{" "}
                        <a href="/ajuda" className="text-blue-600 hover:underline">
                          Central de Ajuda
                        </a>
                        . Sua dúvida pode já estar respondida!
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormData({
                            nome: "",
                            email: "",
                            telefone: "",
                            assunto: "",
                            mensagem: "",
                          })
                        }
                      >
                        Limpar
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Outras Formas de Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">WhatsApp Business</p>
                    <p className="text-gray-600">(11) 98765-4321</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Telegram</p>
                    <p className="text-gray-600">@DoctorQSuporte</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Redes Sociais</p>
                    <div className="flex gap-2 mt-1">
                      <a href="#" className="text-purple-600 hover:text-purple-700">
                        Instagram
                      </a>
                      <span className="text-gray-400">•</span>
                      <a href="#" className="text-purple-600 hover:text-purple-700">
                        Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Nossa Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Mapa interativo em breve</p>
                <p className="text-xs mt-1">
                  Av. Paulista, 1000 - São Paulo, SP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
