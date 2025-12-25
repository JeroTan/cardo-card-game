import ModalBase, { makeInfoModal, makeLoadingModal, useModalReducer } from "@/components/overlay/ModalBase";
import { Button } from "@/components/ui/button";
import { makeStorage } from "@/stores/client/localStorageDefinition";
import { actions } from "astro:actions";
import { HomeIcon, Power } from "lucide-react";

export default function HeaderAdminAuthNavigation(){
  const modalReducer = useModalReducer();

  return <div className="flex h-full items-center">
    <Button asChild variant="ghost">
      <a href="/admin/dashboard">
        <HomeIcon className="size-full"/>
      </a>
    </Button>
    <Button variant={"ghost"} className=" ml-auto"
      onClick={()=>{
        modalReducer[1](makeInfoModal({
          title: "Log-out",
          message: "Are you sure you want to log out?",
          acceptButton: true,
          rejectButton: true,
          acceptButtonText: "Yes, Log me out",
          rejectButtonText: "Cancel",
          acceptButtonCallback: async ()=>{
            modalReducer[1](makeLoadingModal({
              title: "Logging Out",
              message: "Please wait while we log you out.",
            }));
            await actions.authentication.logout();
            makeStorage("adminAuthToken").remove();
            location.href = "/admin/auth";
          }
        }));
      }}
    >
      <Power />
      Log Out
    </Button>
    <ModalBase reducer={modalReducer} />
  </div>
}