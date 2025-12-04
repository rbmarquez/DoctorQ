import { z } from "zod";

export const signupSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres"),
    lastName: z
      .string()
      .trim()
      .min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
    email: z
      .string()
      .trim()
      .email("Informe um e-mail válido"),
    emailConfirmation: z
      .string()
      .trim()
      .email("Informe um e-mail válido"),
    password: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres"),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({
        message: "Você deve aceitar os termos e condições",
      }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.email !== data.emailConfirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Os e-mails informados não coincidem",
        path: ["emailConfirmation"],
      });
    }
  });

export type SignupFormData = z.infer<typeof signupSchema>;
