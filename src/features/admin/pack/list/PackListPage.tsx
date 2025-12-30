import { apiGetCardPacks } from "@/api/client/pack";
import EmptyList from "@/components/listing/EmptyList";
import NavigationBar from "@/components/listing/NavigationBar";
import PaginationList from "@/components/listing/Pagination";
import { ProcessingListLarge } from "@/components/listing/ProcessingList";
import SearchBox from "@/components/listing/SearchBox";
import SortButton from "@/components/listing/SortButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ModalProvider } from "@/stores/components/ModalContext";
import { PaginationProvider, usePagination } from "@/stores/components/PaginationContext";
import { SortProvider, useSortContext } from "@/stores/components/SortContext";
import type { PageResult } from "@/types/api/result";
import type { ModelCardPackCards } from "@/types/model/cardPack";
import { useDebounce } from "@uidotdev/usehooks";
import { PlusCircle } from "lucide-react";
import { Fragment, useCallback, useState, useTransition } from "react";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { useFirstMountState } from "react-use/lib/useFirstMountState";
import useUpdateEffect from "react-use/lib/useUpdateEffect";

export default function PackListPage({page=1}:{page?:number}) {
  return <>
    <PaginationProvider initialPage={page}>
      <SortProvider initialSortData={["-created_at"]}>
        <ModalProvider>
          <Composer />
        </ModalProvider>
      </SortProvider>
    </PaginationProvider>
  </>
}

export function Composer(){
  //---> State
  const firstMounted = useFirstMountState();
  const [packs, packsSet] = useState<Array<ModelCardPackCards>>([]);
  const [fetching, fetchingStart] = useTransition();
  const {page, changeTotalPages} = usePagination();
  const {orderedSortData, getSortDataSure, togglerSort} = useSortContext();
  const sortDebounce = useDebounce(orderedSortData, 200);
  const [search, searchSet] = useState<string>("");

  const fetchCards = useCallback(()=>{
    return apiGetCardPacks({
      page,
      limit: 20,
      search: search,
      filter: [],
      sort: orderedSortData,
    }).s200(({data, totalPages}:PageResult<ModelCardPackCards[]>)=>{
      changeTotalPages(totalPages);
      packsSet(data);
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
  }, [page, search, sortDebounce]);

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
          <a href="/admin/card/create"><PlusCircle/> Add Card Packs</a>
        </Button>
        <SortButton 
          sort={getSortDataSure("created_at").direction}
          onClick={() => togglerSort("created_at")}
        >
          Created At
        </SortButton>
      </div>}
    />

        {(firstMounted || fetching) ? <>
      <div className="mx-2">
        <ProcessingListLarge />
      </div>
    </> : <>
      {packs.length < 1 ? <>
        <EmptyList>
          <Button asChild>
            <a href="/admin/card-pack/create"><PlusCircle/> Add more card packs</a>
          </Button>
        </EmptyList>
      </> : <>
        <Card className=" mx-2 ">
          <div className="flex flex-wrap justify-center">
            {packs.map((pack, index)=>{
              return <Fragment key={index}>
                <div className="w-64 sm:m-3 m-2">
               
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