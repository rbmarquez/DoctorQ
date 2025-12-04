import { z } from "zod";

const medicamentoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do medicamento"),
  dose: z.string().trim().optional(),
  frequencia: z.string().trim().optional(),
});

export const anamneseSchema = z.object({
  motivo_consulta: z.string().trim().optional(),
  queixa_principal: z.string().trim().optional(),
  historico_doenca_atual: z.string().trim().optional(),
  antecedentes_pessoais: z.array(z.string().trim().min(1)).default([]),
  antecedentes_familiares: z.array(z.string().trim().min(1)).default([]),
  alergias: z.array(z.string().trim().min(1)).default([]),
  medicamentos: z.array(medicamentoSchema).default([]),
  habitos: z.object({
    tabagismo: z.enum(["nao", "ocasional", "diario"]).optional(),
    etilismo: z.enum(["nao", "ocasional", "frequente"]).optional(),
    atividades_fisicas: z.string().trim().optional(),
    sono: z.string().trim().optional(),
    alimentacao: z.string().trim().optional(),
  }),
  sinais_vitais: z.object({
    peso: z.number().min(0).max(500).nullable().optional(),
    altura: z.number().min(0).max(300).nullable().optional(),
    pressao_arterial: z.string().trim().optional(),
    frequencia_cardiaca: z.number().min(0).max(250).nullable().optional(),
  }),
  observacoes: z.string().trim().optional(),
});

export type AnamneseFormData = z.infer<typeof anamneseSchema>;
