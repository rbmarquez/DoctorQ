"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ArrowRight,
  Download,
  Mail,
  Sparkles,
  Clock,
  Users,
  Key,
  Shield,
  Rocket,
  BookOpen,
  HeadphonesIcon,
  Calendar,
  Gift,
  CreditCard,
  FileText,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Get parameters from URL
  const licenseKey = searchParams.get("license") || "EST-2024-PRO-001";
  const plan = searchParams.get("plan") || "Professional";
  const email = searchParams.get("email") || "contato@clinica.com.br";
  const company = searchParams.get("company") || "Clínica Exemplo";
  const paymentMethod = searchParams.get("payment") || "credit_card";

  // Setup steps
  const setupSteps = [
    { id: 1, name: "Criando conta", completed: false },
    { id: 2, name: "Ativando licença", completed: false },
    { id: 3, name: "Configurando recursos", completed: false },
    { id: 4, name: "Preparando dashboard", completed: false },
  ];

  // Simulate setup progress
  useEffect(() => {
    const timer = setInterval(() => {
      setSetupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Trigger confetti when complete
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  // Update current step based on progress
  useEffect(() => {
    if (setupProgress < 25) setCurrentStep(0);
    else if (setupProgress < 50) setCurrentStep(1);
    else if (setupProgress < 75) setCurrentStep(2);
    else if (setupProgress < 100) setCurrentStep(3);
    else setCurrentStep(4);
  }, [setupProgress]);

  const copyLicenseKey = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    toast.success("Chave copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDashboard = () => {
    // Store license in localStorage for auto-validation
    localStorage.setItem("licenseKey", licenseKey);
    localStorage.setItem("licensePlan", plan);

    router.push("/login");
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "trial": return "bg-gray-100 text-gray-800";
      case "starter": return "bg-blue-100 text-blue-800";
      case "professional": return "bg-purple-100 text-purple-800";
      case "enterprise": return "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-900";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanFeatures = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "professional":
        return [
          "Até 50 usuários",
          "5 unidades/locais",
          "Agendamento ilimitado",
          "Dashboard personalizado",
          "API completa",
          "Suporte dedicado",
          "Relatórios ilimitados",
        ];
      case "enterprise":
        return [
          "Usuários ilimitados",
          "Unidades ilimitadas",
          "Todos os recursos",
          "BI & Analytics",
          "Suporte VIP 24/7",
          "Customização total",
          "Consultoria incluída",
        ];
      default:
        return [
          "Recursos básicos",
          "Suporte por email",
          "Dashboard simples",
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">DoctorQ Partners</h1>
            </div>
            <Badge className="bg-green-100 text-green-800 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Pagamento Confirmado
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Parabéns! Sua licença está ativa
          </h2>
          <p className="text-xl text-gray-600">
            Bem-vindo ao DoctorQ Partners, {company}!
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* License Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-500" />
                Detalhes da Licença
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* License Key */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Sua chave de licença</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono font-bold text-purple-600 bg-white px-3 py-2 rounded border">
                    {licenseKey}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyLicenseKey}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Guarde esta chave em local seguro. Ela será necessária para ativar sua conta.
                </p>
              </div>

              {/* Plan Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plano contratado</p>
                  <div className="mt-1">
                    <Badge className={getPlanColor(plan)}>
                      {plan}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Forma de pagamento</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {paymentMethod === "credit_card" ? "Cartão de Crédito" :
                       paymentMethod === "pix" ? "PIX" : "Boleto"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Recursos inclusos no seu plano:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {getPlanFeatures(plan).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Setup Progress */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Configuração automática</p>
                  <span className="text-sm text-gray-600">{setupProgress}%</span>
                </div>
                <Progress value={setupProgress} className="mb-3" />
                <div className="space-y-1">
                  {setupSteps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      {idx < currentStep ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : idx === currentStep ? (
                        <div className="h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={idx <= currentStep ? "text-gray-900" : "text-gray-400"}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Empresa</p>
                  <p className="font-medium">{company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">E-mail de acesso</p>
                  <p className="font-medium text-sm">{email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className="bg-green-100 text-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleGoToDashboard}
                  disabled={setupProgress < 100}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  {setupProgress < 100 ? "Preparando..." : "Acessar Dashboard"}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Onboarding
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Documentação
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <HeadphonesIcon className="h-4 w-4 mr-2" />
                  Falar com Suporte
                </Button>
              </CardContent>
            </Card>

            {/* Special Offer */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Gift className="h-6 w-6 text-purple-600" />
                  <p className="font-medium text-purple-900">Oferta Especial</p>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Por ser novo parceiro, você ganhou:
                </p>
                <ul className="space-y-1 text-sm text-purple-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    30 dias de suporte premium
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Migração de dados grátis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Treinamento exclusivo
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>O que acontece agora?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-sm text-gray-500">Agora</span>
                  </div>
                  <div className="w-4 h-4 bg-green-500 rounded-full ring-4 ring-green-100"></div>
                  <div className="flex-1 -mt-1">
                    <h4 className="font-medium">Licença ativada</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Sua licença foi ativada e está pronta para uso
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-sm text-gray-500">5 min</span>
                  </div>
                  <div className="w-4 h-4 bg-blue-500 rounded-full ring-4 ring-blue-100"></div>
                  <div className="flex-1 -mt-1">
                    <h4 className="font-medium">E-mail de confirmação</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Você receberá um e-mail com todos os detalhes e instruções de acesso
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-sm text-gray-500">24h</span>
                  </div>
                  <div className="w-4 h-4 bg-purple-500 rounded-full ring-4 ring-purple-100"></div>
                  <div className="flex-1 -mt-1">
                    <h4 className="font-medium">Contato do especialista</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Nosso especialista entrará em contato para agendar o onboarding personalizado
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-sm text-gray-500">3 dias</span>
                  </div>
                  <div className="w-4 h-4 bg-gray-300 rounded-full ring-4 ring-gray-100"></div>
                  <div className="flex-1 -mt-1">
                    <h4 className="font-medium">Treinamento inicial</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Sessão de treinamento com sua equipe para máximo aproveitamento
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-sm text-gray-500">7 dias</span>
                  </div>
                  <div className="w-4 h-4 bg-gray-300 rounded-full ring-4 ring-gray-100"></div>
                  <div className="flex-1 -mt-1">
                    <h4 className="font-medium">Check-in de sucesso</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Primeira reunião de acompanhamento para garantir que tudo está funcionando perfeitamente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Documentos Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Contrato de Licença
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Nota Fiscal
                <Download className="h-3 w-3 ml-auto" />
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Termos de Uso
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex justify-center mt-8">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-500"
            onClick={handleGoToDashboard}
            disabled={setupProgress < 100}
          >
            {setupProgress < 100 ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Configurando sua conta...
              </>
            ) : (
              <>
                Acessar Plataforma
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}