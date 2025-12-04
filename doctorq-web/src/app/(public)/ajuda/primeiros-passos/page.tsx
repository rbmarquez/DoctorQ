"use client";

import { BookOpen, CheckCircle, Play, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

const steps = [
  { titulo: "Criar sua conta", concluido: true, link: "/onboarding/step-1" },
  { titulo: "Configurar perfil", concluido: true, link: "/onboarding/step-2" },
  { titulo: "Explorar o dashboard", concluido: false, link: "/dashboard" },
  { titulo: "Fazer primeiro agendamento", concluido: false, link: "/paciente/agendamentos" },
  { titulo: "Explorar marketplace", concluido: false, link: "/marketplace" },
];

const guides = [
  { titulo: "Como fazer um agendamento", duracao: "5 min", tipo: "video" },
  { titulo: "Navegar pelo marketplace", duracao: "7 min", tipo: "video" },
  { titulo: "Gerenciar seu perfil", duracao: "4 min", tipo: "artigo" },
  { titulo: "Sistema de mensagens", duracao: "6 min", tipo: "video" },
];

export default function PrimeirosPassosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50 to-purple-50">
      <LandingNav />
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-purple-500" />
            Primeiros Passos
          </h1>
          <p className="text-gray-600">Comece sua jornada na plataforma DoctorQ</p>
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Seu Progresso</p>
                <p className="text-3xl font-bold text-purple-600">40%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">2 de 5 passos concluídos</p>
                <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "40%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklist de Início</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 border rounded-lg ${step.concluido ? "bg-green-50 border-green-200" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.concluido ? "bg-green-500" : "bg-gray-300"}`}>
                      {step.concluido ? <CheckCircle className="h-5 w-5 text-white" /> : <span className="text-white font-bold">{idx + 1}</span>}
                    </div>
                    <p className="font-medium">{step.titulo}</p>
                  </div>
                  {!step.concluido && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={step.link}>Começar</a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guias Recomendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.map((guide, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{guide.titulo}</h3>
                    <Badge variant="outline">{guide.tipo}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{guide.duracao}</p>
                  <Button variant="link" className="p-0 h-auto text-purple-600">
                    {guide.tipo === "video" ? <Play className="h-4 w-4 mr-1" /> : <ArrowRight className="h-4 w-4 mr-1" />}
                    Ver agora
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
