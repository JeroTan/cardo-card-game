import { MouseSensor, TouchSensor, useSensor, DndContext } from "@dnd-kit/core";
import { PackEditForm } from "./PackEditForm";
import { ModalProvider } from "@/stores/components/ModalContext";
import { PackMetaProvider, usePackMetaContext } from "@/stores/card/CardPackMetaContext";
import CardPackBuilderProvider, { useCardPackBuilderContext, type deckCopyKeyType } from "@/stores/card/CardPackBuilderContext";
import { CardCacheProvider, useCardCacheContext } from "@/stores/card/CardCacheContext";
import { useTransition } from "react";
import { useEffectOnce } from "react-use";
import { apiGetCardPackDetail } from "@/api/client/card";
import type { ModelCardRaw } from "@/types/model/cards";
import type { ModelCardPackRaw } from "@/types/model/cardPack";
import { Skeleton } from "@/components/ui/skeleton";
import { PackPreviousFormProvider, usePackPreviousFormProvider } from "./PreviousForm";

// Helper function to get unique items by a specific key
function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

export default function PackEditPage({
  id,
}:{
  id: string,
}){
  const mouseSensor = useSensor(MouseSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 85,
      tolerance: 2,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 85,
      tolerance: 5,
    },
  });

  return <>
    <PackPreviousFormProvider>
      <ModalProvider>
      <PackMetaProvider>
      <CardPackBuilderProvider>
      <CardCacheProvider>
      <DndContext sensors={[mouseSensor, touchSensor]}>
        <Composer id={id} />
      </DndContext>
      </CardCacheProvider>
      </CardPackBuilderProvider>
      </PackMetaProvider>
      </ModalProvider>
    </PackPreviousFormProvider>
  </>
}


function Composer({
  id
}:{id: string}){
  const {updateName} = usePackMetaContext();
  const {addToDeck} = useCardPackBuilderContext();
  const [fetchingCurrent, fetchingCurrentStart] = useTransition();
  const {setCardData} = useCardCacheContext();
  const {updateOldName,updateOldCards} = usePackPreviousFormProvider();

  

  useEffectOnce(()=>{
    fetchingCurrentStart(async ()=>{
      await apiGetCardPackDetail(id).s200((data:{data:{cardPackDetails: ModelCardPackRaw ,cards:Array<ModelCardRaw>}})=>{
        fetchingCurrentStart(()=>{
          updateName(data.data.cardPackDetails.name);
          updateOldName(data.data.cardPackDetails.name);
          setCardData(uniqueBy(data.data.cards, "id"));
          updateOldCards(data.data.cards);
          data.data.cards.forEach((card)=>{
            addToDeck(`${card.atk}/${card.def}` as deckCopyKeyType, card);
          });
        });
      }).promiseResponse;
    });
  });

  return <>
    {fetchingCurrent ? <>
      <div className="px-2 py-2 flex gap-2">
        <Skeleton className="basis-full h-[calc(100vh-10rem)]" />
        <Skeleton className="basis-full h-[calc(100vh-10rem)]" />
      </div>
    </> : <>
       <PackEditForm id={id} />
    </>}
  </>
}