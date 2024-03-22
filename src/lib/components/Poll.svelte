<script lang="ts">
  import {
    entries,
    filter,
    fromEntries,
    groupBy,
    isEmpty,
    isTruthy,
    map,
    pipe,
    sortBy,
    take,
  } from 'remeda'
  import { format, parse } from '@formkit/tempo'
  import { onMount } from 'svelte'
  import Vote from '$lib/components/Vote.svelte'
  import { z } from 'zod'
  import { invalidate } from '$app/navigation'
  import type { Poll } from '$lib/server/db/polls'

  export let poll: Poll

  const types = ['yes', 'no', 'maybe', null] as const

  let participantId: string | undefined
  let name = ''

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
    const response = await fetch(`/api/polls/${poll.id}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, name, votes }),
    })
    const body = await response.json()
    const result = z.object({ participantId: z.string() }).parse(body)

    await setPoll({ id: poll.id, participantId: result.participantId, name })
    participantId = result.participantId
    await invalidate(`polls:${poll.id}`)
  }

  $: sortedAppointments = pipe(
    poll.appointments,
    sortBy(({ from }) => from),
  )

  $: groupedAppointments = pipe(
    sortedAppointments,
    groupBy(({ from }) => format(from, 'YYYY-MM')),
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
      count: filter(votes, ({ type }) => ['yes', 'maybe'].includes(type)).length,
    })),
    filter(({ count }) => count > 0),
    sortBy([({ count }) => count, 'desc']),
    take(3),
  )

  const initials = (name: string) => {
    if (!name) {
      return ''
    }
    const [first, last] = name.split(/\s+/)
    return `${first[0]}${last?.[0] ?? ''}`.toUpperCase()
  }

  onMount(restoreParticipantId)
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
        <input
          type="text"
          bind:value={name}
          placeholder="Nimi"
          class="p-2 border rounded self-end sticky right-0 mb-3"
        />

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
          {#each bestAppointments as { from, to, count, url }}
            <li class="flex flex-col gap-3 p-3 border rounded">
              <h3 class="flex flex-col border-b-2">
                <span class="text-sm">{format(from, 'ddd')}</span>
                <span class="text-xl font-bold">{format(from, 'D.M.')}</span>
              </h3>
              <span class="text-sm">{format(from, 'HH:mm')} - {format(to, 'HH:mm')}</span>
              <span class="text-sm">(Sopii {count}:lle)</span>
              <a href={url} class="text-blue-500 hover:text-blue-600 hover:underline">Varaa</a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>
