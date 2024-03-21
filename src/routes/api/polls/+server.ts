import { z } from 'zod'
import type { RequestHandler } from './$types'
import { polls, appointments } from '$lib/server/db/schema'
import { parse } from '@formkit/tempo'
import { json } from '@sveltejs/kit'

const appointment = z.object({
  from: z.string().transform((v) => parse(v)),
  to: z.string().transform((v) => parse(v)),
  url: z.string(),
})

const payload = z.object({
  appointments: z.array(appointment),
})

export const POST: RequestHandler = async ({ request, locals: { db } }) => {
  const body = await request.json()
  const { appointments: data } = payload.parse(body)

  const pollId = await db.transaction(async (db) => {
    const [{ pollId }] = await db.insert(polls).values({}).returning({ pollId: polls.id })
    await db.insert(appointments).values(data.map((values) => ({ pollId, ...values })))
    return pollId
  })

  return json({ pollId }, { status: 201 })
}
