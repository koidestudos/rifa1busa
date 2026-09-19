import { z } from "zod";
import { MAX_RECEIPT_BYTES, RECEIPT_MIME_TYPES } from "@/lib/constants";
import { onlyDigits } from "@/lib/format";

export const loginSchema = z.object({
  login: z.string().trim().min(3, "Informe o login").max(80),
  password: z.string().min(1, "Informe a senha"),
});

export const passwordChangeSchema = z
  .object({
    password: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Za-z]/, "A senha deve conter letras")
      .regex(/[0-9]/, "A senha deve conter números"),
    confirm: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

export const buyerSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(120, "Nome muito longo"),
  telefone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = onlyDigits(value);
      return digits.length === 10 || digits.length === 11;
    }, "Informe um telefone válido com DDD"),
});

export function validateReceiptFile(file: File | null) {
  if (!file || file.size === 0) {
    return "Envie o comprovante de pagamento";
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return "O comprovante deve ter no máximo 8 MB";
  }
  const type = file.type.toLowerCase();
  const allowed: readonly string[] = RECEIPT_MIME_TYPES;
  if (!type && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return "Use uma imagem JPG, PNG ou WebP";
  }
  if (type && !allowed.includes(type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return "Use uma imagem JPG, PNG ou WebP";
  }
  return null;
}

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type BuyerInput = z.infer<typeof buyerSchema>;
