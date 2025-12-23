import { ApiLoginWithPasswordUser } from "@/api/client/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useMultiStateField } from "@/lib/hooks/fields";
import { Mail, Key, AlertCircleIcon } from "lucide-react"
import { useCallback, useState, useTransition } from "react";

type Props = {
  role?: "admin" | "user";
}

export default function LoginPasswordForm({
  role = "user",
}: Props){

  const [processing, useProcessing] = useTransition();
  const [errorMessage, errorMessageSet] = useState<string | null>(null);
  const data = useMultiStateField({
    email: "",
    password: "",
  });

  
  //---> Functionalities
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(processing) return;
    useProcessing(async ()=>{
      if(role === "admin"){
        await ApiLoginWithPasswordUser({
          email: data.email.get,
          password: data.password.get,
        }).s200((data)=>{
          console.log("Admin Login Success:", data);
        }).sOthers((data:any)=>{
          errorMessageSet(data?.message || "An error occurred during login.");
        }).promiseResponse;
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
                errorMessageSet(null);
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
                errorMessageSet(null);
                data.password.set((e.target as HTMLInputElement).value);
              }}
            />
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

      <div>
        {errorMessage && 
          <Alert variant="destructive" className="mt-6">
            <AlertCircleIcon />
            <AlertTitle className=" font-bold">Login Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        }
      </div>
    </form>
  </>
}