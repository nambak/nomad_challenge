'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { addResponse, type AddResponseState } from '@/app/tweets/actions'

export type ResponseItem = {
  id: number
  payload: string
  created_at: string
  username: string
  pending?: boolean
}

type Props = {
  tweetId: number
  currentUsername: string
  initialResponses: ResponseItem[]
}

const initialFormState: AddResponseState = { success: false }

export function Responses({ tweetId, currentUsername, initialResponses }: Props) {
  const [formState, setFormState] = useState<AddResponseState>(initialFormState)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const [optimisticResponses, addOptimisticResponse] = useOptimistic<
    ResponseItem[],
    ResponseItem
  >(initialResponses, (state, newItem) => [...state, newItem])

  function handleSubmit(formData: FormData) {
    const payloadRaw = formData.get('payload')
    const payload = typeof payloadRaw === 'string' ? payloadRaw.trim() : ''

    if (!payload) {
      setFormState({
        success: false,
        errors: { payload: ['Reply cannot be empty'] },
      })
      return
    }
    if (payload.length > 280) {
      setFormState({
        success: false,
        errors: { payload: ['Reply must be at most 280 characters long'] },
      })
      return
    }

    startTransition(async () => {
      addOptimisticResponse({
        id: -Date.now(),
        payload,
        created_at: new Date().toISOString(),
        username: currentUsername,
        pending: true,
      })
      const result = await addResponse(initialFormState, formData)
      setFormState(result)
      if (result.success) {
        formRef.current?.reset()
      }
    })
  }

  const payloadError = formState.errors?.payload?.[0]
  const formError = formState.errors?.form?.[0]

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-sm font-bold text-stone-700">
        Replies ({optimisticResponses.length})
      </h2>

      {optimisticResponses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 bg-white py-8 text-center text-xs text-stone-400">
          No replies yet. Be the first.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {optimisticResponses.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border border-stone-200 bg-white p-4 ${
                r.pending ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-semibold text-stone-700">
                  @{r.username}
                </span>
                <span>
                  {new Date(r.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone-800">
                {r.payload}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6 flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-4"
      >
        <input type="hidden" name="tweetId" value={tweetId} />
        <textarea
          name="payload"
          rows={2}
          maxLength={280}
          placeholder="Write a reply..."
          className={`w-full resize-none rounded-xl px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 ${
            payloadError
              ? 'border-2 border-rose-400 bg-white'
              : 'border border-stone-200 bg-white focus:border-stone-300'
          }`}
        />
        {payloadError && (
          <p className="pl-2 text-xs font-medium text-rose-400">{payloadError}</p>
        )}
        {formError && (
          <p className="pl-2 text-xs font-medium text-rose-400">{formError}</p>
        )}
        <div className="self-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-stone-800 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </form>
    </section>
  )
}
