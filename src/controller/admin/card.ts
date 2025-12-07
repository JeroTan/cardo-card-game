import type { CardService } from "@/services/card";
import type { Context } from "elysia";
import type { ModContext } from "@/types/elysia/types";


export class CardController {
  constructor(
    public cardService: CardService,
  ){}
  
  public getAllCards(request: ModContext){
    
    return {
      hi: "Hello"
    };
  } 
}