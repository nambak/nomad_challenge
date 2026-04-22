import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

type SeedUser = {
  username: string
  email: string
  password: string
  bio: string
}

const SEED_USERS: SeedUser[] = [
  {
    username: 'alice',
    email: 'alice@example.com',
    password: 'Password123',
    bio: 'Wanderer of the open web.',
  },
  {
    username: 'bob',
    email: 'bob@example.com',
    password: 'Password123',
    bio: 'Writes about code, coffee, and clouds.',
  },
]

// 16 tweets → 4 pages at PAGE_SIZE=5 (5 / 5 / 5 / 1)
const TWEET_TEXTS: { author: 'alice' | 'bob'; tweet: string }[] = [
  { author: 'alice', tweet: 'Hello, tweet-world! 👋' },
  { author: 'bob', tweet: 'Just shipped a tiny feature. Feels good.' },
  { author: 'alice', tweet: 'Next.js 16 server actions are surprisingly ergonomic.' },
  { author: 'bob', tweet: 'TIL: Prisma 7 supports driver adapters by default.' },
  { author: 'alice', tweet: 'Rewriting the pagination logic for the 4th time.' },
  { author: 'bob', tweet: 'Coffee count today: 3. Productivity: debatable.' },
  { author: 'alice', tweet: 'Shipping > perfecting. Usually.' },
  { author: 'bob', tweet: 'Reading old commit messages is a form of time travel.' },
  { author: 'alice', tweet: 'Tailwind v4 zero-config is genuinely nice.' },
  { author: 'bob', tweet: 'Async components still feel like magic sometimes.' },
  { author: 'alice', tweet: 'Wrote a seed script. Now the empty state is no longer lonely.' },
  { author: 'bob', tweet: 'useFormStatus is my new favorite React 19 hook.' },
  { author: 'alice', tweet: 'Debugging hydration errors: a rite of passage.' },
  { author: 'bob', tweet: 'Iron-session is underrated for small projects.' },
  { author: 'alice', tweet: 'Small wins compound. One tiny refactor at a time.' },
  { author: 'bob', tweet: 'Tomorrow-me will thank present-me for these tests.' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Upsert seed users (idempotent re-hashes password, which is fine for dev).
  const users = new Map<string, { id: number }>()
  for (const u of SEED_USERS) {
    const hashed = await bcrypt.hash(u.password, 12)
    const user = await db.user.upsert({
      where: { email: u.email },
      update: { username: u.username, password: hashed, bio: u.bio },
      create: {
        username: u.username,
        email: u.email,
        password: hashed,
        bio: u.bio,
      },
      select: { id: true },
    })
    users.set(u.username, user)
    console.log(`  ✓ user ${u.username} (id=${user.id})`)
  }

  // Clear tweets/likes belonging to seed users so re-runs don't duplicate.
  const seedUserIds = Array.from(users.values()).map((u) => u.id)
  await db.like.deleteMany({ where: { userId: { in: seedUserIds } } })
  await db.tweet.deleteMany({ where: { userId: { in: seedUserIds } } })
  console.log('  ✓ cleared previous seed tweets and likes')

  // Insert tweets in order with staggered timestamps so `orderBy desc` is stable.
  const now = Date.now()
  const createdTweets: { id: number }[] = []
  for (let i = 0; i < TWEET_TEXTS.length; i++) {
    const { author, tweet } = TWEET_TEXTS[i]
    const user = users.get(author)
    if (!user) throw new Error(`Unknown seed author: ${author}`)
    // Oldest first in array → earliest timestamp.
    const createdAt = new Date(now - (TWEET_TEXTS.length - i) * 60_000)
    const created = await db.tweet.create({
      data: {
        tweet,
        userId: user.id,
        created_at: createdAt,
        updated_at: createdAt,
      },
      select: { id: true },
    })
    createdTweets.push(created)
  }
  console.log(`  ✓ inserted ${createdTweets.length} tweets`)

  // Add a few likes for visual variety on the list page.
  const alice = users.get('alice')!
  const bob = users.get('bob')!
  const likeTargets = [
    { userId: alice.id, tweetId: createdTweets[1].id },
    { userId: alice.id, tweetId: createdTweets[3].id },
    { userId: bob.id, tweetId: createdTweets[0].id },
    { userId: bob.id, tweetId: createdTweets[2].id },
    { userId: bob.id, tweetId: createdTweets[4].id },
  ]
  for (const like of likeTargets) {
    await db.like.create({ data: like })
  }
  console.log(`  ✓ inserted ${likeTargets.length} likes`)

  console.log('🌱 Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
