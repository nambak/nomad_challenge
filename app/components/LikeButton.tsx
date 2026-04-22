'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleLike } from '@/app/tweets/actions'

type LikeState = {
  liked: boolean
  count: number
}

type Props = {
  tweetId: number
  initialLiked: boolean
  initialCount: number
}

export function LikeButton({ tweetId, initialLiked, initialCount }: Props) {
  const [isPending, startTransition] = useTransition()

  const [optimistic, applyOptimistic] = useOptimistic<LikeState, void>(
    { liked: initialLiked, count: initialCount },
    (state) => ({
      liked: !state.liked,
      count: state.liked ? state.count - 1 : state.count + 1,
    })
  )

  function handleClick() {
    startTransition(async () => {
      applyOptimistic()
      await toggleLike(tweetId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimistic.liked}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
        optimistic.liked
          ? 'border-rose-300 bg-rose-50 text-rose-500'
          : 'border-stone-200 bg-white text-stone-600 hover:border-rose-300 hover:text-rose-400'
      }`}
    >
      <span aria-hidden="true">{optimistic.liked ? '♥' : '♡'}</span>
      <span>{optimistic.count}</span>
    </button>
  )
}
