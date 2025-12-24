import { AlertBoxBase, useAlertReducer } from "@/components/overlay/AlertBox";
import { createContext } from "react";

export const AlertContext = createContext<ReturnType<typeof useAlertReducer>>(null!)

export default function AlertProvider({ children, position = "down" }: { children?: React.ReactNode | number | string, position?: "down" | "up" }){
  const alertReducer = useAlertReducer();
  return <AlertContext.Provider value={alertReducer}>
    {position == "up" && <AlertBoxBase reducer={alertReducer} />}
    {children}
    {position == "down" && <AlertBoxBase reducer={alertReducer} />}
  </AlertContext.Provider>
}