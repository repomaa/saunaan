<script lang="ts">
  const voteLabels = { yes: '👍', no: '👎', maybe: '🤔' } as const

  export let type: 'yes' | 'no' | 'maybe' | null | undefined
</script>

{#if type}
  {voteLabels[type]}
{/if}
