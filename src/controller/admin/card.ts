import { listTables } from "@/lib/querybuilder";
import type { CardService } from "@/services/card";
import type { typeCardCreate } from "@/types/api/card";
import type { ModContext } from "@/types/elysia/types";


export class CardController {
  constructor(
    public cardService: CardService,
  ){}
  
  public getAllCards = async (request: ModContext) => {
    // const result = await this.cardService.get(request.env)
    // return {
    //   data: result,
    // }
    return listTables(request.env.DB);
  } 
  public createCard = async (cardData: typeCardCreate ) => {
    console.log("Card Data:", cardData);
    // const result = await this.cardService.create(request.env, body);
    // return {
    //   data: result,
    // }
    return "SAMPLE"
  }
}