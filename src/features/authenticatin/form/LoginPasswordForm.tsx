import { ApiLoginWithPasswordUser } from "@/api/client/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useMultiStateField } from "@/lib/hooks/fields";
import { Mail, Key } from "lucide-react"
import { useCallback, useTransition } from "react";

type Props = {
  role?: "admin" | "user";
}

export default function LoginPasswordForm({
  role = "user",
}: Props){

  const [processing, useProcessing] = useTransition();
  const data = useMultiStateField({
    email: "",
    password: "",
  });

  
  //---> Functionalities
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(processing) return;
    useProcessing(()=>{
      if(role === "admin"){
        const result = ApiLoginWithPasswordUser({
          email: data.email.get,
          password: data.password.get,
        });
      }
    });    
  }, [processing]);

  return <>
    <form onSubmit={handleSubmit}>
      <div className="space-y-1">

        <Field className="gap-1">
          <InputGroup className="mb-0" >
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput 
              type="email" 
              placeholder="Email" 
              value={data.email.get}
              disabled={processing}
              onInput={(e)=>{
                data.email.set((e.target as HTMLInputElement).value);
            }}/>
            {/* <InputGroupAddon align={"inline-end"}>
              <TriangleAlert className="text-destructive" />  
            </InputGroupAddon>  */}
          </InputGroup>
          <FieldError className={`opacity-0`}>{`None`}</FieldError>
        </Field>
        
        <Field className="gap-1">
          <InputGroup>
            <InputGroupAddon>
              <Key />
            </InputGroupAddon>  
            <InputGroupInput 
              type="password" 
              placeholder="Password" 
              value={data.password.get} 
              disabled={processing}
              onInput={(e)=>{
              data.password.set((e.target as HTMLInputElement).value);
            }}/>
          </InputGroup>
          <FieldError className={`opacity-0`}>{`None`}</FieldError>
        </Field>
       
      </div>
      <div className="mt-2">
        <Button type="submit" 
          className="w-full cursor-pointer"
          disabled={processing}
        >
          {processing ? "Processing..." : "Login"}
        </Button>
      </div>
    </form>
  </>
}