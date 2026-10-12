
import DatePicker, { registerLocale } from 'react-datepicker'
import { it } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import { dateToIso, isoToDate } from '../utils/dates'

// Italian month and day names, weeks starting on Monday
registerLocale('it', it)

interface ItalianDateInputProps {
  label: string
  value: string // ISO date "YYYY-MM-DD", or '' when empty
  onChange: (value: string) => void
  min?: string // ISO date
  max?: string // ISO date
  required?: boolean
}

// A date field that always shows and accepts Italian format (gg/mm/aaaa), with a calendar in Italian, while giving the rest of the app ISO dates.
export function ItalianDateInput({ label, value, onChange, min, max, required = false }: ItalianDateInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <DatePicker
        selected={isoToDate(value)}
        onChange={(date: Date | null) => onChange(dateToIso(date))}
        locale="it"
        dateFormat="dd/MM/yyyy"
        placeholderText="gg/mm/aaaa"
        minDate={isoToDate(min ?? '') ?? undefined}
        maxDate={isoToDate(max ?? '') ?? undefined}
        required={required}
        wrapperClassName="w-full"
        className="w-full bg-panel border border-line rounded-md px-3 py-2 text-primary"
      />
    </label>
  )
}