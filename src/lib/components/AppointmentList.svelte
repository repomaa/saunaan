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

<ul class="flex flex-col gap-4">
  {#each groupedAppointments as [date, appointmentsForDate]}
    <li class="border rounded px-4 py-2">
      <h4 class="text-xl mb-4">{format(date, 'dddd, DD.MM.')}</h4>
      <ul class="grid grid-cols-3">
        {#each appointmentsForDate as appointment}
          <li>
            <a href={appointment.url}>
              {format(appointment.from, 'HH:mm')} - {format(appointment.to, 'HH:mm')}
            </a>
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>
