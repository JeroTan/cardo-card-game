import { ApiLoginWithPasswordUser } from "@/api/client/auth";
import { MakeAlertClose, MakeErrorAlert } from "@/components/overlay/AlertBox";
import { makeSuccessModal } from "@/components/overlay/ModalBase";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useMultiStateField } from "@/lib/hooks/fields";
import { makeStorage } from "@/stores/client/localStorageDefinition";
import { AlertContext } from "@/stores/components/AlertContext";
import { ModalContext } from "@/stores/components/ModalContext";
import type { Error422Result } from "@/types/api/result";
import { Mail, Key } from "lucide-react"
import { useCallback, useContext, useTransition } from "react";

type Props = {
  role?: "admin" | "user";
}

export default function LoginPasswordForm({
  role = "user",
}: Props){

  const [processing, useProcessing] = useTransition();
  const [,alertDispatch] = useContext(AlertContext);
  const [,modalDispatch] = useContext(ModalContext);

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
        }).s200(({data}: {data: {token: string}})=>{
          modalDispatch(makeSuccessModal({
            title: "Login Successful",
            message: "Redirecting you now to the main page.",
            backdropTrigger: false,
            closeButton: false,
            acceptButton: false,
            rejectButton: false,
          }));
          makeStorage("adminAuthToken").store(data.token);
          location.href = "/admin/dashboard";
        })
        .s422((data: Error422Result)=>{
          alertDispatch(MakeErrorAlert({
            title: "Login Failed",
            message: data.data.map((e)=>e.error.join("\n")).join("\n"),
          }));
        })
        .sOthers((data:unknown)=>{
          alertDispatch(MakeErrorAlert({
            title: "Login Failed",
            message: (data as any)?.message || "An unknown error occurred during login.",
          }));
        }).promiseResponse;
      }
    });    
  }, [processing, data.email, data.password]);

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
              placeholder={role == "admin" ? "Email" : "Email or Username"} 
              value={data.email.get}
              disabled={processing}
              onInput={(e)=>{
                alertDispatch(MakeAlertClose());
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
                alertDispatch(MakeAlertClose());
                data.password.set((e.target as HTMLInputElement).value);
              }}
            />
          </InputGroup>
          <FieldError className={`opacity-0`}>{`None`}</FieldError>
        </Field>
       
      </div>
      <div className="mt-2">
        <Button type="submit" 
          className="w-full"
          disabled={processing}
        >
          {processing ? "Processing..." : "Login"}
        </Button>
      </div>
    </form>
  </>
}