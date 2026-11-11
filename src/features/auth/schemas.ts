// Validação dos formulários de acesso, só para avisar na tela: quem decide é a API.
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Digite um e-mail válido, como nome@hospital.com.br'),
  senha: z.string().min(1, 'Digite a senha'),
})
export type DadosLogin = z.infer<typeof loginSchema>

export const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Digite a senha atual'),
    novaSenha: z
      .string()
      .min(10, 'Use pelo menos 10 caracteres')
      .regex(/[a-z]/i, 'Inclua pelo menos uma letra')
      .regex(/\d/, 'Inclua pelo menos um número'),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmacao, {
    path: ['confirmacao'],
    message: 'A confirmação precisa ser igual à nova senha',
  })
  .refine((dados) => dados.novaSenha !== dados.senhaAtual, {
    path: ['novaSenha'],
    message: 'A nova senha precisa ser diferente da atual',
  })
export type DadosSenha = z.infer<typeof senhaSchema>
