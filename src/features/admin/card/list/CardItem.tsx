import type { ModelCardWithPackItBelongsTo } from "@/types/model/cards"

type Props = ModelCardWithPackItBelongsTo;

export default function CardItem({
  id,
  name,
  card_art,
  atk,
  def,
  created_at,
  updated_at,
}: Props){

  return <>
    <div className="w-full aspect-[4/6] relative">
      <img
        src={card_art}
        alt={name}
        className="size-full object-cover"
      />
    </div>
  </>
}