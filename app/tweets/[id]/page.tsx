import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { LikeButton } from '@/app/components/LikeButton'
import { Responses, type ResponseItem } from '@/app/components/Responses'

type TweetDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function TweetDetailPage({
  params,
}: TweetDetailPageProps) {
  const session = await getSession()
  if (!session.userId) {
    redirect('/log-in')
  }

  const { id } = await params
  const tweetId = Number(id)
  if (!Number.isInteger(tweetId) || tweetId <= 0) {
    notFound()
  }

  const [tweet, currentUser] = await Promise.all([
    db.tweet.findUnique({
      where: { id: tweetId },
      select: {
        id: true,
        tweet: true,
        created_at: true,
        user: { select: { username: true, email: true } },
        _count: { select: { likes: true } },
        responses: {
          orderBy: { created_at: 'asc' },
          select: {
            id: true,
            payload: true,
            created_at: true,
            user: { select: { username: true } },
          },
        },
        likes: {
          where: { userId: session.userId },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.user.findUnique({
      where: { id: session.userId },
      select: { username: true },
    }),
  ])

  if (!tweet || !currentUser) {
    notFound()
  }

  const createdAt = tweet.created_at.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const initialResponses: ResponseItem[] = tweet.responses.map((r) => ({
    id: r.id,
    payload: r.payload,
    created_at: r.created_at.toISOString(),
    username: r.user.username,
  }))

  const initialLiked = tweet.likes.length > 0

  return (
    <div className="flex flex-1 flex-col bg-white font-sans">
      <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900"
        >
          ← Back
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <article className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-400">
              {tweet.user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-stone-800">
                @{tweet.user.username}
              </p>
              <p className="text-xs text-stone-500">{tweet.user.email}</p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-stone-800">
            {tweet.tweet}
          </p>

          <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4 text-xs text-stone-500">
            <span>{createdAt}</span>
            <LikeButton
              tweetId={tweet.id}
              initialLiked={initialLiked}
              initialCount={tweet._count.likes}
            />
          </div>
        </article>

        <Responses
          tweetId={tweet.id}
          currentUsername={currentUser.username}
          initialResponses={initialResponses}
        />
      </main>
    </div>
  )
}
