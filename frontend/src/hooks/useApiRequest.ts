import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
//Runs on the backend request r the given parameters and keeps the results

export function useApiRequest<P , T> (params:P | null , load: (Params:P) => Promise<T> ){
    const[data, setData] = useState<T | null> (null)
    const[error, setError] = useState<string | null> (null)
    const[loadedFor, setLoadedFor] = useState<P | null> (null)

    useEffect(()=>{
        if(params === null)
            return
        let cancelled=false

        load(params)
        .then((result)=>{
            if(cancelled) return
            setData(result)
            setError(null)
            setLoadedFor(params)
        })
        .catch((err)=>{
            if(cancelled) return
            setData(null)
            setError(err instanceof ApiError ? err.message : 'Something unexpected went wrong.')
            setLoadedFor(params)
        })
        return () => {
            cancelled= true
        }
    }, [params,load])

    const isCurrent = params !== null && loadedFor ===params

    return{
        data: isCurrent ? data : null,
        error: isCurrent ? error : null,
        isLoading : params !== null && !isCurrent
    }
}