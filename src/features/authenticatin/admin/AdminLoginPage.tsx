import { Card, CardContent, CardTitle } from "@/components/ui/card";
import LoginPasswordForm from "../form/LoginPasswordForm";

export default function AdminLoginPage(){
  return <>
  <main className="flex justify-center">
    <Card className="basis-100 mt-[10vh]">
      <CardTitle className="text-center">
        Admin Login Page
      </CardTitle>
      
      <CardContent>
        <LoginPasswordForm
          role="admin"
        />
      </CardContent>
    </Card>
  </main>
  </>
}