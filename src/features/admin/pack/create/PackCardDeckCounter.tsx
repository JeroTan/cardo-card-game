import { Badge } from "@/components/ui/badge";
import { useCardPackBuilderContext } from "@/stores/card/CardPackBuilderContext"

export default function PackCardDeckCounter(){
  const {deckCounter, totalCards} = useCardPackBuilderContext();
  return <div>
    <div className="flex justify-end gap-2 pb-2">
      Total
      <Badge>
        <span className={""}>{totalCards}</span> / <span>50</span>
      </Badge>
    </div>
    <div className="grid @md:grid-cols-5 grid-cols-2 gap-2">
      {Object.entries(deckCounter).map(([key, count])=>{
        return <div key={key} className={`rounded border border-zinc-600 px-2 py-1 flex items-center `}>
          <div className="mr-auto">
            <span className={`${count === 5 ? 'text-green-600' : 'text-red-600'}`}>{count}</span> / 5
          </div>
          <div className="rounded-full bg-zinc-100 text-zinc-800 p-1 text-xs">
            {key}
          </div>
        </div>
      })}
    </div>
  </div>
}