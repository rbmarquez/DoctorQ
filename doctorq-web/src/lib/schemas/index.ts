/**
 * Schemas Zod para validação de formulários
 */

import { z } from "zod";

export { signupSchema } from "./auth";
export type { SignupFormData } from "./auth";

// ============================================================================
// PROFISSIONAIS
// ============================================================================

export const profissionalSchema = z.object({
  id_user: z.string().uuid("ID de usuário inválido"),
  nm_profissional: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  ds_especialidades: z
    .string()
    .min(1, "Informe pelo menos uma especialidade")
    .optional(),
  ds_bio: z.string().max(1000, "Bio deve ter no máximo 1000 caracteres").optional(),
  ds_foto_perfil: z.string().url("URL inválida").optional().or(z.literal("")),
  ds_formacao: z.string().max(500, "Formação deve ter no máximo 500 caracteres").optional(),
  nr_registro_profissional: z
    .string()
    .min(3, "Registro profissional inválido")
    .optional()
    .or(z.literal("")),
  nr_anos_experiencia: z
    .number()
    .int("Deve ser um número inteiro")
    .min(0, "Anos de experiência não pode ser negativo")
    .max(100, "Anos de experiência deve ser no máximo 100")
    .optional(),
  st_aceita_novos_pacientes: z.boolean().default(true),
});

export type ProfissionalFormData = z.infer<typeof profissionalSchema>;

// ============================================================================
// CLÍNICAS
// ============================================================================

export const clinicaSchema = z.object({
  id_empresa: z.string().uuid("ID de empresa inválido"),
  nm_clinica: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  ds_descricao: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  ds_endereco: z
    .string()
    .max(300, "Endereço deve ter no máximo 300 caracteres")
    .optional(),
  ds_cidade: z.string().max(100, "Cidade deve ter no máximo 100 caracteres").optional(),
  ds_estado: z
    .string()
    .length(2, "Estado deve ter exatamente 2 caracteres (UF)")
    .toUpperCase()
    .optional()
    .or(z.literal("")),
  ds_cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido. Formato: 00000-000")
    .optional()
    .or(z.literal("")),
  ds_telefone: z
    .string()
    .regex(
      /^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/,
      "Telefone inválido. Formato: (00) 00000-0000"
    )
    .optional()
    .or(z.literal("")),
  ds_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  ds_site: z.string().url("URL inválida").optional().or(z.literal("")),
  ds_foto_principal: z.string().url("URL inválida").optional().or(z.literal("")),
  ds_especialidades: z.string().optional(),
  ds_convenios: z.string().optional(),
  ds_horario_segunda: z.string().default("08:00-18:00"),
  ds_horario_terca: z.string().default("08:00-18:00"),
  ds_horario_quarta: z.string().default("08:00-18:00"),
  ds_horario_quinta: z.string().default("08:00-18:00"),
  ds_horario_sexta: z.string().default("08:00-18:00"),
  ds_horario_sabado: z.string().default("Fechado"),
  ds_horario_domingo: z.string().default("Fechado"),
  st_aceita_agendamento_online: z.boolean().default(true),
});

export type ClinicaFormData = z.infer<typeof clinicaSchema>;

// ============================================================================
// ÁLBUNS
// ============================================================================

export const albumSchema = z.object({
  id_user: z.string().uuid("ID de usuário inválido"),
  nm_album: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  ds_descricao: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  ds_capa_url: z.string().url("URL inválida").optional().or(z.literal("")),
  ds_tipo: z
    .enum(["procedimento", "antes_depois", "evolucao", "geral"], {
      errorMap: () => ({ message: "Tipo de álbum inválido" }),
    })
    .default("geral"),
  st_privado: z.boolean().default(false),
  st_favorito: z.boolean().default(false),
});

export type AlbumFormData = z.infer<typeof albumSchema>;

// ============================================================================
// FOTOS
// ============================================================================

export const fotoSchema = z.object({
  id_user: z.string().uuid("ID de usuário inválido"),
  ds_titulo: z
    .string()
    .max(200, "Título deve ter no máximo 200 caracteres")
    .optional(),
  ds_legenda: z
    .string()
    .max(1000, "Legenda deve ter no máximo 1000 caracteres")
    .optional(),
  ds_tipo_foto: z
    .enum(["antes", "depois", "durante", "comparacao"], {
      errorMap: () => ({ message: "Tipo de foto inválido" }),
    })
    .optional(),
  id_album: z.string().uuid("ID de álbum inválido").optional(),
  id_agendamento: z.string().uuid("ID de agendamento inválido").optional(),
  id_procedimento: z.string().uuid("ID de procedimento inválido").optional(),
});

export type FotoFormData = z.infer<typeof fotoSchema>;

// ============================================================================
// CONVERSAS
// ============================================================================

export const conversaSchema = z.object({
  id_user_1: z.string().uuid("ID de usuário 1 inválido"),
  id_user_2: z.string().uuid("ID de usuário 2 inválido"),
  ds_tipo: z
    .enum(["suporte", "vendas", "geral"], {
      errorMap: () => ({ message: "Tipo de conversa inválido" }),
    })
    .optional(),
});

export type ConversaFormData = z.infer<typeof conversaSchema>;

// ============================================================================
// MENSAGENS
// ============================================================================

export const mensagemSchema = z.object({
  id_conversa: z.string().uuid("ID de conversa inválido"),
  id_user_remetente: z.string().uuid("ID de usuário remetente inválido"),
  ds_conteudo: z
    .string()
    .min(1, "Mensagem não pode estar vazia")
    .max(5000, "Mensagem deve ter no máximo 5000 caracteres"),
  ds_tipo: z
    .enum(["texto", "imagem", "arquivo", "audio"], {
      errorMap: () => ({ message: "Tipo de mensagem inválido" }),
    })
    .default("texto"),
});

export type MensagemFormData = z.infer<typeof mensagemSchema>;

// ============================================================================
// UPLOAD DE ARQUIVO
// ============================================================================

export const uploadFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "Arquivo deve ter no máximo 10MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      {
        message: "Apenas imagens JPG, PNG e WebP são permitidas",
      }
    ),
});

export type UploadFileData = z.infer<typeof uploadFileSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatar erros do Zod para exibição amigável
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return errors;
}

/**
 * Validar dados com schema Zod
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodError(error) };
    }
    return { success: false, errors: { _general: "Erro de validação desconhecido" } };
  }
}
export { anamneseSchema } from "./anamnese";
export type { AnamneseFormData } from "./anamnese";
