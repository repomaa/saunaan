import { type DBSchema, openDB } from 'idb'

interface Poll {
  id: string
  participantId: string
  name: string
}

interface Database extends DBSchema {
  polls: {
    key: string
    value: Poll
  }
}

const db = openDB<Database>('saunaan', 1, {
  upgrade(db) {
    db.createObjectStore('polls', { keyPath: 'id', autoIncrement: false })
  },
})

export const getPoll = async (id: string) => {
  return (await db).get('polls', id)
}

export const setPoll = async (poll: Poll) => {
  return (await db).put('polls', poll)
}
