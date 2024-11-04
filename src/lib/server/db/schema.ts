import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const polls = pgTable('polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: varchar('description'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  view: varchar('view').notNull().default('naistensaunavuoro'),
})

export const pollsRelations = relations(polls, ({ many }) => ({
  appointments: many(appointments),
  participants: many(participants),
}))

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  from: timestamp('from', { withTimezone: true, mode: 'date' }).notNull(),
  to: timestamp('to', { withTimezone: true, mode: 'date' }).notNull(),
  url: varchar('url').notNull(),
  pollId: uuid('pollId')
    .references(() => polls.id, { onDelete: 'cascade' })
    .notNull(),
})

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  poll: one(polls, { fields: [appointments.pollId], references: [polls.id] }),
  votes: many(votes),
}))

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  pollId: uuid('pollId')
    .references(() => polls.id, { onDelete: 'cascade' })
    .notNull(),
})

export const participantsRelations = relations(participants, ({ one, many }) => ({
  poll: one(polls, { fields: [participants.pollId], references: [polls.id] }),
  votes: many(votes),
}))

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('mode', { enum: ['yes', 'maybe'] }).notNull(),
    participantId: uuid('participantId')
      .references(() => participants.id, { onDelete: 'cascade' })
      .notNull(),
    appointmentId: uuid('appointmentId')
      .references(() => appointments.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (t) => ({
    uniqueByParticipantAndAppointment: unique().on(t.participantId, t.appointmentId),
  }),
)

export const votesRelations = relations(votes, ({ one }) => ({
  participant: one(participants, { fields: [votes.participantId], references: [participants.id] }),
  appointment: one(appointments, { fields: [votes.appointmentId], references: [appointments.id] }),
}))
