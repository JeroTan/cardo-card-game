type Props = {
  name: string;
  card_art: string;
};

export default function PackCardItem({
  name,
  card_art,
}: Props){
  return <>
    <div className="w-full aspect-[4/6] relative select-none">
      <img
        src={card_art}
        alt={name}
        className="size-full object-cover pointer-events-none"
      />
    </div>
  </>
}