import { useContext, useEffect } from "react";
import CardCreateForm from "./CardCreateForm";
import { CardFieldContext, CardFieldProvider } from "@/stores/card/CardFieldContext";
import { ErrorFieldContext, ErrorFieldProvider } from "@/stores/card/ErrorFieldContext";

export default function CardCreatePage(){
  return <>
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Card</h1>
      <ErrorFieldProvider>
        <CardFieldProvider>
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

  useEffect(()=>{
    fieldContext.addField();
  }, []);

  return <>
    {fieldContext.field.map((fieldItem, index)=>{
      return <CardCreateForm
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
          console.log("Updating error field for key:", fieldItem.key, errorField);
          Object.entries(errorField).forEach(([fieldName, messages])=>{
            if(messages == null || messages.length < 1){
              errorFieldContext.deleteFieldErrorByKey(`${fieldItem.key}.${fieldName}`);
              return;
            }
            errorFieldContext.setFieldErrorByKey(`${fieldItem.key}.${fieldName}`, messages);
          })

        }}

      />
    }) }
  </>
}