import type { Appointment } from '$lib/varaamo-client'

export const appointmentsFilter = ({
  minFree,
  minTime,
  maxTime,
  weekdays,
}: {
  minFree: number
  minTime: number
  maxTime: number
  weekdays: number[]
}) => {
  return ({ bookingsMax, bookingsCount, from, to }: Appointment) => {
    if (bookingsMax - bookingsCount < minFree) {
      return false
    }

    if (!weekdays.includes(from.getDay())) {
      return false
    }

    if (from.getHours() < minTime) {
      return false
    }

    if (to.getHours() > maxTime) {
      return false
    }

    return true
  }
}
