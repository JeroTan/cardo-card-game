import { Card } from "@/components/ui/card";
import PackCardDeckCounter from "./PackCardDeckCounter";
import PackCardDeckTargetContainer from "./PackCardDeckTargetContainer";

export default function PackCardDeck({}:{}){
  return <>
    <Card className="p-2 @container">
      <h2 className="px-2 text-xl">
        Pack Container
      </h2>
      <PackCardDeckCounter />
      <div className="relative min-h-[calc(100vh-430px)] h-full">
        <PackCardDeckTargetContainer />
      </div>
    </Card>
  </>
}