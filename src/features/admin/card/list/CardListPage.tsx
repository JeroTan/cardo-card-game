import EmptyList from "@/components/listing/EmptyList";
import ProcessingList from "@/components/listing/ProcessingList";
import { Button } from "@/components/ui/button";
import type { ModelCardWithPackItBelongsTo } from "@/types/model/cards"
import { PlusCircle } from "lucide-react";
import { Fragment, useCallback, useEffect, useState, useTransition } from "react"
import {useFirstMountState} from "react-use";
import CardItem from "./CardItem";
import { apiGetCards } from "@/api/client/card";
import type { PageResult } from "@/types/api/result";
import { Card } from "@/components/ui/card";

export default function CardListPage({
  page,
}:{
  page:number,
}){
  //---> State
  const firstMounted = useFirstMountState();
  const [cards, cardsSet] = useState<Array<ModelCardWithPackItBelongsTo>>([]);
  const [fetching, fetchingStart] = useTransition();

  //---> Functionalities
  const fetchCards = useCallback(()=>{
    return apiGetCards({
      page,
      limit: 20,
      search: "",
      filter: [],
      sort: [{field: "created_at", direction: "desc"}],
    }).s200(({data}:PageResult<ModelCardWithPackItBelongsTo[]>)=>{
      cardsSet(data);
    }).promiseResponse;
  }, []);

  //---> Effects
  useEffect(()=>{
    fetchingStart(async ()=>{
      await fetchCards();
    });
  }, []);

  return <>
    {(firstMounted || fetching) ? <>
      <div className="mx-auto">
        <ProcessingList />
        <ProcessingList />
      </div>
    </> : <>
      {cards.length < 1 && <>
        <EmptyList>
          <Button asChild>
            <a href="/admin/card/create"><PlusCircle/> Add more cards</a>
          </Button>
        </EmptyList>
      </>}
      <Card className="lg:px-6 sm:px-5 px-2 bg-zinc-800">
        <div className="flex lg:gap-6 sm:gap-5 gap-2">
          {cards.map((card, index)=>{
            return <Fragment key={index}>
              <div className="basis-1/4">
                <CardItem {...card} />
              </div>
            </Fragment>
          })}
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </Card>
    </>}
  </>
}