<script lang="ts">
  import InputDate from '$lib/components/DateInput.svelte'
  import { range } from 'remeda'
  import { fetchAppointments, type Appointment } from '$lib/varaamo-client'
  import { addMonth } from '@formkit/tempo'

  const WEEKDAY_NAMES = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'] as const

  import { appointmentsFilter } from '$lib/util'
  let from = new Date()
  let to = addMonth(from, 1)
  let view = 'naistensaunavuorot'
  let minFree = 4
  let minTime = 0
  let maxTime = 23
  let weekdays = [0, 1, 2, 3, 4, 5, 6]

  let unfilteredAppointments: Appointment[] = []
  $: fetchAppointments({ from, to, view }).then((a) => (unfilteredAppointments = a))
  $: appointments = unfilteredAppointments.filter(
    appointmentsFilter({ minFree, minTime, maxTime, weekdays }),
  )
</script>

<form class="mb-8">
  <div class="flex gap-4">
    <fieldset>
      <legend>Päivämäärä väliltä</legend>

      <InputDate bind:value={from} class="border rounded p-2" />
      -
      <InputDate bind:value={to} class="border rounded p-2" />
    </fieldset>

    <label class="flex flex-col">
      <span>Henkilöitä</span>
      <input
        type="number"
        bind:value={minFree}
        maxLength={1}
        max={9}
        min={1}
        class="border rounded p-2"
      />
    </label>

    <fieldset>
      <legend>Vuoro</legend>
      <div class="flex flex-col">
        <label>
          <input type="radio" bind:group={view} value="naistensaunavuorot" />
          Naisten
        </label>
        <label>
          <input type="radio" bind:group={view} value="miestensaunavuorot" />
          Miesten
        </label>
      </div>
    </fieldset>
  </div>

  <div class="flex gap-4">
    <fieldset>
      <legend>Kellonaika väliltä</legend>
      <input
        type="number"
        bind:value={minTime}
        maxLength={2}
        max={Math.min(23, maxTime - 1)}
        min={0}
        class="border rounded p-2"
      />
      -
      <input
        type="number"
        bind:value={maxTime}
        maxLength={2}
        max={23}
        min={Math.max(0, minTime + 1)}
        class="border rounded p-2"
      />
    </fieldset>
    <fieldset>
      <legend class="mb-2">Viikonpäivät</legend>
      <div class="flex gap-2">
        {#each [...range(1, 7), 0] as i}
          <label>
            <input type="checkbox" bind:group={weekdays} value={i} />
            {WEEKDAY_NAMES[i]}
          </label>
        {/each}
      </div>
    </fieldset>
  </div>
</form>

<slot {appointments} />
