import CardLayoutDesigner from "@/components/card/CardLayoutDesigner";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodValidateSchema } from "@/lib/zod/validator";
import type { typeCardCreate } from "@/types/api/card";
import { zodCardCreate } from "@/types/fields/card/create";
import { useDebounce } from "@uidotdev/usehooks";
import { HandFist, ImagePlus, Shield, Sword, Type } from "lucide-react";
import { useId, useState } from "react";
import useUpdateEffect from "react-use/lib/useUpdateEffect";

export default function CardEditForm({
  field,
  errorField,
  updateField,
  updateErrorField,
}:{
  field:typeCardCreate,
  errorField: Partial<Record<keyof typeCardCreate, string[]|null>>,
  updateField: (updatedField:Partial<typeCardCreate>)=>void,
  updateErrorField: (errorField:Partial<Record<keyof typeCardCreate, string[]|null>>)=>void,
}){

  //In order to freely set the field name apart from error checking
  const fieldNameDelay = useDebounce(field.name, 200);
  useUpdateEffect(()=>{
    const {error, message} = zodValidateSchema(fieldNameDelay, zodCardCreate.shape.name);
    if(error){
      updateErrorField({name: message});
    } else {
      updateErrorField({name: null});
    }
  }, [fieldNameDelay]);
  const [rawImage, rawImageSet] = useState<File|null>(null);
  const identifier = useId();
  
  return <>
    <form className="flex flex-wrap">
      <section className="basis-full">
        {/* Card Name */}
        <Field className="gap-1">
          <FieldLabel htmlFor={"card-name"}>
            Card Name
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Type />
            </InputGroupAddon>
            <InputGroupInput
              id={"card-name"}
              aria-invalid={errorField.name != null ? "true" : "false"}
              placeholder="Enter name of the card"
              value={field.name}
              onInput={(e)=>{
                updateField({name: (e.target as HTMLInputElement).value});
              }}
            />
          </InputGroup>
          <FieldError className={`${errorField.name == null ? "opacity-0" : "opacity-100"}`}>{errorField.name?.[0] || `None`}</FieldError>
        </Field>
        
        {/* Card Stat */}
        <Field className="gap-1 mb-7">
          <FieldLabel htmlFor={"card-attack-defense"}>
            Attack & Defense
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <HandFist />
            </InputGroupAddon>
            <InputGroupAddon className="w-full relative cursor-pointer">
              <Select
                value={`${field.atk}/${field.def}`}
                onValueChange={(value)=>{
                    const splitValue = value.split("/").map((v)=>parseInt(v, 10));
                    updateField({atk: splitValue[0], def: splitValue[1]});
                    updateErrorField({atk: null, def: null});
                  }}
              >
                <SelectTrigger 
                  className="w-full cursor-pointer"
                  id={"card-attack-defense"}
                >
                  <SelectValue placeholder="Select Attack & Defense Value" />
                </SelectTrigger>
                <SelectContent  id={"card-attack-defense"} className="w-full">
                  {Array.from({length: 11}, (_, i) => i).reverse().map((atk, def)=>{
                    if(def == 0) return null;
                    const atkTotal = atk%10;
                    const defTotal = def%10;
                    const atkDef = `${atkTotal}/${defTotal}`;
                    return <SelectItem 
                    className="flex"
                      key={atkDef}
                      value={atkDef}
                    > 
                      <div className="flex items-center gap-1">
                        <Sword size={10} />{atkTotal}
                        <Shield size={10} />{defTotal}
                      </div>
                    </SelectItem>
                  })}
                </SelectContent>
              </Select>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </section>
  
      <section className=" basis-full flex  gap-2">
        <div className="basis-1/2">
          {/* Card Art Upload */}
          <Field className="gap-1">
            <FieldLabel htmlFor={"card_art"}>
              Card Art
            </FieldLabel>
            <Input
              id={"card_art"}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(e)=>{
                const files = (e.target as HTMLInputElement).files;
                if(files && files.length > 0){
                  rawImageSet(files[0]);
                  updateErrorField({card_art: null});
                }
              }}
            />
            {
              rawImage ? <>
                <div className="flex justify-start gap-4">
                  {/* Image Preview */}
                  <label htmlFor={identifier+"_card_art"} className="cursor-pointer relative min-w-16 max-w-64 w-full">
                    <div className="absolute w-full aspect-[2/3] flex justify-center items-center z-10 bg-zinc-500 hover:opacity-50 opacity-0 duration-200">
                      <ImagePlus size={96} className="text-zinc-100"/>
                    </div>
                    <div className="w-full aspect-[2/3] border-2 border-zinc-300 rounded-lg overflow-hidden bg-zinc-50">
                      <img 
                        src={URL.createObjectURL(rawImage)} 
                        alt="Card preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </label>
                </div>
              </> : <>
                <label 
                  htmlFor={identifier+"_card_art"} 
                  className="group cursor-pointer border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      rawImageSet(files[0]);
                      updateErrorField({card_art: null});
                    }
                  }}
                >
                  <div className="space-y-2">
                    <ImagePlus className="mx-auto text-zinc-500"/>
                    <div className="text-sm text-zinc-600">
                      <span className="font-medium text-zinc-300 group-hover:text-blue-400 transition-colors">
                        Click to upload
                      </span> or drag and drop
                    </div>
                    <p className="text-xs text-zinc-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </label>
              </>
            }
            
            <FieldError className={`${errorField.card_art == null ? "opacity-0" : "opacity-100"}`}>{errorField.card_art?.join(", ") || `None`}</FieldError>
          </Field>
        </div>
        
        <div className="basis-1/2">
          <div>
            <h2 className="text-sm">Card Preview</h2>
          </div>
          <div>
            <CardLayoutDesigner 
              rawImage={rawImage}
              name={field.name}
              atk={field.atk}
              def={field.def}
              updateCardImage={(newImage)=>updateField({card_art: newImage})}
            />
          </div>
        </div>
      </section>
    
    </form>
  </>
}