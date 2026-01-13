import { apiUpdateCard, apiUpdatePackCards, apiUpdatePackMeta } from "@/api/client/card";
import { makeErrorModal, makeInfoModal, makeLoadingModal, makeWarningModal } from "@/components/overlay/ModalBase";
import { Button } from "@/components/ui/button";
import { useCardPackBuilderContext, type deckCopyKeyType } from "@/stores/card/CardPackBuilderContext";
import { usePackMetaContext } from "@/stores/card/CardPackMetaContext";
import { useModalContext } from "@/stores/components/ModalContext";
import PackCardDeck from "../create/PackCardDeck";
import { SortProvider } from "@/stores/components/SortContext";
import { PaginationProvider } from "@/stores/components/PaginationContext";
import PackCardDrawer from "../create/PackCardDrawer";
import type { ModelCardRaw } from "@/types/model/cards";
import { RefreshCcw } from "lucide-react";
import { usePackPreviousFormProvider } from "./PreviousForm";
import { useMemo } from "react";

export function PackEditForm({
  id
}:{
  id: string,
}) {
  const {name, hasError: nameHasError, updateName} = usePackMetaContext();
  const [,modalDispatch] = useModalContext();
  const {totalCards, hasAllNoErrors, listCards, removeAll, addToDeck} = useCardPackBuilderContext();
  const {previousName, previousCards, isStillPrevious, updateOldName, updateOldCards} = usePackPreviousFormProvider();
  const {name:isSameOldName, cards:isSameOldCards} = useMemo(()=>{
    return isStillPrevious(name, listCards);
  }, [name, listCards, previousName, previousCards, isStillPrevious]);

  return <>
    <form className="relative" onSubmit={(e)=>{
      e.preventDefault();
      if(!(hasAllNoErrors && nameHasError == false && (!isSameOldName || !isSameOldCards))) return;

      modalDispatch(makeInfoModal({
        title: "Confirm Pack Update",
        message: `Are you sure you want to update this card pack? This action cannot be undone.`,
        acceptButtonText: "Update Pack",
        acceptButtonCallback: async ()=>{
          modalDispatch(makeLoadingModal({
            title: "Updating Pack...",
            message: "Please wait while we update your card pack.",
          }));

          const nameDone = new Promise<boolean>((resolve)=>{
            if(isSameOldName) return resolve(true);
            apiUpdatePackMeta({
              id,
              name,
            }).s200(()=>{
              resolve(true);
            }).sOthers(()=>{
              resolve(false);
            });
          });
          const cardsDone = new Promise<boolean>((resolve)=>{
            if(isSameOldCards) return resolve(true);
            apiUpdatePackCards({
              id,
              cards: listCards.map((card)=>card.id),
            }).s200(()=>{
              resolve(true);
            }).sOthers(()=>{
              resolve(false);
            });
          });

          if(await nameDone && await cardsDone){
            modalDispatch(makeInfoModal({
              title: "Pack Updated",
              message: `The card pack has been successfully updated.`,
              acceptButtonText: "Go to Pack List",
              acceptButtonCallback: ()=>{
                location.href = "/admin/card-pack"
              }
            }));
            return;
          }else {
            modalDispatch(makeErrorModal({
              title: "Error Updating Pack",
              message: `An unexpected error occurred while updating the pack. Please try again later.`,
              acceptButtonText: "Close",
            }));
          }

          

        },
        rejectButton: true,
        rejectButtonText: "Cancel",
      }))

    }}>
      <div className="sticky top-0 flex flex-wrap justify-end gap-2 p-2">
        {!(isSameOldName && isSameOldCards) && <>
          <Button
            type="button"
            variant="ghost"
            onClick={()=>{
              modalDispatch(makeInfoModal({
                title: "Reset Changes",
                message: `Changes are not yet saved. Are you sure you want to reset all the changes?`,
                acceptButton: true,
                acceptButtonText: "Yes, reset changes.",
                acceptButtonCallback: ()=>{
                  updateName(previousName);
                  removeAll();
                  previousCards.forEach((card)=>{
                    addToDeck(`${card.atk}/${card.def}` as deckCopyKeyType, card);
                  })
                  updateOldName(previousName);
                  updateOldCards(previousCards);
                },
                rejectButton: true,
                rejectButtonText: "Cancel",
              }))
            }}
          >
            <RefreshCcw />
          </Button>
        </>}
        
        <Button 
          type="submit" 
          disabled={ !(hasAllNoErrors && nameHasError == false && (!isSameOldName || !isSameOldCards)) } 
        >
          Update Pack
        </Button>
        <Button type="button" variant={"secondary"} onClick={()=>{
          if(name || totalCards > 0){
            modalDispatch(makeWarningModal({
              title: "Discard Pack Creation?",
              message: `Are you sure you want to discard this pack? All unsaved progress will be lost.`,
              acceptButtonText: "Discard",
              acceptButtonCallback: ()=>{
                location.href = "/admin/card-pack"
              },
              rejectButton: true,
              rejectButtonText: "Cancel",
            }));
            return;
          }
          location.href = "/admin/card-pack"
        }}>
          Cancel
        </Button>
      </div>
      
      <main className="flex md:flex-nowrap flex-wrap gap-2 p-2">
        <div className="basis-full">
          <PackCardDeck />
        </div>
        <div className="basis-full">
          
          <SortProvider initialSortData={["-created_at", "name", "atk", "def"]}>
          <PaginationProvider>
            <PackCardDrawer />
          </PaginationProvider>
          </SortProvider>
        </div>        
      </main>
    </form>
  </>
}