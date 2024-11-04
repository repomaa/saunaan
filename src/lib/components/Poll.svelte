<script lang="ts">
  import {
    entries,
    filter,
    first,
    flatMap,
    fromEntries,
    groupBy,
    isEmpty,
    isTruthy,
    last,
    map,
    pipe,
    sortBy,
    take,
  } from 'remeda'
  import { format, parse } from '@formkit/tempo'
  import { onMount } from 'svelte'
  import Vote from '$lib/components/Vote.svelte'
  import { z, type inferFlattenedErrors } from 'zod'
  import { invalidate } from '$app/navigation'
  import type { Poll } from '$lib/server/db/polls'
  import toast from '$lib/toast'
  import { fetchAppointments } from '$lib/varaamo-client'

  export let poll: Poll

  const types = ['yes', 'no', 'maybe', null] as const

  let participantId: string | undefined
  let name = ''

  const form = z.object({
    participantId: z.string().nullish(),
    name: z.string().min(1, 'Nimi on täytettävä'),
    votes: z.record(z.enum(['yes', 'no', 'maybe']).nullable()),
  })

  let formErrors: inferFlattenedErrors<typeof form> | undefined

  const restoreParticipantId = async () => {
    const { getPoll } = await import('$lib/idb')
    const storedPoll = await getPoll(poll.id)
    participantId = storedPoll?.participantId
    name = storedPoll?.name ?? ''
  }

  let votes: Record<string, 'yes' | 'no' | 'maybe' | null>
  $: votes = pipe(
    poll.appointments,
    map(({ votes }) =>
      participantId ? votes.find((vote) => vote.participantId === participantId) : undefined,
    ),
    filter(isTruthy),
    map(({ appointmentId, type }) => [appointmentId, type] as const),
    fromEntries(),
  )

  const toggleVote = (id: string) => {
    const type = votes[id] ? types[(types.indexOf(votes[id]) + 1) % types.length] : 'yes'
    const newVotes = { ...votes, [id]: null }
    if (type) {
      newVotes[id] = type
    }
    votes = newVotes
  }

  const save = async () => {
    const { setPoll } = await import('$lib/idb')
    const parseResult = form.safeParse({ participantId, name, votes })
    if (!parseResult.success) {
      formErrors = parseResult.error.flatten()
      toast.set({ type: 'error', message: 'Tallennus epäonnistui' })
      console.error(formErrors)
      return
    }

    const response = await fetch(`/api/polls/${poll.id}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parseResult.data),
    })
    const body = await response.json()
    const result = z.object({ participantId: z.string() }).parse(body)

    await setPoll({ id: poll.id, participantId: result.participantId, name })
    participantId = result.participantId
    await invalidate(`polls:${poll.id}`)
    toast.set({ type: 'success', message: 'Tallennettu' })
    formErrors = undefined
    setAppointments()
  }

  let appointments: ((typeof poll)['appointments'][number] & { bookingsFree: number })[] = []

  $: sortedAppointments = pipe(
    appointments,
    filter(({ from }) => from.getTime() > Date.now()),
    sortBy(({ from }) => from),
  )

  $: groupedAppointments = pipe(
    sortedAppointments,
    groupBy(({ from }) => format(from, 'YYYY-MM-01')),
    entries(),
    map(
      ([date, appointments]) =>
        [
          parse(date),
          pipe(
            appointments,
            groupBy(({ from }) => format(from, 'YYYY-MM-DD')),
            entries(),
            map(
              ([date, appointments]) =>
                [parse(date), sortBy(appointments, ({ from }) => from)] as const,
            ),
            sortBy(([date]) => date),
          ),
        ] as const,
    ),
    sortBy(([date]) => date),
  )

  $: bestAppointments = pipe(
    sortedAppointments,
    map(({ votes, ...appointment }) => ({
      ...appointment,
      yesCount: filter(votes, ({ type }) => type === 'yes').length,
      maybeCount: filter(votes, ({ type }) => type === 'maybe').length,
    })),
    map(({ yesCount, maybeCount, ...appointment }) => ({
      ...appointment,
      yesCount,
      maybeCount,
      score: yesCount + maybeCount * 0.5,
    })),
    filter(({ score }) => score > 0),
    sortBy([({ score }) => score, 'desc']),
    take(3),
  )

  const initials = (name: string) => {
    if (!name) {
      return ''
    }
    return name.slice(0, 2).toUpperCase()
  }

  const setAppointments = async () => {
    const sortedDates = pipe(
      poll.appointments,
      flatMap(({ from, to }) => [from, to]),
      sortBy((date) => date.getTime()),
    )
    const fetchedAppointments = await fetchAppointments({
      view: poll.view,
      from: first(sortedDates)!,
      to: last(sortedDates)!,
    })

    appointments = poll.appointments.map((appointment) => {
      const fetchedAppointment = fetchedAppointments.find(({ url }) => url === appointment.url)
      const bookingsFree = fetchedAppointment
        ? fetchedAppointment.bookingsMax - fetchedAppointment.bookingsCount
        : 0
      return { ...appointment, bookingsFree }
    })
  }

  onMount(() => {
    restoreParticipantId()
    setAppointments()
  })
</script>

<div class="p-4 sm:p-8">
  <h1 class="text-4xl mb-8"><a href="/">Saunaan</a></h1>

  <div class="flex flex-col gap-8">
    <div class="flex items-stretch gap-4 overflow-x-auto mb-8">
      <div class="flex flex-col justify-end items-end">
        <ul class="flex flex-col justify-end items-end gap-3 sticky left-0 bg-white pr-4 border-r">
          <li class="h-9">
            <span class="hidden sm:inline">{name}</span>
            <span class="inline sm:hidden">{initials(name)}</span>
          </li>
          {#each filter(poll.participants, ({ id }) => id !== participantId) as { name }}
            <li class="h-9">
              <span class="hidden sm:inline">{name}</span>
              <span class="inline sm:hidden" title={name}>{initials(name)}</span>
            </li>
          {/each}
        </ul>
      </div>

      <div class="flex flex-col gap-3">
        <div class="self-end sticky flex flex-col right-0 mb-3">
          <input
            type="text"
            bind:value={name}
            placeholder="Nimi"
            class="p-2 border bord rounded self-end sticky right-0 mb-3"
            class:border-red-500={formErrors?.fieldErrors.name}
          />
          {#if formErrors?.fieldErrors.name}
            <span class="text-sm text-red-500">{formErrors.fieldErrors.name}</span>
          {/if}
        </div>

        <ul class="flex gap-8">
          {#each groupedAppointments as [date, appointmentsForMonth]}
            <li>
              <h3 class="text-lg font-bold mb-4 border-b-2">{format(date, 'MMM')}</h3>
              <ul class="flex gap-8">
                {#each appointmentsForMonth as [date, appointments]}
                  <li>
                    <h4 class="flex flex-col mb-3 border-b">
                      <span class="text-sm">{format(date, 'ddd')}</span>
                      <span class="text-lg font-bold">{format(date, 'DD')}</span>
                    </h4>
                    <ul class="flex items-center gap-8">
                      {#each appointments as { from, to }}
                        <li class="flex flex-col w-9">
                          <span class="text-sm">{format(from, 'HH:mm')}</span>
                          <span class="text-sm">{format(to, 'HH:mm')}</span>
                        </li>
                      {/each}
                    </ul>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>

        <ul class="flex gap-8">
          {#each sortedAppointments as { id }}
            <li class="w-max">
              <button
                type="button"
                on:click={() => toggleVote(id)}
                class="border rounded w-9 h-9 hover:bg-gray-50"
              >
                <Vote type={votes[id]} />
              </button>
            </li>
          {/each}
        </ul>

        {#each filter(poll.participants, ({ id }) => id !== participantId) as { id }}
          <div>
            <ul class="flex gap-8">
              {#each sortedAppointments as { votes }}
                <li class="w-9 h-9 text-center">
                  <Vote type={votes.find(({ participantId }) => participantId === id)?.type} />
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </div>

    <button
      type="button"
      class="bg-green-500 text-white font-semibold p-2 rounded self-start hover:bg-green-600"
      on:click={save}>Tallenna</button
    >

    {#if !isEmpty(bestAppointments)}
      <div class="mt-8">
        <h2 class="text-2xl mb-4">Parhaat vuorot</h2>
        <ul class="flex flex-col sm:flex-row gap-8 mb-8">
          {#each bestAppointments as { from, to, yesCount, maybeCount, url, bookingsFree }}
            <li class="flex flex-col gap-3 p-3 border rounded">
              <h3 class="flex flex-col border-b-2">
                <span class="text-sm">{format(from, 'ddd')}</span>
                <span class="text-xl font-bold">{format(from, 'D.M.')}</span>
              </h3>
              <span class="text-sm">{format(from, 'HH:mm')} - {format(to, 'HH:mm')}</span>
              <span class="text-sm">
                Sopii
                {#if yesCount > 0}
                  {yesCount}:lle
                  {#if maybeCount > 0}
                    +
                  {/if}
                {/if}
                {#if maybeCount > 0}
                  ehkä {maybeCount}:lle
                {/if}
              </span>
              <span class="text-sm">
                Vapaita paikkoja: {bookingsFree}
              </span>
              <a href={url} class="text-blue-500 hover:text-blue-600 hover:underline">Varaa</a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>
