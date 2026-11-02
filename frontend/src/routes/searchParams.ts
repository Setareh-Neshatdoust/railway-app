import type { RouteSearchValues } from "../components/RouteSearchForm";
import type { TrainStopsSearchValues } from "../components/TrainStopsSearchForm";

// Address of a page with its parameters; "back" is the page that opens it, for the Back link
export function pageUrl(path: string, params: Record<string, string>, back?: string): string {
    const all = back ? { ...params, back } : params
    return `${path}?${new URLSearchParams(all)}`
}
//A search found in the URL can be restored after browser's back button
// The page to go back to. Only addresses inside this app (starting with one "/") are accepted
export function backFromUrl(searchParams: URLSearchParams): string {
    const back = searchParams.get('back')
    return back && back.startsWith('/') && !back.startsWith('//') ? back : '/'
}

export function routeSearchToUrl (values : RouteSearchValues){
    const params : Record<string,string> = {
        origin : values.origin,
        destination : values.destination,
        start_date : values.startDate,
        end_date : values.endDate
    }
    if(values.includeStations) params.stations = '1'
    if(values.mode === 'stops') params.mode = 'stops'
    return params
}

export function routeSearchFromUrl (searchParams : URLSearchParams) : RouteSearchValues | null{

    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if(!origin || !destination || !startDate || !endDate) 
        return null
    const includeStations= searchParams.get('stations') === '1'
    const mode = searchParams.get('mode') === 'stops' ? 'stops' : 'relation'
    return {origin, destination, startDate, endDate, includeStations, mode}
}

export function trainStopsSearchToUrl (values : TrainStopsSearchValues){
    return {
        train_number : values.trainNumber,
        origin : values.origin,
        travel_date: values.travelDate
    }
}

export function trainStopsSearchfromUrl (searchParams : URLSearchParams) : TrainStopsSearchValues | null{

    const trainNumber = searchParams.get('train_number')
    const origin = searchParams.get('origin')
    const travelDate = searchParams.get('travel_date')
    if(!trainNumber || !origin || !travelDate)
        return null
    
    return{trainNumber, origin, travelDate}  
}

//Train analysis, one train on one route over a date range
export interface TrainAnalysisValues{
    trainNumber : string
    origin : string
    destination : string
    startDate : string
    endDate : string
}

export function trainAnalysisToUrl (values : TrainAnalysisValues){
    return{
        train_number : values.trainNumber,
        origin : values.origin,
        destination : values.destination,
        start_date : values.startDate,
        end_date : values.endDate
    }
}
export function trainAnalysisFromUrl(searchParams : URLSearchParams) : TrainAnalysisValues | null{
    const trainNumber = searchParams.get('train_number')
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    if(!trainNumber || !origin || !destination || !startDate || !endDate)
        return null
    return {trainNumber, origin, destination, startDate, endDate}
}

//Segment analysis, from the origin to one intermediate stop over a date range
export interface SegmentSearchValues{
    origin : string
    destination : string
    startDate : string
    endDate : string
}

export function segmentSearchToUrl (values : SegmentSearchValues){
    return{
        origin : values.origin,
        destination : values.destination,
        start_date : values.startDate,
        end_date : values.endDate
    }
}

export function segmentSearchFromUrl(searchParams : URLSearchParams) : SegmentSearchValues | null{
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    if(!origin || !destination || !startDate || !endDate)
        return null
    return {origin, destination, startDate, endDate}
}