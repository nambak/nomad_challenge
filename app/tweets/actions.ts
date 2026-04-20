'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const addTweetSchema = z.object({
  tweet: z
    .string({ error: 'Tweet is required' })
    .trim()
    .min(1, 'Tweet cannot be empty')
    .max(280, 'Tweet must be at most 280 characters long'),
})

export type AddTweetState = {
  success: boolean
  message?: string
  errors?: {
    tweet?: string[]
    form?: string[]
  }
}

export async function addTweet(
  _prevState: AddTweetState,
  formData: FormData
): Promise<AddTweetState> {
  const session = await getSession()
  if (!session.userId) {
    redirect('/log-in')
  }

  const parsed = addTweetSchema.safeParse({
    tweet: formData.get('tweet'),
  })

  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  await db.tweet.create({
    data: {
      tweet: parsed.data.tweet,
      userId: session.userId,
    },
    select: { id: true },
  })

  revalidatePath('/')

  return { success: true, message: 'Tweet posted' }
}
