<script lang="ts">
  import AppointmentList from '$lib/components/AppointmentList.svelte'
  import Filter from '$lib/components/Filter.svelte'
  import type { Appointment } from '$lib/varaamo-client'

  const createPoll = async (appointments: Appointment[]) => {
    fetch('/api/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appointments }),
    })
  }
</script>

<div class="container mx-auto max-w-2xl py-4">
  <h1 class="text-5xl my-8">Saunaan</h1>

  <Filter let:appointments>
    <div class="flex justify-between items-center w-full mb-8">
      <h2 class="text-2xl">Vapaat ajat</h2>

      <button
        on:click={() => createPoll(appointments)}
        class="bg-green-500 text-white p-2 font-semibold rounded"
      >
        Luo kysely
      </button>
    </div>

    <AppointmentList {appointments} />
  </Filter>
</div>
