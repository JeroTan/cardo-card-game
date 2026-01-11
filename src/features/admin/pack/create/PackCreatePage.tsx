import CardPackBuilderProvider from "@/stores/card/CardPackBuilderContext"
import PackCreateForm from "./PackCreateForm"
import {DndContext,   MouseSensor, TouchSensor, useSensor, } from '@dnd-kit/core';
import { CardCacheProvider } from "@/stores/card/CardCacheContext";
import { PackMetaProvider } from "@/stores/card/CardPackMetaContext";
import { ModalProvider } from "@/stores/components/ModalContext";


export default function PackCreatePage(){
  const mouseSensor = useSensor(MouseSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 85,
      tolerance: 2,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 85,
      tolerance: 5,
    },
  });
  
  return <>
    <ModalProvider>
    <PackMetaProvider>
    <CardPackBuilderProvider>
    <CardCacheProvider>
    <DndContext sensors={[mouseSensor, touchSensor]}>
      <PackCreateForm />
    </DndContext>
    </CardCacheProvider>
    </CardPackBuilderProvider>
    </PackMetaProvider>
    </ModalProvider>
  </>
}