import { listTables } from "@/lib/querybuilder";
import { uploadCardImage } from "@/lib/r2";
import type { CardService } from "@/services/card";
import type { typeCardCreate } from "@/types/api/card";
import type { ModContext } from "@/types/elysia/types";
import type { QueryProps } from "@/types/model/filter";


export class CardController {
  constructor(
    public cardService: CardService,
  ){}
  
  public getAllCards = async ({env, queryParams, origin = ""}:{env:Env, queryParams?:QueryProps, origin?: string}) => {
    const cards = await this.cardService.get({env, queryParams});
    if(cards.length <= 0) {
      return Response.json({
        message: "No cards found",
        data: [],
      });
    }

    // In order to provide full URL for card images
    cards.forEach(card => {
      card.card_art = `${origin}/api/public/resources/card/${card.card_art}`;
    })

    return Response.json({
      message: "Cards retrieved successfully",
      data: cards,
    });
  } 
  public createCard = async ({cardData, env}:{cardData: typeCardCreate, env:Env}) => {

    //Upload the image to R2
    const cardImageId = await uploadCardImage({env, file: cardData.card_art});
    if(!cardImageId) {
      return Response.json({
        message: "Failed to upload card image",
      }, {status: 500});
    }

    // use to prepare data for database 
    const cardDataToDatabase = {
      name: cardData.name,
      rarity: cardData.rarity,
      atk: cardData.atk,
      def: cardData.def,
      description: cardData.description,
      card_art: cardImageId,
    };
    
    const result = await this.cardService.create(env, cardDataToDatabase);
    if(!result) {
      return Response.json({
        message: "Failed to create card",
      }, {status: 500});
    }

    return result;
  }
}