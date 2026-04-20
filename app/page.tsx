import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { AddTweet } from './components/AddTweet'
import { logOut } from './profile/actions'

const PAGE_SIZE = 5

type HomePageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSession()
  // Defense-in-depth: proxy.ts already blocks unauthenticated access to `/`.
  if (!session.userId) {
    redirect('/log-in')
  }

  const { page } = await searchParams
  const parsedPage = Number(page)
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const skip = (currentPage - 1) * PAGE_SIZE

  const [tweets, totalCount] = await Promise.all([
    db.tweet.findMany({
      skip,
      take: PAGE_SIZE,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        tweet: true,
        created_at: true,
        user: { select: { username: true } },
        _count: { select: { likes: true } },
      },
    }),
    db.tweet.count(),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="flex flex-1 flex-col bg-white font-sans">
      <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <h1 className="text-lg font-bold text-stone-800">Tweets</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="text-xs font-semibold text-stone-500 transition-colors hover:text-stone-800"
          >
            Profile
          </Link>
          <form action={logOut}>
            <button
              type="submit"
              className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 transition-all hover:bg-stone-100"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="mb-8">
          <AddTweet />
        </div>

        {tweets.length === 0 ? (
          <p className="py-16 text-center text-sm text-stone-400">
            No tweets yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tweets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tweets/${t.id}`}
                  className="block rounded-2xl border border-stone-200 bg-stone-50 p-5 transition-all hover:border-rose-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">
                      @{t.user.username}
                    </span>
                    <span>
                      {t.created_at.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-stone-800">
                    {t.tweet}
                  </p>
                  <div className="mt-3 text-xs text-stone-400">
                    ♥ {t._count.likes}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-center gap-4"
        >
          <PageArrow
            direction="prev"
            href={`/?page=${currentPage - 1}`}
            disabled={!hasPrev}
          />
          <span className="text-xs font-semibold text-stone-500">
            {currentPage} / {totalPages}
          </span>
          <PageArrow
            direction="next"
            href={`/?page=${currentPage + 1}`}
            disabled={!hasNext}
          />
        </nav>
      </main>
    </div>
  )
}

function PageArrow({
  direction,
  href,
  disabled,
}: {
  direction: 'prev' | 'next'
  href: string
  disabled: boolean
}) {
  const label = direction === 'prev' ? '←' : '→'
  const srLabel = direction === 'prev' ? 'Previous page' : 'Next page'
  const base =
    'flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-600 transition-all'

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} cursor-not-allowed opacity-40`}
      >
        <span aria-hidden="true">{label}</span>
        <span className="sr-only">{srLabel}</span>
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-label={srLabel}
      className={`${base} hover:border-rose-300 hover:text-rose-400`}
    >
      <span aria-hidden="true">{label}</span>
    </Link>
  )
}
