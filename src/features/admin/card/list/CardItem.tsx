import { apiDeleteCard } from "@/api/client/card";
import { makeErrorModal, makeInfoModal, makeLoadingModal, makeSuccessModal } from "@/components/overlay/ModalBase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModalContext } from "@/stores/components/ModalContext";
import type { ModelCardWithPackItBelongsTo } from "@/types/model/cards"
import { useContext } from "react";

type Props = ModelCardWithPackItBelongsTo & {
  deleteCallback?: ()=>void;
};

export default function CardItem({
  id,
  name,
  card_art,
  atk,
  def,
  created_at,
  packs,
  deleteCallback,
}: Props){
  const [,modalDispatch] = useContext(ModalContext);
  return <>
    <div className="w-full aspect-[4/6] relative">
      <div className="w-full h-full absolute hover:opacity-95 opacity-0 duration-200 bg-zinc-900 rounded-lg shadow shadow-zinc-100">
        <ul className="sm:py-10 sm:pl-10 py-5 pl-5 pr-2 ">
          <li className="flex">
            <div className="w-15">Name:</div>
            <div>{name}</div>
          </li>
          <li className="flex">
            <div className="w-15">Attack:</div>
            <div>{atk}</div>
          </li>
          <li className="flex">
            <div className="w-15">Defense:</div>
            <div>{def}</div>
          </li>
          <li className="flex">
            <div className="w-15">Created:</div>
            <div>{new Date(created_at).toLocaleDateString()}</div>
          </li>
          <li className="flex">
            <div className="w-15">Packs:</div>
            <div className="flex gap-1">
              {packs.length < 1 ? <>
                None
              </> :<>
                {packs.slice(0,3).map((pack, index)=><Badge key={index}>
                  {pack.name}
                </Badge>)}
                {packs.length > 3 && <Badge variant={"secondary"}>+{packs.length - 3} more</Badge>}
              </>}
            </div>
          </li>
          <li className="mt-2 flex gap-2">
            <Button 
              asChild
              size={"sm"} 
              className="w-20"
            >
              <a
                href={`/admin/card/edit/${id}`}
              >
                Edit
              </a>
            </Button>
            <Button 
              size={"sm"} 
              className="w-20" 
              variant={"destructive"}
              onClick={()=>{
                modalDispatch(makeInfoModal({
                  title: "Delete Card",
                  message: `Are you sure you want to delete the card "${name}"? This action cannot be undone.`,
                  acceptButton: true,
                  acceptButtonText: "Yes, delete this card.",
                  acceptButtonCallback: ()=>{
                    modalDispatch(makeLoadingModal({
                      title: "Deleting Card",
                      message: `Please wait while the card "${name}" is being deleted.`,
                    }));
                    apiDeleteCard(id).s200(()=>{
                      modalDispatch(makeSuccessModal({
                        title: "Card Deleted",
                        message: `The card "${name}" has been successfully deleted.`,
                      }))
                      deleteCallback?.();
                    }).sOthers(()=>{
                      modalDispatch(makeErrorModal({
                        title: "Failed to Delete Card",
                        message: `An error occurred while trying to delete the card "${name}". Please try again later.`,
                      }));
                    })
                  },
                  rejectButton: true,
                  rejectButtonText: "Cancel", 
                }));
              }}
            >
              Delete
            </Button>
          </li>
        </ul>
      </div>
      <img
        src={card_art}
        alt={name}
        className="size-full object-cover pointer-events-none"
      />
    </div>
  </>
}