"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Star,
  Award,
  Briefcase,
  CheckCircle2,
  XCircle,
  Globe,
  MessageSquare,
} from "lucide-react";

interface PublicProfilePreviewProps {
  profissional: {
    nm_profissional: string;
    ds_email: string;
    nr_telefone: string;
    nr_whatsapp: string;
    ds_especialidades: string[];
    nr_registro_profissional: string;
    ds_bio: string;
    ds_formacao: string;
    nr_anos_experiencia: number;
    ds_foto_perfil: string;
    ds_horarios_atendimento: Record<
      string,
      { ativo: boolean; hr_inicio?: string; hr_fim?: string }
    >;
    nr_tempo_consulta: number;
    ds_procedimentos_realizados: string[];
    st_aceita_online: boolean;
    st_primeira_consulta: boolean;
    st_aceita_convenio: boolean;
    ds_idiomas: string[];
    ds_redes_sociais: Record<string, string>;
    vl_avaliacao_media?: number;
    nr_avaliacoes?: number;
  };
  className?: string;
}

const diasSemana = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

export function PublicProfilePreview({
  profissional,
  className,
}: PublicProfilePreviewProps) {
  // Calcula horários de atendimento
  const horariosAtivos = Object.entries(profissional.ds_horarios_atendimento)
    .filter(([_, dia]) => dia.ativo)
    .map(([key, dia]) => ({
      dia: diasSemana[key as keyof typeof diasSemana],
      horario: `${dia.hr_inicio || "00:00"} - ${dia.hr_fim || "00:00"}`,
    }));

  return (
    <div className={className}>
      {/* Header da Preview */}
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preview do Perfil Público
          </CardTitle>
          <CardDescription>
            Veja como seu perfil será exibido para os pacientes na plataforma
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Perfil Principal */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Foto de Perfil */}
            <div className="flex-shrink-0">
              {profissional.ds_foto_perfil ? (
                <img
                  src={profissional.ds_foto_perfil}
                  alt={profissional.nm_profissional}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-16 h-16 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>

            {/* Informações Principais */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {profissional.nm_profissional}
              </h1>

              {/* Especialidades */}
              <div className="flex flex-wrap gap-2 mt-2">
                {profissional.ds_especialidades?.map((esp, index) => (
                  <Badge key={index} variant="secondary">
                    {esp}
                  </Badge>
                ))}
              </div>

              {/* Registro Profissional */}
              {profissional.nr_registro_profissional && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Registro: {profissional.nr_registro_profissional}
                </p>
              )}

              {/* Avaliação */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (profissional.vl_avaliacao_media || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {profissional.vl_avaliacao_media?.toFixed(1) || "5.0"} (
                  {profissional.nr_avaliacoes || 0} avaliações)
                </span>
              </div>

              {/* Experiência */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{profissional.nr_anos_experiencia} anos de experiência</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Consultas de {profissional.nr_tempo_consulta}min</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Bio */}
          {profissional.ds_bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <User className="w-5 h-5" />
                Sobre
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {profissional.ds_bio}
              </p>
            </div>
          )}

          {/* Formação */}
          {profissional.ds_formacao && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Formação
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {profissional.ds_formacao}
              </p>
            </div>
          )}

          {/* Procedimentos */}
          {profissional.ds_procedimentos_realizados?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Procedimentos Realizados
              </h3>
              <div className="flex flex-wrap gap-2">
                {profissional.ds_procedimentos_realizados.map((proc, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                  >
                    {proc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Horários de Atendimento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Horários de Atendimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {horariosAtivos.length > 0 ? (
                horariosAtivos.map((horario, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="font-medium">{horario.dia}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {horario.horario}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 col-span-2">
                  Horários não configurados
                </p>
              )}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                profissional.st_aceita_online
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
              }`}
            >
              {profissional.st_aceita_online ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {profissional.st_aceita_online
                  ? "Atende online"
                  : "Não atende online"}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                profissional.st_primeira_consulta
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {profissional.st_primeira_consulta ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {profissional.st_primeira_consulta
                  ? "Aceita novos pacientes"
                  : "Lista de espera"}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                profissional.st_aceita_convenio
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {profissional.st_aceita_convenio ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {profissional.st_aceita_convenio
                  ? "Aceita convênios"
                  : "Particular"}
              </span>
            </div>
          </div>

          {/* Idiomas */}
          {profissional.ds_idiomas?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Idiomas
              </h3>
              <div className="flex flex-wrap gap-2">
                {profissional.ds_idiomas.map((idioma, index) => (
                  <Badge key={index} variant="secondary">
                    {idioma}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contato */}
          <Separator className="my-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{profissional.nr_telefone || "Não informado"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{profissional.nr_whatsapp || "Não informado"}</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-6 flex gap-3">
            <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Consulta
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
