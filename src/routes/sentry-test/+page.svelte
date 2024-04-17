<script lang="ts">
  const throwError = () => {
    throw new Error('test')
  }
</script>

<h1>Sentry test</h1>

<button on:click={throwError}>Throw error</button>
