import { apiGetCardDetail, apiGetCardPackDetail } from "@/api/client/card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardPackCardsCachedContext } from "@/stores/card/CardPackCardsCacheContext";
import type { ModelCardPackRaw } from "@/types/model/cardPack";
import type { ModelCardRaw } from "@/types/model/cards";
import { transformDate } from "@jsarmyknife/native--math";
import { Cake } from "lucide-react";
import { Fragment, useState } from "react";
import { useEffectOnce } from "react-use";

export default function PackItem({data}:{data:ModelCardPackRaw}){

  const [cards, cardsSet] = useState<Array<ModelCardRaw>|null>(null);
  const {get: getCache, set:setCache} = useCardPackCardsCachedContext();

  useEffectOnce(()=>{
    const cachedData = getCache(data.id);
    if(cachedData){
      console.log(cachedData)
      cardsSet(getCache(data.id)!.cards);
      return;
    }
    apiGetCardPackDetail(data.id).s200(({data:packDetail}:{data:{cards:Array<ModelCardRaw>}})=>{
      setCache({id: data.id, cards: packDetail.cards});
      cardsSet(packDetail.cards);
    });
  });

  return <>
    <Card 
      className="hover:bg-zinc-800 cursor-pointer duration-200 transition-shadow"
      onClick={()=>{
        location.href = `/admin/card-pack/edit/${data.id}`;
      }}
    >
      <CardHeader>
        <CardTitle>{data.name}</CardTitle>
        <CardDescription className="flex gap-2 items-center">
          <Cake size={16} /> {transformDate(data.created_at, "dxx mnt, yyyy")}
        </CardDescription>
        <CardContent className="px-0">

          {cards == null && <>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="w-full aspect-[2/3] m-2 rounded-md" />
              <Skeleton className="w-full aspect-[2/3] m-2 rounded-md" />
              <Skeleton className="w-full aspect-[2/3] m-2 rounded-md" />
            </div>
            
          </>}
          {cards != null && (
            cards.length == 0 ? <>
              <Empty>
                <EmptyHeader>
                  No Cards in Pack
                </EmptyHeader>
              </Empty>
            </> : <>
              <div className="grid grid-cols-3 gap-2">
                {cards.slice(0, 3).map((card, index)=>{
                  return <Fragment key={index}>
                    <div className="w-full aspect-[2/3] relative">
                    <img
                      src={card.card_art}
                      alt={card.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  </Fragment>
                })}
              </div>
            </>
          )}
          
          
        </CardContent>
      </CardHeader>
    </Card>
  </>
}