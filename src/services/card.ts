import type { ModelCardRaw } from "@/types/model/cards";
import type { QueryProps } from "@/types/model/filter";

export class CardService {
  get (props: {query?: QueryProps}): ModelCardRaw[] {
    return [];
  }
  getById (id: string): ModelCardRaw | null {
    return null;
  }
}