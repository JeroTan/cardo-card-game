import { PaginationProvider } from "@/stores/components/PaginationContext";
import PackCardDeck from "./PackCardDeck";
import PackCardDrawer from "./PackCardDrawer";
import { SortProvider } from "@/stores/components/SortContext";
import { Button } from "@/components/ui/button";
import { usePackMetaContext } from "@/stores/card/CardPackMetaContext";
import { useModalContext } from "@/stores/components/ModalContext";
import { makeWarningModal } from "@/components/overlay/ModalBase";
import { useCardPackBuilderContext } from "@/stores/card/CardPackBuilderContext";

export default function PackCreateForm(){
  const {name} = usePackMetaContext();
  const [,modalDispatch] = useModalContext();
  const {totalCards} = useCardPackBuilderContext();

  return <>
    <form className="relative">
      <div className="sticky top-0 flex flex-wrap justify-end gap-2 p-2">
        <Button type="submit">
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
