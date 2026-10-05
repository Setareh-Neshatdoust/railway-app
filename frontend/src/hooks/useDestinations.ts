import { useEffect,useState } from "react";
import { getDestinations } from "../api/client";

//Loading the destinations that Trainsats recorded for the chosen orogin
export function useDestinations(origin : string){
    const[destinations,setDestinations] = useState<string[]>([])
    const[loadedFor,setLoadedFor] = useState('')
    const[error,setError] = useState<string | null>(null)

    useEffect(()=>{
        if(!origin)
            return
        let cancelled = false

        getDestinations(origin)
        .then((data)=>{
            if (cancelled) return
            setDestinations(data)
            setError(null)
            setLoadedFor(origin)
        })
        .catch((err:Error)=>{
            if (cancelled)return
            setDestinations([])
            setError(err.message)
            setLoadedFor(origin)
        })
        return() => {
            cancelled = true
        }
    
    },[origin])

    const isCurrent = origin !== '' && loadedFor === origin
    return{
        destinations: isCurrent ? destinations : [],
        error: isCurrent ? error : null,
        isLoading : origin !== '' && !isCurrent

    }
}