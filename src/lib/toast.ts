import { writable } from 'svelte/store'

const toast = writable<string | null>(null)

toast.subscribe((value) => {
  let timeout: ReturnType<typeof setTimeout> | undefined

  if (value) {
    timeout = setTimeout(() => {
      toast.set(null)
    }, 5000)
  }

  return () => {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
})

export default toast
