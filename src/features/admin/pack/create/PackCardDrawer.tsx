import { apiGetCardsNoPacks } from "@/api/client/card";
import EmptyList from "@/components/listing/EmptyList";
import { NavigationBarClean } from "@/components/listing/NavigationBar";
import PaginationList from "@/components/listing/Pagination";
import { ProcessingListLarge } from "@/components/listing/ProcessingList";
import SearchBox from "@/components/listing/SearchBox";
import SortButton from "@/components/listing/SortButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/stores/components/PaginationContext";
import { useSortContext } from "@/stores/components/SortContext";
import type { PageResult } from "@/types/api/result";
import type { ModelCardWithPackItBelongsTo } from "@/types/model/cards";
import { useDebounce } from "@uidotdev/usehooks";
import { PlusCircle } from "lucide-react";
import { Fragment, useCallback, useState, useTransition } from "react";
import { useEffectOnce, useFirstMountState, useUpdateEffect } from "react-use";
import PackCardItem from "./PackCardItem";
import PackCardDragger from "./PackCardDragger";
import { useCardCacheContext } from "@/stores/card/CardCacheContext";
import { useCardPackBuilderContext } from "@/stores/card/CardPackBuilderContext";

export default function PackCardDrawer(){
  const firstMounted = useFirstMountState();
  const {page, changeTotalPages} = usePagination();
  const [fetching, fetchingStart] = useTransition();
  const [cards, cardsSet] = useState<Array<ModelCardWithPackItBelongsTo>>([]);
  const {orderedSortData, getSortDataSure, togglerSort} = useSortContext();
  const sortDebounce = useDebounce(orderedSortData, 200);
  const [search, searchSet] = useState<string>("");
  const searchDebounce = useDebounce(search, 200);
  const cachedContext = useCardCacheContext();    
  const deckBuilderContext = useCardPackBuilderContext();
  
  const fetchCards = useCallback(()=>{
    return apiGetCardsNoPacks({
      page,
      limit: 20,
      search: searchDebounce,
      filter: [],
      sort: orderedSortData,
    }).s200(({data, totalPages}:PageResult<ModelCardWithPackItBelongsTo[]>)=>{
      fetchingStart(()=>{
        changeTotalPages(totalPages);
        cardsSet(data);
        cachedContext.setCardData(data);
      });
    }).promiseResponse;
  }, [page, searchDebounce, orderedSortData]);

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
    <Card className="p-2 gap-2 relative @container ">
      <h2 className="px-2 text-xl">
        Card Drawer
      </h2>
      <NavigationBarClean 
        leftChildren={<>
          <SearchBox 
            updateValue={(value)=>{
              searchSet(value);
            }}
          />
        </>}
        rightChildren={<>
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
        </>}
      />

      {(firstMounted || fetching) ? <>
        <div className="mx-2">
          <ProcessingListLarge />
        </div>
      </> : <>
        {cards.length < 1 ? <>
          <EmptyList>
            <Button asChild>
              <a href="/admin/card/create" target="_blank"><PlusCircle/> Add more cards</a>
            </Button>
          </EmptyList>
        </> : <>
          <div className="grid auto-rows-auto @xl:grid-cols-4 @lg:grid-cols-3 grid-cols-2 gap-4 px-2">
            {cards.map((card, index)=>{
              return <Fragment key={index}>
                <div className="">
                  <PackCardDragger
                    locationType="FROM_DRAWER"
                    cardId={card.id}
                    clickCallback={()=>{
                      deckBuilderContext.addToDeck(`${card.atk}/${card.def}` as any, card);
                    }}
                  >
                    <PackCardItem {...card} />
                  </PackCardDragger>
                  
                </div>
              </Fragment>
            })}
          </div>
          <aside className="mt-5">
            <PaginationList />
          </aside>
        </>}
      </>}
    </Card>
  </>
}