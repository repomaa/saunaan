<script lang="ts">
  import toast from '$lib/toast'
  import { fade } from 'svelte/transition'
</script>

{#if $toast}
  <div class="fixed top-0 z-50 w-full">
    <div class="flex justify-center" transition:fade>
      <p
        class="text-white font-semibold rounded shadow-lg p-4 mt-8"
        class:bg-green-500={$toast.type === 'success'}
        class:bg-red-500={$toast.type === 'error'}
      >
        {$toast.message}
      </p>
    </div>
  </div>
{/if}
