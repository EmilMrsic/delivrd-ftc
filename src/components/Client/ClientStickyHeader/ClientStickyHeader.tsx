import { IUser, NegotiationData } from "@/types";
import { Car, DollarSign } from "lucide-react";
import React from "react";

const ClientStickyHeader = ({
  userData,
  negotiationData,
}: {
  userData?: IUser;
  negotiationData: NegotiationData[];
}) => {
  return (
    <div className="md:hidden sticky w-full top-0 z-10 bg-gradient-to-r from-[#202125] to-[#0989E5] text-white p-4 rounded-lg shadow-md space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold flex items-center">
          <Car className="mr-2 h-4 w-4" />
          {userData?.brand} {(userData?.model && userData?.model[0]) ?? ""}
        </span>
        <span>
          <DollarSign className="inline mr-1 h-4 w-4" />
          {negotiationData[0]?.negotiations_Budget}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="inline mr-1 h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {userData?.color_options &&
            userData?.color_options.exterior.preferred}
        </span>
        <span>
          <DollarSign className="inline mr-1 h-4 w-4" />
          {negotiationData[0]?.negotiations_Payment_Budget}/mo
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
          Trade In: {userData?.trade_details}
        </span>
        <span>
          <DollarSign className="inline mr-1 h-4 w-4" />
          {userData?.deals && userData?.deals[0].payment_type}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>
          <Car className="inline mr-1 h-4 w-4" />
          Drivetrain: {userData?.drive_train}
        </span>
      </div>
    </div>
  );
};

export default ClientStickyHeader;
