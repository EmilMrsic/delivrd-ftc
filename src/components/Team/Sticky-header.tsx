import { EditNegotiationData } from "@/types";
import { Car, DollarSign, ThumbsUp } from "lucide-react";
import React from "react";

const StickyHeader = ({
  negotiation,
}: {
  negotiation: EditNegotiationData | null;
}) => {
  return (
    <div className="md:hidden sticky top-0 z-10 bg-gradient-to-r from-[#202125] to-[#0989E5] text-white p-4 rounded-lg shadow-md space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold flex items-center">
          <Car className="mr-2 h-4 w-4" />
          {negotiation?.dealInfo?.negotiations_Brand}{" "}
          {negotiation?.dealInfo?.negotiations_Model}
        </span>
        <span>
          <DollarSign className="inline mr-1 h-4 w-4" />
          {negotiation?.dealInfo?.negotiations_Budget ?? "No budget available"}
        </span>
      </div>
      <div className="flex justify-between  items-start">
        <div>
          <span>
            <ThumbsUp className="inline mr-1 h-4 w-4" />
            {negotiation?.otherData?.negotiations_Color_Options ? (
              <span>
                Preferred Exterior{" "}
                {negotiation?.otherData?.negotiations_Color_Options[0]
                  ?.preferred ?? ""}
                <br />
                Deal Breaker Exterior{" "}
                {negotiation?.otherData?.negotiations_Color_Options[0]
                  ?.not_preferred ?? ""}
              </span>
            ) : (
              "No color options available"
            )}
          </span>
          <br />
          <span>
            <ThumbsUp className="inline mr-1 h-4 w-4" />
            {negotiation?.otherData?.negotiations_Color_Options ? (
              <span>
                Preferred Interior{" "}
                {negotiation?.otherData?.negotiations_Color_Options[1]
                  ?.preferred ?? ""}
                <br />
                Deal Breaker Interior{" "}
                {negotiation?.otherData?.negotiations_Color_Options[1]
                  ?.not_preferred ?? ""}
              </span>
            ) : (
              "No color options available"
            )}
          </span>
        </div>
        <span className="flex items-center">
          <DollarSign className="inline mr-1 h-4 w-4" />
          {negotiation?.dealInfo?.negotiations_Payment_Budget}/mo
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="inline mr-1 h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
          </svg>
          Trade In:{" "}
          {negotiation?.dealInfo?.negotiations_Trade_Details ?? "No Trade In"}
        </span>
        <span>{negotiation?.dealInfo?.negotiations_How_To_Pay}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>
          <Car className="inline mr-1 h-4 w-4" />
          Drivetrain:{" "}
          {negotiation?.dealInfo?.negotiations_Drivetrain ?? "No Preference"}
        </span>
      </div>
    </div>
  );
};

export default StickyHeader;
