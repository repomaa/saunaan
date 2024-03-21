import db from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params: { id }, depends }) => {
  depends(`polls:${id}`)

  const poll = await db.query.polls.findFirst({
    where: (polls, { eq }) => eq(polls.id, id),
    with: {
      appointments: { with: { votes: { with: { participant: true } } } },
      participants: true,
    },
  })

  if (!poll) {
    error(404, 'Poll not found')
  }

  return { poll }
}
