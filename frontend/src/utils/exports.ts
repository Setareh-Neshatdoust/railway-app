//Turning data into daownloadable files(CSV,JASON), no new request to backend

export interface CsvColumn<T> {
    label : string
    value : (row: T) => string| number | null
}

// Semicolon separator,decimal comma

const SEPARATOR = ";"

function formatCell (value : string | number| null) : string {
    if (value === null) return ''
    const text = typeof value ==='number' ? String (value) . replace('.', ',') : value
    if (/[";\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"` 
    return text
}

export function toCSV<T> (rows: T[], columns: CsvColumn<T>[] ): string {
    const header = columns.map((column)=> formatCell(column.label)).join (SEPARATOR)
    const lines = rows.map ((row) =>
    columns.map((column)=> formatCell(column.value(row))).join(SEPARATOR),)
    return [header, ...lines].join('\r\n')
}

//Make the browser save contents s a file called "fileName"

function downloadFile(fileName: string , content: string, mimeType: string): void{
    const blob = new Blob([content], {type: mimeType})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
}

export function downloadCsv<T>(fileName : string , rows: T[], columns : CsvColumn<T>[]) : void{
    downloadFile (fileName, '\uFEFF' + toCSV(rows, columns), 'text/csv;charset=utf-8')
}

export function downloadJson (fileName : string, data : unknown) : void {
    downloadFile (fileName, JSON.stringify(data, null,2), 'application/json')
}

//Builds a readable file name
export function makeFileName(parts: string[]) : string{
    return parts 
    .map((part) => part.trim().replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter ((part)=> part !== '')
    .join('_')
}