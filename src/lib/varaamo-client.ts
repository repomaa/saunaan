import { addDay, format, isBefore, parse } from '@formkit/tempo'
import z, { type output } from 'zod'
import { pipe, values, flatten } from 'remeda'

const appointment = z
  .object({
    date: z.string(),
    from: z.string(),
    to: z.string(),
    bookings_count: z.number(),
    bookings_max: z.number(),
    url: z.string().optional(),
  })
  .transform((data) => ({
    from: parse(`${data.date}T${data.from}`, 'YYYY-MM-DDTHH:mm'),
    to: parse(`${data.date}T${data.to}`, 'YYYY-MM-DDTHH:mm'),
    bookingsCount: data.bookings_count,
    bookingsMax: data.bookings_max,
    url: data.url,
  }))

export type Appointment = output<typeof appointment>

const appointments = z
  .record(z.string(), z.array(appointment))
  .transform((data) => pipe(data, values, flatten()))

type Appointments = output<typeof appointments>

const fetchWeek = async (date: Date, view: string) => {
  const response = await fetch(
    `https://www.varaaheti.fi/poliisienkesakoti/fi/api/public/locations/helsinki/views/${view}/classes/available?date=${format(date, 'YYYY-MM-DD')}&date_range=week&search_next_date=true`,
  )
  const { data } = await response.json()
  return appointments.parse(data)
}

export const fetchAppointments = async ({
  from,
  to,
  view,
}: {
  from: Date
  to: Date
  view: string
}) => {
  const appointmentPromises: Promise<Appointments>[] = []

  for (let date = from; isBefore(date, to); date = addDay(date, 7)) {
    appointmentPromises.push(fetchWeek(date, view))
  }

  const appointments = await Promise.all(appointmentPromises)

  return flatten(appointments)
}
