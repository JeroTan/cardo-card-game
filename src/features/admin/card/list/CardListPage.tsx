import EmptyList from "@/components/listing/EmptyList";
import ProcessingList, { ProcessingListLarge } from "@/components/listing/ProcessingList";
import { Button } from "@/components/ui/button";
import type { ModelCardWithPackItBelongsTo } from "@/types/model/cards"
import { PlusCircle } from "lucide-react";
import { Fragment, useCallback, useEffect, useState, useTransition } from "react"
import {useFirstMountState} from "react-use";
import CardItem from "./CardItem";
import { apiGetCards } from "@/api/client/card";
import type { PageResult } from "@/types/api/result";
import { Card } from "@/components/ui/card";
import { ModalProvider } from "@/stores/components/ModalContext";
import { PaginationProvider, usePagination } from "@/stores/components/PaginationContext";
import PaginationList from "@/components/listing/Pagination";
import { useUpdateEffect, useEffectOnce } from "react-use"
import NavigationBar from "@/components/listing/NavigationBar";
import SearchBox from "@/components/listing/SearchBox";
import SortButton from "@/components/listing/SortButton";
import { SortProvider, useSortContext } from "@/stores/components/SortContext";
import { useDebounce } from "@uidotdev/usehooks";

export default function CardListPage({
  page,
}:{
  page:number,
}){

  return <>
    <PaginationProvider initialPage={page}>
      <SortProvider initialSortData={["-created_at", "name", "atk", "def"]}>
        <ModalProvider>
          <Composer />
        </ModalProvider>
      </SortProvider>
    </PaginationProvider>
  </>;
}

function Composer(){
   //---> State
  const firstMounted = useFirstMountState();
  const [cards, cardsSet] = useState<Array<ModelCardWithPackItBelongsTo>>([]);
  const [fetching, fetchingStart] = useTransition();
  const {page, changeTotalPages} = usePagination();
  const {orderedSortData, getSortDataSure, togglerSort} = useSortContext();
  const sortDebounce = useDebounce(orderedSortData, 200);
  const [search, searchSet] = useState<string>("");

  //---> Functionalities
  const fetchCards = useCallback(()=>{
    return apiGetCards({
      page,
      limit: 20,
      search: search,
      filter: [],
      sort: orderedSortData,
    }).s200(({data, totalPages}:PageResult<ModelCardWithPackItBelongsTo[]>)=>{
      changeTotalPages(totalPages);
      cardsSet(data);
    }).promiseResponse;
  }, [page, search, orderedSortData]);

  //---> Effects
  useEffectOnce(()=>{
    fetchingStart(async ()=>{
      await fetchCards();
    });
  });

  useUpdateEffect(()=>{
    fetchingStart(async ()=>{
      await fetchCards();
    });
  }, [page, search, sortDebounce])

  return <>
    <NavigationBar 
      className="mb-5 mx-2"
      leftChildren={<div className="mr-auto">
        <SearchBox 
          updateValue={(value)=>{
            searchSet(value);
          }}
        />
      </div>}
      rightChildren={<div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href="/admin/card/create"><PlusCircle/> Add New Card</a>
        </Button>
        <SortButton 
          sort={getSortDataSure("created_at").direction}
          onClick={() => togglerSort("created_at")}
        >
          Created At
        </SortButton>
        <SortButton 
          sort={getSortDataSure("name").direction}
          onClick={() => togglerSort("name")}
        >
          Name
        </SortButton>
        <SortButton 
          sort={getSortDataSure("atk").direction}
          onClick={() => togglerSort("atk")}
        >
          Attack
        </SortButton>
        <SortButton 
          sort={getSortDataSure("def").direction}
          onClick={() => togglerSort("def")}
        >
          Defense
        </SortButton>
      </div>}
    />
      
    
    {(firstMounted || fetching) ? <>
      <div className="mx-2">
        <ProcessingListLarge />
      </div>
    </> : <>
      {cards.length < 1 ? <>
        <EmptyList>
          <Button asChild>
            <a href="/admin/card/create"><PlusCircle/> Add more cards</a>
          </Button>
        </EmptyList>
      </> : <>
        <Card className=" mx-2 ">
          <div className="flex flex-wrap justify-center">
            {cards.map((card, index)=>{
              return <Fragment key={index}>
                <div className="w-64 sm:m-3 m-2">
                  <CardItem {...card} />
                </div>
              </Fragment>
            })}
            <div className="w-64 sm:mx-3 mx-2"></div>
            <div className="w-64 sm:mx-3 mx-2"></div>
            <div className="w-64 sm:mx-3 mx-2"></div>
            <div className="w-64 sm:mx-3 mx-2"></div>
          </div>
        </Card>
        <aside className="mt-5">
          <PaginationList />
        </aside>
      </>}


    </>}
  </>
}