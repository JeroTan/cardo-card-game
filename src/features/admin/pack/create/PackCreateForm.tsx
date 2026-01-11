import { PaginationProvider } from "@/stores/components/PaginationContext";
import PackCardDeck from "./PackCardDeck";
import PackCardDrawer from "./PackCardDrawer";
import { SortProvider } from "@/stores/components/SortContext";

export default function PackCreateForm(){
  return <>
    <div>
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
    </div>
  </>
}
