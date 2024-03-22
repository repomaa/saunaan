<script lang="ts">
  import Poll from '$lib/components/Poll.svelte'
  import type { Poll as PollData } from '$lib/server/db/polls'
  import { addDay, addHour } from '@formkit/tempo'
  import { randomString, sample, range } from 'remeda'

  type Participant = PollData['participants'][number]
  type Appointment = PollData['appointments'][number]

  const mockVote = (
    appointmentId: string,
    participants: Participant[],
  ): PollData['appointments'][number]['votes'][number] => {
    const id = randomString(10)
    const [type] = sample(['yes', 'no', 'maybe'] as const, 1)
    const [participant] = sample(participants, 1)

    if (!participant) {
      throw new Error('no participants')
    }

    return { id, type, appointmentId, participant, participantId: participant.id }
  }

  const mockAppointment = (pollId: string, participants: Participant[]): Appointment => {
    const id = randomString(10)
    const from = addDay(new Date(), Math.floor(Math.random() * 30))
    const to = addHour(from, 2)
    const votes = range(1, Math.floor(Math.random() * participants.length)).map(() =>
      mockVote(id, participants),
    )

    return { id, from, to, pollId, url: 'https://google.com', votes }
  }

  const mockParticipant = (pollId: string): Participant => {
    const id = randomString(10)
    const name = `Test User ${randomString(3)}`

    return { id, name, pollId }
  }

  const mockPoll = (): PollData => {
    const id = randomString(10)
    const createdAt = addHour(new Date(), Math.random() * -72)
    const participants = range(1, Math.floor(Math.random() * 10)).map(() => mockParticipant(id))
    const appointments = range(1, Math.floor(Math.random() * 20)).map(() =>
      mockAppointment(id, participants),
    )

    return { id, description: null, createdAt, participants, appointments }
  }

  $: poll = mockPoll()
</script>

<Poll {poll} />
