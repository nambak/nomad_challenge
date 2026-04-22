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

const addResponseSchema = z.object({
  payload: z
    .string({ error: 'Reply is required' })
    .trim()
    .min(1, 'Reply cannot be empty')
    .max(280, 'Reply must be at most 280 characters long'),
  tweetId: z.coerce.number().int().positive(),
})

export type AddResponseState = {
  success: boolean
  message?: string
  errors?: {
    payload?: string[]
    form?: string[]
  }
}

export async function addResponse(
  _prevState: AddResponseState,
  formData: FormData
): Promise<AddResponseState> {
  const session = await getSession()
  if (!session.userId) {
    redirect('/log-in')
  }

  const parsed = addResponseSchema.safeParse({
    payload: formData.get('payload'),
    tweetId: formData.get('tweetId'),
  })

  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const tweet = await db.tweet.findUnique({
    where: { id: parsed.data.tweetId },
    select: { id: true },
  })
  if (!tweet) {
    return {
      success: false,
      errors: { form: ['Tweet not found'] },
    }
  }

  await db.response.create({
    data: {
      payload: parsed.data.payload,
      tweetId: parsed.data.tweetId,
      userId: session.userId,
    },
    select: { id: true },
  })

  revalidatePath(`/tweets/${parsed.data.tweetId}`)

  return { success: true, message: 'Reply posted' }
}

const toggleLikeSchema = z.object({
  tweetId: z.coerce.number().int().positive(),
})

export type ToggleLikeResult = {
  success: boolean
  liked: boolean
  error?: string
}

export async function toggleLike(
  tweetIdInput: number | string
): Promise<ToggleLikeResult> {
  const session = await getSession()
  if (!session.userId) {
    redirect('/log-in')
  }

  const parsed = toggleLikeSchema.safeParse({ tweetId: tweetIdInput })
  if (!parsed.success) {
    return { success: false, liked: false, error: 'Invalid tweet id' }
  }

  const { tweetId } = parsed.data

  const existing = await db.like.findUnique({
    where: { userId_tweetId: { userId: session.userId, tweetId } },
    select: { id: true },
  })

  let liked: boolean
  if (existing) {
    await db.like.delete({ where: { id: existing.id } })
    liked = false
  } else {
    await db.like.create({
      data: { userId: session.userId, tweetId },
      select: { id: true },
    })
    liked = true
  }

  revalidatePath(`/tweets/${tweetId}`)
  revalidatePath('/')

  return { success: true, liked }
}
