import { useState } from 'react'

interface StationAutocompleteProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}

export function StationAutocomplete({ label, value, onChange, options }: StationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)

  const matches = value
  ? options.filter((option) => option.toLowerCase().includes(value.toLowerCase())).slice(0, 10)
  : options.slice(0, 10)

  return (
    <label className="flex flex-col gap-1 text-sm relative">
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        required
        autoComplete="off"
        className="bg-panel border border-line rounded-md px-3 py-2 text-primary"
      />
      {isOpen && matches.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-panel border border-line rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
          {matches.map((match) => (
            <li
              key={match}
              onMouseDown={() => {
                onChange(match)
                setIsOpen(false)
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-line"
            >
              {match}
            </li>
          ))}
        </ul>
      )}
    </label>
  )
}