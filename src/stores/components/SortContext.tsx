import type { SortData } from "@/types/model/filter";
import { createContext, useCallback, useContext, useState } from "react";

type SortContextProps = {
  sortData: Array<SortData>,
  orderedSortData: Array<SortData>,
  getSortData: (field:string)=>SortData|undefined, 
  getSortDataSure: (field:string)=>SortData,
  togglerSort: (field:string)=>void,
  changeSort: (field:string, direction:"asc"|"desc")=>void,
}

export const SortContext = createContext<SortContextProps>(null!);
export function SortProvider({initialSortData=[] , children }: {initialSortData?: Array<string>, children?: React.ReactNode  }){
  const [sortData, sortDataSet] = useState<Array<SortData>>( 
    initialSortData.map((s)=>{
      const field = s.replace(/^-/, "");
      const direction = s.startsWith("-") ? "desc" : "asc";
      return {field, direction: direction as "asc"|"desc"};
    })
  );
  const [orderedSortData, orderedSortDataSet] = useState<Array<SortData>>( 
    initialSortData.map((s)=>{
      const field = s.replace(/^-/, "");
      const direction = s.startsWith("-") ? "desc" : "asc";
      return {field, direction: direction as "asc"|"desc"};
    })
  );

  const getSortData = useCallback((field:string)=>{
    return sortData.find((e)=>e.field === field);
  }, [sortData]);

  const getSortDataSure = useCallback((field:string)=>{
    const sortItem = sortData.find((e)=>e.field === field);
    if(!sortItem) throw new Error(`Sort data for field "${field}" not found`);
    return sortItem;
  }, [sortData]);

  const togglerSort = useCallback((field:string)=>{
    sortDataSet((prev)=>{
      const existingIndex = prev.findIndex((e)=>e.field === field);
      if(existingIndex >= 0){
        prev[existingIndex].direction = prev[existingIndex].direction === "asc" ? "desc" : "asc";
        return [...prev];
      } 
      return prev;
    });
    // Push the order to front
    orderedSortDataSet((prev)=>{
      const existingIndex = prev.findIndex((e)=>e.field === field);
      if(existingIndex >= 0){
        const newArray = [...prev];
        newArray[existingIndex].direction = newArray[existingIndex].direction === "asc" ? "desc" : "asc";
        const [item] = newArray.splice(existingIndex, 1);
        newArray.unshift(item);
        return newArray;
      }
      return prev;
    });
  }, [sortData, sortDataSet]);

  const changeSort = useCallback((field:string, direction:"asc"|"desc")=>{
    sortDataSet((prev)=>{
      const existingIndex = prev.findIndex((e)=>e.field === field);
      if(existingIndex >= 0){
        prev[existingIndex].direction = direction;
        return [...prev];
      }
      return prev;
    });
    // Push the order to front
    orderedSortDataSet((prev)=>{
      const existingIndex = prev.findIndex((e)=>e.field === field);
      if(existingIndex >= 0){
        const newArray = [...prev];
        newArray[existingIndex].direction = direction;
        const [item] = newArray.splice(existingIndex, 1);
        newArray.unshift(item);
        return newArray;
      }
      return prev;
    });
  }, [sortData, sortDataSet]);

  return <SortContext.Provider value={{
    sortData,
    orderedSortData,
    getSortData,
    getSortDataSure,
    togglerSort,
    changeSort,
  }}>
    {children}
  </SortContext.Provider>;
}

export const useSortContext = () => useContext(SortContext);