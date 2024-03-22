import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { findPoll } from '$lib/server/db/polls'

export const load: PageServerLoad = async ({ params: { id }, depends, locals: { db } }) => {
  depends(`polls:${id}`)

  const poll = await findPoll(db, id)

  if (!poll) {
    error(404, 'Poll not found')
  }

  return { poll }
}
