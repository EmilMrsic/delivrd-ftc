import { NegotiationDataType } from "@/lib/models/team";
import { ImageCarousel } from "../base/image-carousel";
import { GridDisplay } from "../tailwind-plus/grid-display";
import { Button } from "../ui/button";
import { useIsMobile, useScreenSize } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

export const TradeInTable = ({
  negotiations,
}: {
  negotiations: NegotiationDataType[];
}) => {
  const screenSize = useScreenSize();
  const isMobile = useIsMobile();
  if (!negotiations) return null;
  return (
    <div
      className={cn(
        `w-full mt-4`,
        !isMobile &&
          `grid gap-4 ${screenSize > 2000 ? "grid-cols-3" : "grid-cols-2"}`
      )}
    >
      {negotiations
        .filter((negotiation) => negotiation?.tradeDetails?.fileUrls?.length)
        // .slice(0, 1)
        .map((negotiation, idx) => {
          console.log("negotiation: ", negotiation);
          return (
            // max-w-[800px]
            <div key={idx} className="basis-1/2 min-w-0">
              <div className="rounded-lg border border-gray-200">
                <ImageCarousel
                  images={negotiation.tradeDetails?.fileUrls || []}
                  className="rounded-t-lg"
                />
                <div className="mt-4 p-4">
                  <GridDisplay
                    title={`${negotiation.brand} ${negotiation.model}`}
                    columns={[
                      [
                        {
                          title: "Vin",
                          value: negotiation.tradeDetails?.vin,
                        },
                        {
                          title: "Mileage",
                          value: negotiation.tradeDetails?.mileage,
                        },
                      ],
                      [
                        // {
                        //   title: "Color",
                        //   value: "N/A",
                        // },
                        {
                          title: "Location",
                          value: `${negotiation.city}, ${negotiation.state}`,
                        },
                      ],
                      {
                        title: "Comments",
                        value: negotiation.tradeDetails?.comments,
                        config: {
                          bold: false,
                        },
                      },
                    ]}
                  />
                  <hr className="my-4" />
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-500 font-semibold my-auto">
                      Listed: {negotiation.createdAt.split("T")[0]}
                    </div>
                    <div>
                      <Button className="bg-blue-500 text-white hover:bg-blue-500 hover:text-white">
                        Place Bid
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
