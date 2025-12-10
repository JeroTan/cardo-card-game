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
  public createCard = async ({cardData, env}:{cardData: typeCardCreate, env:Env}) => {

    // use to prepare data for database 
    const cardDataToDatabase = {
      name: cardData.name,
      rarity: cardData.rarity,
      atk: cardData.atk,
      def: cardData.def,
      description: cardData.description,
      card_art: "",
    };
    
    const result = await this.cardService.create(env, cardDataToDatabase);
    // return {
    //   data: result,
    // }
    return "SAMPLE"
  }
}