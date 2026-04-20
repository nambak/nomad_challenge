'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addTweet, type AddTweetState } from '@/app/tweets/actions'
import { SubmitButton } from './SubmitButton'

const initialState: AddTweetState = { success: false }

export function AddTweet() {
  const [state, formAction] = useActionState(addTweet, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const tweetError = state.errors?.tweet?.[0]

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <textarea
          name="tweet"
          rows={3}
          maxLength={280}
          placeholder="What's happening?"
          className={`w-full resize-none rounded-xl px-4 py-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 ${
            tweetError
              ? 'border-2 border-rose-400 bg-white'
              : 'border border-stone-200 bg-white focus:border-stone-300'
          }`}
        />
        {tweetError && (
          <p className="pl-2 text-xs font-medium text-rose-400">{tweetError}</p>
        )}
        {state.success && state.message && (
          <p className="pl-2 text-xs font-medium text-emerald-500">
            {state.message}
          </p>
        )}
        <div className="self-end">
          <SubmitButton label="Tweet" pendingLabel="Posting..." />
        </div>
      </form>
    </section>
  )
}
