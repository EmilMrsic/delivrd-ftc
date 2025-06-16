import { NegotiationDataType } from "@/lib/models/team";
import { ImageCarousel } from "../base/image-carousel";

export const TradeInTable = ({
  negotiations,
}: {
  negotiations: NegotiationDataType[];
}) => {
  if (!negotiations) return null;
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {negotiations
        .filter((negotiation) => negotiation?.tradeDetails?.fileUrls?.length)
        // .slice(0, 1)
        .map((negotiations, idx) => {
          console.log("negotiation: ", negotiations);
          return (
            <div key={idx} className="basis-1/2 min-w-0">
              <ImageCarousel
                images={negotiations.tradeDetails?.fileUrls || []}
              />
            </div>
          );
        })}
    </div>
  );
};
