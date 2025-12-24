import { Card, CardContent, CardTitle } from "@/components/ui/card";
import LoginPasswordForm from "../form/LoginPasswordForm";
import AlertProvider from "@/stores/components/AlertContext";
import { ModalProvider } from "@/stores/components/ModalContext";

export default function AdminLoginPage(){
  return <>
  <ModalProvider>
  <main className="flex justify-center">
    <div className="basis-100 mt-[10vh] space-y-5">
      <AlertProvider>
        <Card >
          <CardTitle className="text-center">
            Admin Login Page
          </CardTitle>
          
          <CardContent>
            <LoginPasswordForm
              role="admin"
            />
          </CardContent>
        </Card>
      </AlertProvider>
    </div> 
  </main>
  </ModalProvider>
  </>
}