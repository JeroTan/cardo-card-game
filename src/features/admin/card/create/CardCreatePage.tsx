import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from "react";
import CardCreateForm from "./CardCreateForm";
import { CardFieldContext, CardFieldProvider } from "@/stores/card/CardFieldContext";
import { ErrorFieldContext, ErrorFieldProvider } from "@/stores/card/ErrorFieldContext";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftToLine, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiCreateCard } from "@/api/client/card";

export default function CardCreatePage(){
  return <>
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex gap-2 items-center mb-6">
        <Button asChild variant={"outline"}>
          <a href="/admin/card">
            <ArrowLeftToLine/>
          </a>
        </Button>
        <h1 className="text-2xl font-bold">Create New Card</h1>
      </div>
      <ErrorFieldProvider>
        <CardFieldProvider initialField={1}>
          <CardCreateComposer />
        </CardFieldProvider>
      </ErrorFieldProvider>
      {/* <CardCreateForm /> */}
    
    </div>
  </>
}

function CardCreateComposer(){
  const fieldContext = useContext(CardFieldContext);
  const errorFieldContext = useContext(ErrorFieldContext);
  const allowedToSubmit = useMemo(()=>{
    return fieldContext.allFieldsNotEmpty() && errorFieldContext.checkAllHasNoError();
  }, [fieldContext.field, errorFieldContext.fieldError]);
  
  const [cardStatuses, cardStatusesSet] = useState<Array<{key:number, status:"UPLOADING"|"COMPLETED"|"ERROR"}>>([]);

  // Functionalities
  const checkCreateStatuses = useCallback((key: string|number)=>{
    const statusItem = cardStatuses.find((e)=>e.key === Number(key));
    if(!statusItem) return null;
    return statusItem.status;
  }, [cardStatuses]);

  const updateCreateStatus = useCallback((key: string|number, status:"UPLOADING"|"COMPLETED"|"ERROR")=>{
    cardStatusesSet((prev)=>{
      const existingIndex = prev.findIndex((e)=>e.key === Number(key));
      if(existingIndex >= 0){
        const newArray = [...prev];
        newArray[existingIndex].status = status;
        return newArray;
      }
      return [...prev, {key: Number(key), status}];
    });
  }, [cardStatusesSet]);

  const clearStatus = useCallback((key: string|number)=>{
    cardStatusesSet((prev)=>{
      return prev.filter((e)=>e.key !== Number(key));
    });
  }, [cardStatusesSet]);

  const submitCards = useCallback(()=>{
    fieldContext.field.filter((fieldItem)=>{
      const status = checkCreateStatuses(fieldItem.key);
      return status == null || status == "ERROR";
    }).forEach((fieldItem)=>{
      updateCreateStatus(fieldItem.key, "UPLOADING");
      apiCreateCard(fieldItem).s200((data)=>{
        updateCreateStatus(fieldItem.key, "COMPLETED");
      }).sOthers(()=>{
        updateCreateStatus(fieldItem.key, "ERROR");
      }, "RAW")
    });
  }, [fieldContext.field, cardStatusesSet, cardStatuses]);

  return <>
    <section className="space-y-4">
      {fieldContext.field.map((fieldItem, index)=>{
        return <Fragment key={fieldItem.key}>
        <Card>
          <CardHeader>
            <CardTitle>
              <span>Card #{index+1}</span>&nbsp;
              {checkCreateStatuses(fieldItem.key) != null && <>
                {checkCreateStatuses(fieldItem.key) === "UPLOADING" && <Badge variant={"outline"} className="animate-pulse">Uploading...</Badge>}
                {checkCreateStatuses(fieldItem.key) === "COMPLETED" && <Badge variant={"secondary"} className="bg-green-500">Completed</Badge>}
                {checkCreateStatuses(fieldItem.key) === "ERROR" && <Badge variant={"destructive"}>Error</Badge>}
              </>}
            </CardTitle>
            <CardDescription>
              Create details for card #{index+1}
            </CardDescription>
            {fieldContext.field.length > 1 && <CardAction>
              <Button variant={"ghost"} onClick={()=>{
                const currentStatus = checkCreateStatuses(fieldItem.key);
                if(currentStatus === "UPLOADING") return;
                fieldContext.deleteFieldByIndex(index);
                clearStatus(fieldItem.key);
              }}>
                <Minus /> Remove
              </Button>
            </CardAction>}
          </CardHeader>
          <CardContent>
            <CardCreateForm
              key={fieldItem.key}
              field={fieldItem}
              errorField={{
                name: errorFieldContext.getFieldErrorQuick(`${fieldItem.key}.name`),
                atk: errorFieldContext.getFieldErrorQuick(`${fieldItem.key}.atk`),
                def: errorFieldContext.getFieldErrorQuick(`${fieldItem.key}.def`),
                card_art: errorFieldContext.getFieldErrorQuick(`${fieldItem.key}.card_art`),
              }}
              updateField={(updatedField)=>{
                clearStatus(fieldItem.key);
                fieldContext.updateFieldByKey(
                  fieldItem.key,
                  updatedField,
                );
              }}
              updateErrorField={(errorField)=>{
                Object.entries(errorField).forEach(([fieldName, messages])=>{
                  if(messages == null || messages.length < 1){
                    errorFieldContext.deleteFieldErrorByKey(`${fieldItem.key}.${fieldName}`);
                    return;
                  }
                  errorFieldContext.setFieldErrorByKey(`${fieldItem.key}.${fieldName}`, messages);
                });
              }}

            />
          </CardContent>
        </Card>
        </Fragment>
      }) }
    </section>

    <Card className="sticky bottom-0 mt-2 py-2">
      <div className="flex justify-center gap-2">
        <Button variant={"outline"} className="min-w-fit max-w-full w-1/3" onClick={()=>fieldContext.addField()} disabled={fieldContext.field.length >= 20}>
          <Plus /> Card
        </Button>
        <Button 
          variant={"default"} 
          className="min-w-fit max-w-full w-1/3" 
          disabled={!allowedToSubmit || (cardStatuses.length > 0 && cardStatuses.every((e)=>e.status === "UPLOADING" || e.status ==="COMPLETED"))} 
          onClick={submitCards}
        >
          Submit
        </Button>
      </div>
    </Card>
  </>
}