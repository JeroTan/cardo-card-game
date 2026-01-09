import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useCardPackBuilderContext, type deckCopyKeyType } from "@/stores/card/CardPackBuilderContext"
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { Leaf } from "lucide-react";
import { Fragment } from "react";
import PackCardItem from "./PackCardItem";
import { useCardCacheContext } from "@/stores/card/CardCacheContext";
import PackCardDragger from "./PackCardDragger";

export default function PackCardDeckTargetContainer({}:{}){
  const {listCards, addToDeck, removeFromDeckByListIndex} = useCardPackBuilderContext();
  const {getCardById} = useCardCacheContext();
  const {setNodeRef, isOver} = useDroppable({
    id: "droppable-deck-container",
    data: {
      acceptTypes: ["FROM_DRAWER"],
    }
  });
  useDndMonitor({
    onDragEnd(event) {
      const data = event.active.data.current as {cardId:string, type:"FROM_DRAWER" | "FROM_DECK", cardIndex:number};
      if(data.type === "FROM_DECK" ){
        if(data.cardIndex == -1){
          return;
        }
        removeFromDeckByListIndex(data.cardIndex);
        return;
      }
      const card = getCardById(data.cardId);
      if(!card) return;
      addToDeck(`${card.atk}/${card.def}` as deckCopyKeyType, card);
    },
  });

  return <>
    <div className="relative rounded-xl border border-dashed border-zinc-500 w-full min-h-[calc(100vh-430px)]" ref={setNodeRef}>
      {isOver && <div
        className={`absolute w-full h-full flex justify-center items-center bg-zinc-800/75 rounded-xl z-10 pointer-events-none`}
      >
        <div className="text-zinc-100 text-lg">
          Release to add to Pack
        </div>

      </div>}
      {listCards.length <= 0 && <>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant={"icon"}>
              <Leaf />
            </EmptyMedia>
            <EmptyTitle>No Cards</EmptyTitle>
            <EmptyDescription>
              You have not added any cards to this pack yet. Click or Drag and drop cards here from the card drawer to include them in the pack.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>}
      {listCards.length > 0 && <>
        <div className="grid auto-rows-auto @xl:grid-cols-4 @lg:grid-cols-3 grid-cols-2 gap-4 px-2">
          {listCards.map((card, index)=>{
            return <Fragment key={index}>
              <PackCardDragger
                locationType="FROM_DECK"
                cardId={card.id}
                cardIndex={index}
                clickCallback={()=>{
                  removeFromDeckByListIndex(index);
                }}
              >
                <PackCardItem name={card.name} card_art={card.card_art} />
              </PackCardDragger>
              
            </Fragment>
          })}
        </div>
      </>}
    </div>
  </>
}