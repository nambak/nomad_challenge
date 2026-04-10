'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'
import { SubmitButton } from './components/SubmitButton'

const initialState: LoginState = { success: false }

export default function Home() {
  const [state, formAction] = useActionState(login, initialState)

  const emailError = state.errors?.email?.[0]
  const usernameError = state.errors?.username?.[0]
  const passwordError = state.errors?.password?.[0]

  return (
    <div className="flex flex-1 items-center justify-center bg-white font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-6">
        {/* Flame Logo */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          className="text-rose-400"
        >
          <path
            d="M12 23C6.5 23 2 18.5 2 13c0-3.5 2-6.5 4-8.5 0 0 .5 3.5 3 5C9.5 7 11 2 11 2c1 2.5 3 5.5 3 5.5s2-1.5 2-4c2 2.5 4 5.5 4 9.5 0 5.5-4.5 10-8 10z"
            fill="currentColor"
          />
          <path
            d="M12 23c-2.5 0-5-2-5-5.5 0-2 1-3.5 2-4.5 0 0 .5 2 1.5 3 .5-1.5 1.5-3.5 1.5-3.5s1 1.5 1.5 3.5c1-1 1.5-3 1.5-3 1 1 2 2.5 2 4.5 0 3.5-2.5 5.5-5 5.5z"
            fill="white"
            fillOpacity="0.4"
          />
        </svg>

        {/* Form */}
        <form action={formAction} className="flex w-full flex-col gap-4">
          {/* Email */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className={`w-full rounded-full py-3 pl-11 pr-4 text-sm text-stone-800 outline-none placeholder:text-stone-400 ${
                  emailError
                    ? 'border-2 border-rose-400 bg-white'
                    : 'border border-stone-200 bg-stone-100/60 focus:border-stone-300 focus:bg-white'
                }`}
              />
            </div>
            {emailError && (
              <p className="mt-1.5 pl-4 text-xs font-medium text-rose-400">
                {emailError}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </span>
              <input
                type="text"
                name="username"
                placeholder="Username"
                className={`w-full rounded-full py-3 pl-11 pr-4 text-sm text-stone-800 outline-none placeholder:text-stone-400 ${
                  usernameError
                    ? 'border-2 border-rose-400 bg-white'
                    : 'border border-stone-200 bg-stone-100/60 focus:border-stone-300 focus:bg-white'
                }`}
              />
            </div>
            {usernameError && (
              <p className="mt-1.5 pl-4 text-xs font-medium text-rose-400">
                {usernameError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className={`w-full rounded-full py-3 pl-11 pr-4 text-sm text-stone-800 outline-none placeholder:text-stone-400 ${
                  passwordError
                    ? 'border-2 border-rose-400 bg-white'
                    : 'border border-stone-200 bg-stone-100/60 focus:border-stone-300 focus:bg-white'
                }`}
              />
            </div>
            {passwordError && (
              <p className="mt-1.5 pl-4 text-xs font-medium text-rose-400">
                {passwordError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <SubmitButton />

          {/* Success Message */}
          {state.success && (
            <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              {state.message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
