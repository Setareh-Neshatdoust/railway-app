import { useState ,useRef, useEffect} from 'react'

// lower case, accents removed, only letters and digits kept
function simplify(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

interface StationAutocompleteProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  disabled?:boolean
  hint?:string
  placeholder?:string 
}

export function StationAutocomplete({ 
  label, 
  value, 
  onChange, 
  options,
  disabled = false,
  hint,
  placeholder,
 }: StationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef <HTMLInputElement>(null)

  // Every matching station, in a list that scrolls. Dots, spaces, apostrophes and accents are ignored
  const wanted = simplify(value)
  const matches = wanted ? options.filter((option) => simplify(option).includes(wanted)) : options

  //Force the user to choose only defined destination for a specific origin instead of all suggested stations
  useEffect(()=>{
    const isInvalid = value !== '' && options.length>0 && !options.includes(value)
    inputRef.current?.setCustomValidity(isInvalid ? 'Please choose a station from the list': '')
  })

  return (
    <label className="flex flex-col gap-1 text-sm relative">
      {label}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        disabled = {disabled}
        placeholder={placeholder}
        required
        autoComplete="off"
        className="bg-panel border border-line rounded-md px-3 py-2 text-primary disabled:opacity-50"
      />
            {hint && <span className="text-xs text-muted">{hint}</span>}
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