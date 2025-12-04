import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Mail, Globe, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ClinicaDetalhes {
  id_clinica: string;
  id_empresa: string;
  nm_clinica: string;
  ds_descricao: string | null;
  ds_endereco: string | null;
  ds_cidade: string | null;
  ds_estado: string | null;
  ds_cep: string | null;
  ds_telefone: string | null;
  ds_email: string | null;
  ds_site: string | null;
  ds_horario_funcionamento: string | null;
  ds_especialidades: string[] | null;
  ds_convenios: string[] | null;
  vl_avaliacao_media: number | null;
  nr_total_avaliacoes: number;
  st_ativa: boolean;
  st_aceita_agendamento_online: boolean;
  dt_criacao: string;
  nm_empresa: string;
  total_profissionais: number;
}

async function getClinica(id: string): Promise<ClinicaDetalhes | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const apiKey = process.env.API_DOCTORQ_API_KEY || '';

  try {
    const res = await fetch(`${apiUrl}/clinicas/${id}/`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Erro ao buscar clínica:', error);
    return null;
  }
}

export default async function ClinicaDetalhesPage({ params }: { params: { id: string } }) {
  const clinica = await getClinica(params.id);

  if (!clinica) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4">
          <Link href="/admin/clinicas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <PageHeader
            title={clinica.nm_clinica}
            description={`Detalhes da clínica - ${clinica.nm_empresa}`}
          />
        </div>

        {/* Status Badge */}
        <div className="flex gap-2">
          <Badge variant={clinica.st_ativa ? 'default' : 'destructive'}>
            {clinica.st_ativa ? 'Ativa' : 'Inativa'}
          </Badge>
          {clinica.st_aceita_agendamento_online && (
            <Badge variant="secondary">Agendamento Online</Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clinica.ds_endereco && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-sm text-muted-foreground">{clinica.ds_endereco}</p>
                    {clinica.ds_cidade && clinica.ds_estado && (
                      <p className="text-sm text-muted-foreground">
                        {clinica.ds_cidade} - {clinica.ds_estado}
                      </p>
                    )}
                    {clinica.ds_cep && (
                      <p className="text-sm text-muted-foreground">CEP: {clinica.ds_cep}</p>
                    )}
                  </div>
                </div>
              )}

              {clinica.ds_telefone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">{clinica.ds_telefone}</p>
                  </div>
                </div>
              )}

              {clinica.ds_email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{clinica.ds_email}</p>
                  </div>
                </div>
              )}

              {clinica.ds_site && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Site</p>
                    <a
                      href={clinica.ds_site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {clinica.ds_site}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{clinica.total_profissionais}</p>
                <p className="text-sm text-muted-foreground">Profissionais Ativos</p>
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {clinica.vl_avaliacao_media?.toFixed(1) || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Avaliação Média ({clinica.nr_total_avaliacoes} avaliações)
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Cadastrada em</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(clinica.dt_criacao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          {clinica.ds_descricao && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{clinica.ds_descricao}</p>
              </CardContent>
            </Card>
          )}

          {/* Horário de Funcionamento */}
          {clinica.ds_horario_funcionamento && (
            <Card>
              <CardHeader>
                <CardTitle>Horário de Funcionamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {clinica.ds_horario_funcionamento}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Especialidades */}
          {clinica.ds_especialidades && clinica.ds_especialidades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Especialidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {clinica.ds_especialidades.map((esp, idx) => (
                    <Badge key={idx} variant="outline">
                      {esp}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Convênios */}
          {clinica.ds_convenios && clinica.ds_convenios.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Convênios Aceitos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {clinica.ds_convenios.map((conv, idx) => (
                    <Badge key={idx} variant="secondary">
                      {conv}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
