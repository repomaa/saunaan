<script lang="ts">
  import type { Appointment } from '$lib/varaamo-client'
  import { format } from '@formkit/tempo'
  import { groupBy, pipe, entries } from 'remeda'

  export let appointments: Appointment[]
  $: groupedAppointments = pipe(
    appointments,
    groupBy(({ from }) => format(from, 'YYYY-MM-DD')),
    entries(),
  )
</script>

<ul class="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {#each groupedAppointments as [date, appointmentsForDate]}
    <li class="border rounded px-4 py-2">
      <h4 class="flex flex-col mb-3 border-b">
        <span class="text-sm">{format(date, 'ddd')}</span>
        <span class="text-lg font-bold">{format(date, 'DD.MM.')}</span>
      </h4>
      <ul class="grid grid-cols-3 gap-2">
        {#each appointmentsForDate as { from, to, url }}
          <li class="flex items-center gap-8">
            <a href={url} class="flex flex-col w-9 hover:underline">
              <span class="text-sm">{format(from, 'HH:mm')}</span>
              <span class="text-sm">{format(to, 'HH:mm')}</span>
            </a>
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>
