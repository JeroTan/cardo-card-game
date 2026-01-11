import { PaginationProvider } from "@/stores/components/PaginationContext";
import PackCardDeck from "./PackCardDeck";
import PackCardDrawer from "./PackCardDrawer";
import { SortProvider } from "@/stores/components/SortContext";
import { Button } from "@/components/ui/button";
import { usePackMetaContext } from "@/stores/card/CardPackMetaContext";
import { useModalContext } from "@/stores/components/ModalContext";
import { makeErrorModal, makeInfoModal, makeLoadingModal, makeWarningModal } from "@/components/overlay/ModalBase";
import { useCardPackBuilderContext } from "@/stores/card/CardPackBuilderContext";
import { apiCreatePack } from "@/api/client/card";

export default function PackCreateForm(){
  const {name, hasError: nameHasError} = usePackMetaContext();
  const [,modalDispatch] = useModalContext();
  const {totalCards, hasAllNoErrors, listCards} = useCardPackBuilderContext();

  return <>
    <form className="relative" onSubmit={(e)=>{
      e.preventDefault();
      if(!(hasAllNoErrors && nameHasError == false)) return;

      modalDispatch(makeInfoModal({
        title: "Confirm Pack Creation",
        message: `Are you sure you want to create this card pack? This action cannot be undone.`,
        acceptButtonText: "Create Pack",
        acceptButtonCallback: ()=>{
          modalDispatch(makeLoadingModal({
            title: "Creating Pack...",
            message: "Please wait while we create your card pack.",
          }));

          apiCreatePack({
            name,
            cards: listCards.map((card)=>card.id),
          }).s200((e)=>{
            modalDispatch(makeInfoModal({
              title: "Pack Created",
              message: `The card pack has been successfully created.`,
              acceptButtonText: "Go to Pack List",
              acceptButtonCallback: ()=>{
                location.href = "/admin/card-pack"
              },
              rejectButton: false,
              closeButton: false,
              backdropTrigger: false,
            }));
          }).s422((e:{data:Record<string, string>})=>{
            modalDispatch(makeErrorModal({
              title: "Validation Error",
              message: `There were validation errors while creating the pack: ${Object.entries(e.data).map(([field, msg])=>`${field}: ${msg}`).join(", ")}`,
              acceptButtonText: "Close",
            }));
          }).sOthers(()=>{
            modalDispatch(makeErrorModal({
              title: "Error Creating Pack",
              message: `An unexpected error occurred while creating the pack. Please try again later.`,
              acceptButtonText: "Close",
            }));
          })

        },
        rejectButton: true,
        rejectButtonText: "Cancel",
      }))

    }}>
      <div className="sticky top-0 flex flex-wrap justify-end gap-2 p-2">
        <Button 
          type="submit" 
          disabled={ !(hasAllNoErrors && nameHasError == false) } 
        >
          Create Pack
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
