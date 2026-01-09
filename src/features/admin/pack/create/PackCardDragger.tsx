import ProgressCircle from '@/components/interactive/ProgressCircle';
import { useId, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';

export type CardPackLocationType = "FROM_DRAWER" | "FROM_DECK";

export default function PackCardDragger({
  locationType,
  cardId,
  referenceId,
  cardIndex = -1,
  children,
  clickCallback,
}:{
  locationType: CardPackLocationType,
  cardId: string,
  referenceId?: string,
  cardIndex?: number,
  children?: React.ReactNode,
  clickCallback?: ()=>void,
}){
  referenceId = referenceId || useId(); // generate id if not provided
  
  const initialToleranceTimer = useRef<NodeJS.Timeout>(8 as unknown as NodeJS.Timeout); // run within a 100ms
  const holdTriggerTimer = useRef<NodeJS.Timeout>(8 as unknown as NodeJS.Timeout); // then followed by 100ms hold to activate hold drag
  const holdTriggerCounter =useState(0);
  const delayTimer = 100; // ms

  // This is  react-dnd drag hook
  const {attributes, listeners, setNodeRef:dragRef, transform} = useDraggable({
    id: referenceId,
    data:{
      type: locationType,
      cardId: cardId,
      cardIndex: cardIndex,
    },
  });

  return <>
    <div className='relative w-fit h-fit'>
       <div 
        ref={dragRef}
        className={`${transform ? "absolute z-50 cursor-grabbing" : "relative"} w-fit h-fit touch-none ${ holdTriggerCounter[0] > 0 ? "opacity-70" : "opacity-100" }`}
        onPointerDown={()=>{
          // Start initial tolerance timer
          initialToleranceTimer.current = setTimeout(()=>{
            let thisCounter = 0; // local counter
            // After tolerance time passed, start hold trigger timer
            holdTriggerTimer.current = setInterval(()=>{
              holdTriggerCounter[1]((c)=>c+1); // increment counter
              thisCounter += 1;
              if(thisCounter >= delayTimer*0.25){ // if held for nth times
                clearInterval(holdTriggerTimer.current); // clear interval
                holdTriggerCounter[1](0); // reset counter
              }
            }, 1);
          }, delayTimer*0.75);
        }}
        onClick={()=>{
          if(holdTriggerCounter[0] <= 0){
            clickCallback?.();
          }
        }}
        onPointerUp={()=>{
          clearTimeout(initialToleranceTimer.current);
          clearInterval(holdTriggerTimer.current);
          holdTriggerCounter[1](0);
        }}
        style={{
          transform: CSS.Translate.toString(transform),
        }}
        { ...({...listeners, ...attributes}) }
      >
        { holdTriggerCounter[0] > 0 && 
          <div className='absolute w-full h-full flex justify-center items-center z-10 bg-gray-900/75 rounded-lg'>
            <div className='w-16 aspect-square stroke-zinc-100'>
              <ProgressCircle 
                percent={ holdTriggerCounter[0] / (delayTimer*0.25) }
              />
            </div>
          </div>
        }
        {children}
        
      </div>
      {
        transform &&
        <div className='relative w-fit h-fit opacity-50'>
          {children}
        </div>
      }
    </div>
  </>
}