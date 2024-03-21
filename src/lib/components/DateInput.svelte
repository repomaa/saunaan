<script lang="ts">
  import { format as tempoFormat, parse } from '@formkit/tempo'

  let date = new Date()
  let className: string | undefined = undefined
  export let format = 'YYYY-MM-DD'
  export { date as value, className as class }

  let value: string

  const input = (date: Date) => (value = tempoFormat(date, format))
  const output = (value: string) => (date = parse(value, format))

  $: input(date)
  $: output(value)
</script>

<input type="date" bind:value class={className} />
