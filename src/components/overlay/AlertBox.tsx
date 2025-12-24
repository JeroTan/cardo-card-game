import { AlertCircleIcon, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { ALERT_STRUCTURE, ALERT_INSTRUCTION } from "./types";
import { useReducer } from "react";
import cloneDeep from "lodash/cloneDeep";

export const alertStructure: ALERT_STRUCTURE = {
	isOpen: false,
	width: null,
  type: "default",
	icon: <AlertCircleIcon />,
	title: "Title",
	message:
		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Minima adipisci recusandae tempore unde. Ut rem a asperiores laboriosam fugiat molestiae possimus quisquam excepturi, ullam ratione rerum distinctio, et inventore obcaecati.",
	closeButton: true,
	closeButtonCallback: undefined,
};

export function useAlertReducer(){
  return useReducer((data, instruction: ALERT_INSTRUCTION)=>{
    switch (instruction.type) {
			case "open":
				return { ...data, isOpen: true };
			case "close":
				return { ...data, isOpen: false };
			case "update":
        if(instruction.data)
				return { ...data, ...( instruction.data) };
			default:
				return data;
		}
  } , cloneDeep(alertStructure))
}

export function AlertBoxBase({reducer}: {reducer: ReturnType<typeof useAlertReducer>}) {
  const [state, dispatch] = reducer;
  const {
    isOpen,
    width,
    type,
    icon,
    title,
    message,
    closeButton,
    closeButtonCallback,
  } = state;

  return <Alert
  
    variant={ type =="error" ? "destructive" : "default"} 
    className={`${isOpen ? "grid" : "hidden"} mt-6 relative`}
    style={{
      width: width ? width : "auto",
    }}
  >
    {icon ? icon : <AlertCircleIcon />}
    <AlertTitle className=" font-bold">{title}</AlertTitle>
    <div className="absolute top-0 right-0 m-1">
      {closeButton && <button
        className="cursor-pointer"
        onClick={
          ()=>{
            if(!closeButtonCallback){
              dispatch({ type: "close" });            
              return;
            }
            closeButtonCallback( ()=>{
              dispatch({ type: "close" });
            }); 
          }
        }
      >
        <X size={16}></X>
      </button>}
    </div>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
}

export function MakeErrorAlert(struct: Partial<ALERT_STRUCTURE>): ALERT_INSTRUCTION {
  const structureRefined:ALERT_STRUCTURE = {
    ...alertStructure,
    isOpen: true,
    icon: <AlertCircleIcon />,
    type: "error",
    ...struct,
  }
  return {type: "update", data: structureRefined};
}

export function MakeAlertClose(): ALERT_INSTRUCTION {
  const structureRefined:ALERT_STRUCTURE = {
    ...alertStructure,
    isOpen: false,
  }
  return {type: "update", data: structureRefined};
}