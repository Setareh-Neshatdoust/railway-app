import type { RouteSearchValues } from "../components/RouteSearchForm";
import type { TrainStopsSearchValues } from "../components/TrainStopsSearchForm";

//A search found in the URL can be restored after browser's back button

export function routeSearchToUrl (values : RouteSearchValues){
    return{
        origin : values.origin,
        destination : values.destination,
        start_date : values.startDate,
        end_date : values.endDate
    }
}

export function routeSearchFromUrl (searchParams : URLSearchParams) : RouteSearchValues | null{

    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if(!origin || !destination || !startDate || !endDate) 
        return null
    return {origin, destination, startDate, endDate}
}

export function trainStopsSearchToUrl (values : TrainStopsSearchValues){
    return {
        train_number : values.trainNumber,
        origin : values.origin,
        tarvel_date: values.travelDate
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