import type { Database } from '.'

export type Poll = NonNullable<Awaited<ReturnType<typeof findPoll>>>

export const findPoll = async (db: Database, id: string) => {
  return await db.query.polls.findFirst({
    where: (polls, { eq }) => eq(polls.id, id),
    with: {
      appointments: { with: { votes: { with: { participant: true } } } },
      participants: true,
    },
  })
}
