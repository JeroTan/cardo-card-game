import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import CardCreateForm from "./CardCreateForm";
import { CardFieldContext, CardFieldProvider } from "@/stores/card/CardFieldContext";
import { ErrorFieldContext, ErrorFieldProvider } from "@/stores/card/ErrorFieldContext";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

export default function CardCreatePage(){
  return <>
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Card</h1>
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
  
  const [cardStatuses, cardStatusesSet] = useState<Array<{key:number, status:"UPLOADING"|""}>>([]);

  return <>
    <section className="space-y-4">
      {fieldContext.field.map((fieldItem, index)=>{
        return <Fragment key={fieldItem.key}>
        <Card>
          <CardHeader>
            <CardTitle>
              Card #{index+1}
            </CardTitle>
            <CardDescription>
              Create details for card #{index+1}
            </CardDescription>
            {fieldContext.field.length > 1 && <CardAction>
              <Button variant={"ghost"} onClick={()=>{
                fieldContext.deleteFieldByIndex(index);
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

    <section className="sticky mt-2">
      <div className="flex justify-center gap-2">
        <Button variant={"outline"} className="min-w-fit max-w-full w-1/3" onClick={()=>fieldContext.addField()} disabled={fieldContext.field.length >= 20}>
          <Plus /> Card
        </Button>
        <Button variant={"default"} className="min-w-fit max-w-full w-1/3" disabled={!allowedToSubmit}>
          Submit
        </Button>
      </div>
    </section>
  </>
}