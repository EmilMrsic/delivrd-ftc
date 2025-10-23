import { NegotiationDataType } from "@/lib/models/team";
import { ImageCarousel } from "../base/image-carousel";
import { GridDisplay } from "../tailwind-plus/grid-display";
import { Button } from "../ui/button";
import { useIsMobile, useScreenSize } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useContext, useEffect, useMemo, useState } from "react";
import { ModalForm } from "../tailwind-plus/modal-form";
import { NormalDropdown } from "../tailwind-plus/normal-dropdown";
import { negotiationMakeColors } from "@/lib/constants/negotiations";

import { DealerContext } from "@/lib/context/dealer-context";
import { createNewBid } from "@/lib/helpers/bids";
import { BackwardIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export const TradeInTable = ({
  negotiations,
  refetch,
  selectedTradeIn,
  publicMode = false,
}: {
  negotiations: NegotiationDataType[];
  refetch: () => void;
  selectedTradeIn: string | null;
  publicMode?: boolean;
}) => {
  const screenSize = useScreenSize();
  const isMobile = useIsMobile();
  const [selectedNegotiation, setSelectedNegotiation] =
    useState<NegotiationDataType | null>(null);

  const [filteredNegotiations, setFilteredNegotiations] =
    useState<NegotiationDataType[]>(negotiations);

  const brandOptions = useMemo(() => {
    return Array.from(
      new Set(
        negotiations.map((negotiation) => {
          return negotiation.brand;
        })
      )
    );
  }, [negotiations]);

  const [sortConfig, setSortConfig] = useState<{
    brand: keyof typeof negotiationMakeColors;
    sort: "Most Recent" | "Oldest First";
  }>({
    brand: "All",
    sort: "Most Recent",
  });

  useEffect(() => {
    // setFilteredNegotiations(negotiations);
    const filtered = negotiations.filter((negotiation) => {
      if (sortConfig.brand !== "All") {
        return negotiation.brand === sortConfig.brand;
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortConfig.sort === "Most Recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    setFilteredNegotiations(sorted);
  }, [sortConfig]);

  useEffect(() => {
    setFilteredNegotiations(negotiations);
  }, [negotiations]);

  if (!filteredNegotiations) return null;

  return (
    <>
      {!publicMode && (
        <div className="mt-4">
          <Link href="/bid">
            <Button
              variant="outline"
              className="w-fit bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
            >
              <BackwardIcon className="w-6 h-6 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      )}
      <div className="text-xl font-bold mt-4 mb-2">
        Available Trade-in Vehicles
      </div>
      <div className="flex justify-between">
        <div>
          Filter by Brand:{" "}
          <NormalDropdown
            options={["All", ...brandOptions]}
            default="All"
            onChange={(value) => {
              setSortConfig({
                brand: value as keyof typeof negotiationMakeColors,
                sort: "Most Recent",
              });
            }}
          />
        </div>
        <div>
          Sort By:{" "}
          <NormalDropdown
            options={["Most Recent", "Oldest First"]}
            default="Most Recent"
            onChange={(value) => {
              setSortConfig({
                brand: sortConfig.brand,
                sort: value as "Most Recent" | "Oldest First",
              });
            }}
          />
        </div>
      </div>
      <div
        className={cn(
          `w-full mt-4`,
          !isMobile &&
            `grid gap-4 ${screenSize > 2000 ? "grid-cols-3" : "grid-cols-2"}`
        )}
      >
        {filteredNegotiations
          .filter((negotiation) => {
            const noFiles =
              negotiation?.tradeDetails == null ||
              negotiation?.tradeDetails?.fileUrls == null ||
              negotiation?.tradeDetails?.fileUrls.length === 0;

            return !noFiles;
          })
          .map((negotiation, idx) => {
            return (
              // max-w-[800px]
              <div key={idx} className="basis-1/2 min-w-0">
                <TradeInCard
                  negotiation={negotiation}
                  setSelectedNegotiation={setSelectedNegotiation}
                  selectedTradeIn={selectedTradeIn}
                  publicMode={publicMode}
                />
              </div>
            );
          })}
      </div>
      {selectedNegotiation && (
        <TradeInBidForm
          negotiation={selectedNegotiation}
          onClose={() => setSelectedNegotiation(null)}
          refetch={refetch}
        />
      )}
    </>
  );
};

export const TradeInCard = ({
  negotiation,
  setSelectedNegotiation,
  selectedTradeIn,
  publicMode,
}: {
  negotiation: NegotiationDataType;
  setSelectedNegotiation: (negotiation: NegotiationDataType) => void;
  selectedTradeIn: string | null;
  publicMode: boolean;
}) => {
  const mainCard = (
    <div
      className={cn(`rounded-lg border border-gray-200 bg-white`)}
      id={negotiation.id}
    >
      <ImageCarousel
        images={negotiation.tradeDetails?.fileUrls || []}
        className="rounded-t-lg"
      />
      <div className="mt-4 p-4">
        <GridDisplay
          title={`${negotiation.tradeInInfo}`} //${negotiation.brand} ${negotiation.model}`}
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
            Listed:{" "}
            {new Date(negotiation.createdAt).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            })}
          </div>
          <div>
            <Button
              className="bg-blue-500 text-white hover:bg-blue-500 hover:text-white"
              onClick={() => {
                if (publicMode) {
                  window.location.href = "/";
                } else {
                  setSelectedNegotiation(negotiation);
                }
              }}
            >
              Place Bid
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return window.location.hash === `#${negotiation.id}` ? (
    <div
      style={{
        position: "relative",
        borderRadius: "12px",
        padding: "8px",
        background: "linear-gradient(100deg, gold, goldenrod, #ffecb3)",
      }}
    >
      {mainCard}
    </div>
  ) : (
    mainCard
  );
};

export const TradeInBidForm = ({
  negotiation,
  onClose,
  refetch,
}: {
  negotiation: NegotiationDataType;
  onClose: () => void;
  refetch: () => void;
}) => {
  const dealer = useContext(DealerContext);
  const handleSubmit = async (values: any) => {
    if (!dealer) return;

    const newBid = await createNewBid(negotiation, dealer, values, "tradeIn");

    onClose();
    refetch();
  };

  return (
    <ModalForm
      onClose={onClose}
      title="Place Bid"
      height={60}
      fields={[
        {
          name: "header",
          type: "infobox",
          props: {
            innerComponent: () => (
              <>
                <div className="text-lg font-bold">
                  {negotiation.brand} {negotiation.model}
                </div>
                <div className="text-sm text-gray-500">
                  VIN: {negotiation.tradeDetails?.vin}
                </div>
              </>
            ),
            color: "white",
            noBorder: true,
          },
        },
        {
          name: "price",
          label: "Your Offer",
          required: true,
        },
        {
          name: "comments",
          label: "Comments",
          required: false,
          type: "textarea",
        },
        {
          name: "files",
          label: "Upload Supporting Documents",
          type: "files",
        },
      ]}
      submitButtonLabel="Submit Bid"
      onSubmit={handleSubmit}
    />
  );
};
