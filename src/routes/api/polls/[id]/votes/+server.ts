import { z } from 'zod'
import type { RequestHandler } from './$types'
import db, { votes, participants } from '$lib/server/db'
import { json } from '@sveltejs/kit'
import { sql, inArray, and, eq } from 'drizzle-orm'
import { entries, filter, isEmpty, isTruthy, map, pipe } from 'remeda'

const payload = z.object({
  participantId: z.string().optional(),
  name: z.string(),
  votes: z.record(z.string(), z.enum(['yes', 'no', 'maybe']).nullable()),
})

const upsertParticipant = async (
  tx: typeof db,
  { id, pollId, name }: typeof participants.$inferInsert,
) => {
  const [participant] = await tx
    .insert(participants)
    .values({ id, pollId, name })
    .onConflictDoUpdate({ target: participants.id, set: { name } })
    .returning()

  return participant
}

const upsertVotes = async (tx: typeof db, values: Array<typeof votes.$inferInsert>) => {
  await tx
    .insert(votes)
    .values(values)
    .onConflictDoUpdate({
      target: [votes.participantId, votes.appointmentId],
      set: { type: sql.raw(`excluded.${votes.type.name}`) },
    })
    .execute()
}

export const POST: RequestHandler = async ({ params: { id: pollId }, request }) => {
  const body = await request.json()
  const { participantId, name, votes: voteValues } = payload.parse(body)
  const deletedVoteAppointmentIds = pipe(
    voteValues,
    entries(),
    filter(([, type]) => !type),
    map(([id]) => id),
  )

  const participant = await db.transaction(async (db) => {
    const participant = await upsertParticipant(db, { id: participantId, pollId, name })
    if (!isEmpty(deletedVoteAppointmentIds)) {
      await db
        .delete(votes)
        .where(
          and(
            eq(votes.participantId, participant.id),
            inArray(votes.appointmentId, deletedVoteAppointmentIds),
          ),
        )
        .execute()
    }

    await upsertVotes(
      db,
      pipe(
        voteValues,
        entries(),
        map(([appointmentId, type]) =>
          type ? { appointmentId, type, participantId: participant.id } : null,
        ),
        filter(isTruthy),
      ),
    )

    return participant
  })

  return json({ participantId: participant.id }, { status: 201 })
}
