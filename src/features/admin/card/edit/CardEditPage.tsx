import { apiDeleteCard, apiGetCardDetail, apiUpdateCard } from "@/api/client/card"
import { ProcessingListLarge } from "@/components/listing/ProcessingList"
import { makeErrorModal, makeInfoModal, makeLoadingModal, makeSuccessModal } from "@/components/overlay/ModalBase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardFieldContext, CardFieldProvider } from "@/stores/card/CardFieldContext"
import { ModalContext, ModalProvider } from "@/stores/components/ModalContext"
import type { typeCardCreate } from "@/types/api/card"
import type { ModelCardWithPackItBelongsTo } from "@/types/model/cards"
import { linkToFile } from "@jsarmyknife/native--file"
import { ImageUp, RefreshCcw, Replace } from "lucide-react"
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
  const [oldData, oldDataSet] = useState<typeCardCreate>();
  const {updateFieldByIndex, getFieldByIndex, field, allFieldsNotEmpty} = useContext(CardFieldContext);
  const newData = useMemo(()=>{
    return getFieldByIndex(0) as typeCardCreate;
  }, [field]);
  const [changeImage, changeImageSet] = useState<boolean>(false);
  const allowedToUpdate = useMemo(()=>{
    return allFieldsNotEmpty() && errorFieldContext.checkAllHasNoError();
  }, [field, errorFieldContext.fieldError]);

  useEffectOnce(()=>{
    apiGetCardDetail(id).s200(async ({data}: {data: ModelCardWithPackItBelongsTo})=>{
      const file = await linkToFile(data.card_art+"?resetCache=true");
      oldDataSet({
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
            showUploadImage={changeImage}
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
          { changeImage ? <>
            <div className="flex justify-center pt-5">
              <Button size="sm" variant={"outline"} onClick={()=>{
                changeImageSet(false)
                updateFieldByIndex(0, {
                  card_art: oldData.card_art,
                })
              }}>Cancel Update Image</Button>
            </div>
          </> : <>
            <div className="flex justify-center">
              <div className=" max-w-64 w-full aspect-[2/3] relative">
                <div 
                  className="absolute w-full h-full z-1 flex justify-center items-center bg-zinc-800/75 hover:opacity-100 opacity-0 duration-200 cursor-pointer" 
                  onClick={()=>{
                    changeImageSet(true);
                  }}>
                  <ImageUp size={96} className="text-blue-100"/>
                </div>
                <img
                  src={newData.card_art == null ? "" : URL.createObjectURL(newData.card_art)}
                  alt="Card Preview"
                  className=" object-contain w-full h-full pointer-events-none"
                />
              </div>
            </div>
          </>}
          
        </CardContent>
      </Card>
      <Card className="sticky bottom-0 mt-2 py-2 px-2">
        <div className="flex justify-end gap-2">
          {!isOldMatchNew && 
            <Button  
              variant={"ghost"}
              className="min-w-fit max-w-full"
              onClick={()=>{
                modalDispatch(makeInfoModal({
                  title: "Reset Changes",
                  message: `Changes are not yet saved. Are you sure you want to reset all changes made to the card?`,
                  acceptButton: true,
                  acceptButtonText: "Yes, reset changes.",
                  acceptButtonCallback: ()=>{
                    updateFieldByIndex(0, {
                      name: oldData?.name || "",
                      atk: oldData?.atk || 0,
                      def: oldData?.def || 0,
                      card_art: oldData?.card_art || new File([], ""),
                    });
                  },
                  rejectButton: true,
                  rejectButtonText: "Cancel",
                }))
              }}
            >
              <RefreshCcw/>
            </Button>
          }
          <Button  
            className="min-w-fit max-w-full w-24"
            onClick={()=>{
              modalDispatch(makeLoadingModal({
                title: "Updating Card",
                message: `Please wait while the card is being updated.`,
              }));
              apiUpdateCard({
                name: oldData.name == newData.name ? undefined : newData.name,
                atk: oldData.atk == newData.atk ? undefined : newData.atk,
                def: oldData.def == newData.def ? undefined : newData.def,
                card_art: isOldMatchNew ? undefined : newData.card_art,
                id,
              }).s200(()=>{
                modalDispatch(makeSuccessModal({
                  title: "Card Updated",
                  message: `The card "${newData.name}" has been successfully updated.`,
                }));
                oldDataSet(newData);
              }).sOthers(()=>{
                modalDispatch(makeErrorModal({
                  title: "Failed to Update Card",
                  message: `An error occurred while trying to update the card "${newData.name}". Please try again later.`,
                }));
              });
            }}
            disabled={
              isOldMatchNew || !allowedToUpdate
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
              if(isOldMatchNew){
                location.href = "/admin/card";
                modalDispatch(makeLoadingModal({
                  title: "Redirecting",
                  message: "Going back to card management page.",
                }));
                return;
              }
              modalDispatch(makeInfoModal({
                title: "Discard Changes",
                message: `Changes are not yet saved. Are you sure you want to discard all changes and leave this page?`,
                acceptButton: true,
                acceptButtonText: "Yes, discard changes.",
                acceptButtonCallback: ()=>{
                  location.href = "/admin/card";
                  modalDispatch(makeLoadingModal({
                    title: "Redirecting",
                    message: "Going back to card management page.",
                  }));
                },
                rejectButton: true,
                rejectButtonText: "Cancel",
              }))
              
            }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    
    </>}
  </>
}