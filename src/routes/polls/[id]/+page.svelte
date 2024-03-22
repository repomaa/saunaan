<script lang="ts">
  import Poll from '$lib/components/Poll.svelte'
  import type { PageData } from './$types'
  export let data: PageData
  $: ({ poll } = data)
</script>

<Poll {poll} />
