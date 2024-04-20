<script lang="ts">
  import { goto } from '$app/navigation'
  import AppointmentList from '$lib/components/AppointmentList.svelte'
  import Filter from '$lib/components/Filter.svelte'
  import type { Appointment } from '$lib/varaamo-client'
  import { z } from 'zod'

  const createPoll = async (appointments: Appointment[], view: string) => {
    const response = await fetch('/api/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appointments, view }),
    })

    const data = await response.json()
    const { pollId } = z.object({ pollId: z.string() }).parse(data)
    goto(`/polls/${pollId}`)
  }
</script>

<div class="container mx-auto max-w-3xl p-4">
  <h1 class="text-5xl mb-8 sm:mt-8">Saunaan</h1>

  <Filter let:appointments let:view>
    <div class="flex justify-between items-center w-full mb-8">
      <h2 class="text-2xl">Vapaat ajat</h2>

      <button
        on:click={() => createPoll(appointments, view)}
        class="bg-green-500 text-white p-2 font-semibold rounded"
      >
        Luo kysely
      </button>
    </div>

    <AppointmentList {appointments} />
  </Filter>
</div>
