import { Card } from "@/components/ui/card";
import PackCardDeckCounter from "./PackCardDeckCounter";
import PackCardDeckTargetContainer from "./PackCardDeckTargetContainer";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Type } from "lucide-react";
import { usePackMetaContext } from "@/stores/card/CardPackMetaContext";
import { useState } from "react";

export default function PackCardDeck({}:{}){
  const {name, updateName, hasError} = usePackMetaContext();

  const [nameJustOpen, nameJustOpenSet] = useState(true);

  return <>
    <Card className="p-2 @container gap-0">
      <h2 className="text-xl pb-2">
        Pack Container
      </h2>
      <div>
        {/* Card Name */}
        <Field className="gap-1">
          <FieldLabel htmlFor={"pack-name"}>
            Card Name
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Type />
            </InputGroupAddon>
            <InputGroupInput
              id={"pack-name"}
              aria-invalid={ !nameJustOpen && hasError ? "true" : "false"}
              placeholder="Enter name of the card"
              value={name}
              onInput={(e)=>{
                nameJustOpenSet(false);
                updateName((e.target as HTMLInputElement).value);
              }}
            />
          </InputGroup>
          <FieldError className={`${nameJustOpen || !hasError ? "opacity-0" : "opacity-100"}`}>{hasError || `None`}</FieldError>
        </Field>
      </div>
      <PackCardDeckCounter />
      <div className="relative min-h-[calc(100vh-430px)] h-full pt-2">
        <PackCardDeckTargetContainer />
      </div>
    </Card>
  </>
}