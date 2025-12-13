import { deleteCardImage, uploadCardImage } from "@/lib/r2";
import type { CardService } from "@/services/card";
import type { typeCardCreate } from "@/types/api/card";
import type { PageProps, QueryProps } from "@/types/model/filter";


export class CardController {
  constructor(
    public cardService: CardService,
  ){}
  
  public getAllCards = async ({env, queryProps, pageProps, origin = ""}:{env:Env, queryProps?:QueryProps, pageProps?: PageProps, origin?: string}) => {
    const { data: cards, error } = await this.cardService.get({env, queryProps, pageProps});
    if(error || !cards) {
      return Response.json({
        message: error || "No cards found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: pageProps?.page || 1,
        limit: pageProps?.limit || 10,
      }, {
        status: 422
      });
    }

    // In order to provide full URL for card images
    cards.data.forEach(card => {
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
      atk: cardData.atk,
      def: cardData.def,
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

  public deleteCard = async ({env, id}:{env:Env, id:string}) => {
    const result = await this.cardService.delete(env, id);
    if(result.error) {
      return Response.json({
        message: result.error,
      }, {status: 422});
    }

    // Delete the card image from R2
    await deleteCardImage({env, id});

    return Response.json({
      message: "Card deleted successfully",
      data: result.data,
    });
  }
}

