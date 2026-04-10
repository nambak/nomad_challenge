'use server'

import { z } from 'zod'

const loginSchema = z.object({
  email: z
    .email('Invalid email address')
    .refine((value) => value.endsWith('@zod.com'), {
      message: 'Only @zod.com emails are allowed',
    }),
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters long'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .regex(/\d/, 'Password must contain at least one number'),
})

export type LoginState = {
  success: boolean
  message?: string
  errors?: {
    email?: string[]
    username?: string[]
    password?: string[]
  }
}

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const result = loginSchema.safeParse({
    email: formData.get('email'),
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return {
      success: false,
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  return { success: true, message: 'Welcome back!' }
}
