import { apiDeleteCard, apiGetCardDetail } from "@/api/client/card"
import { ProcessingListLarge } from "@/components/listing/ProcessingList"
import { makeErrorModal, makeInfoModal, makeLoadingModal, makeSuccessModal } from "@/components/overlay/ModalBase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardFieldContext, CardFieldProvider } from "@/stores/card/CardFieldContext"
import { ModalContext, ModalProvider } from "@/stores/components/ModalContext"
import type { typeCardCreate } from "@/types/api/card"
import type { ModelCardWithPackItBelongsTo } from "@/types/model/cards"
import { linkToFile } from "@jsarmyknife/native--file"
import { RefreshCcw } from "lucide-react"
import { useContext, useMemo, useState } from "react"
import { useEffectOnce } from "react-use"
import CardEditForm from "./CardEditForm"
import { ErrorFieldContext, ErrorFieldProvider } from "@/stores/card/ErrorFieldContext"

export default function CardEditPage({id}:{id:string}){
  return <>
    <ModalProvider>
      <ErrorFieldProvider>
        <CardFieldProvider initialField={1}>
          <CardEditComposer id={id} />
        </CardFieldProvider>
      </ErrorFieldProvider>
    </ModalProvider> 
  </>
}

function CardEditComposer({id}:{id:string}){
  const [,modalDispatch] = useContext(ModalContext);
  const errorFieldContext = useContext(ErrorFieldContext);
  const [oldData, oldDataState] = useState<typeCardCreate>();
  const {updateFieldByIndex, getFieldByIndex, field} = useContext(CardFieldContext);
  const newData = useMemo(()=>{
    return getFieldByIndex(0) as typeCardCreate;
  }, [field]);

  useEffectOnce(()=>{
    apiGetCardDetail(id).s200(async ({data}: {data: ModelCardWithPackItBelongsTo})=>{
      const file = await linkToFile(data.card_art);
      oldDataState({
        name: data.name,
        atk: data.atk,
        def: data.def,
        card_art: file,
      });
      updateFieldByIndex(0, {
        name: data.name,
        atk: data.atk,
        def: data.def,
        card_art: file,
      });
    });
  });

  //---> Constants
  const isOldMatchNew = useMemo(()=>{
    if(oldData == null && newData == null) return true;
    if(oldData == null || newData == null) return false;

    return oldData.name === newData.name &&
      oldData.atk === newData.atk &&
      oldData.def === newData.def &&
      oldData.card_art.size === newData.card_art.size
  }, [newData, oldData]);

  return <>
    {oldData == null ? <>
      <ProcessingListLarge />
    </> : <>
      <Card>
         <CardContent>
            <CardEditForm
              field={newData}
              errorField={{
                name: errorFieldContext.getFieldErrorQuick(`name`),
                atk: errorFieldContext.getFieldErrorQuick(`atk`),
                def: errorFieldContext.getFieldErrorQuick(`def`),
                card_art: errorFieldContext.getFieldErrorQuick(`card_art`),
              }}
              updateField={(updatedField)=>{
                updateFieldByIndex(0,updatedField);
              }}
              updateErrorField={(errorField)=>{
                Object.entries(errorField).forEach(([fieldName, messages])=>{
                  if(messages == null || messages.length < 1){
                    errorFieldContext.deleteFieldErrorByKey(`${fieldName}`);
                    return;
                  }
                  errorFieldContext.setFieldErrorByKey(`${fieldName}`, messages);
                });
              }}

            />
          </CardContent>
      </Card>
      <Card className="sticky bottom-0 mt-2 py-2 px-2">
        <div className="flex justify-end gap-2">
          {!isOldMatchNew && 
            <Button  
              variant={"ghost"}
              className="min-w-fit max-w-full"
              onClick={()=>{
                
              }}
            >
              <RefreshCcw/>
            </Button>
          }
          <Button  
            className="min-w-fit max-w-full w-24"
            onClick={()=>{
              
            }}
            disabled={
              isOldMatchNew 
            }
          >
            Update
          </Button>
          <Button 
            variant={"destructive"} 
            className="min-w-fit max-w-full w-24"
            onClick={()=>{
              modalDispatch(makeInfoModal({
                title: "Delete Card",
                message: `Are you sure you want to delete the card "${oldData?.name}"? This action cannot be undone.`,
                acceptButton: true,
                acceptButtonText: "Yes, delete this card.",
                acceptButtonCallback: ()=>{
                  modalDispatch(makeLoadingModal({
                    title: "Deleting Card",
                    message: `Please wait while the card "${oldData?.name}" is being deleted.`,
                  }));
                  apiDeleteCard(id).s200(()=>{
                    modalDispatch(makeSuccessModal({
                      title: "Card Deleted",
                      message: `The card "${oldData?.name}" has been successfully deleted.`,
                    }))
                  }).sOthers(()=>{
                    modalDispatch(makeErrorModal({
                      title: "Failed to Delete Card",
                      message: `An error occurred while trying to delete the card "${oldData?.name}". Please try again later.`,
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
          <Button 
            variant={"outline"} 
            className="min-w-fit max-w-full w-24"
            onClick={()=>{
              location.href = "/admin/card";
            }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    
    </>}
  </>
}