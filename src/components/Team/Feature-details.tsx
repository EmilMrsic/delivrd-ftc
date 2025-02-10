import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Car, DollarSign, ThumbsUp, X } from "lucide-react";
import EditableDropdown from "../base/editable-dropdown";
import EditableInput from "../base/input-field";
import { Separator } from "@radix-ui/react-separator";
import EditableTextArea from "../base/editable-textarea";
import { EditNegotiationData } from "@/types";
import { vehicleOfInterest } from "@/lib/utils";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";

type FeatureDetailsProps = {
  negotiation: EditNegotiationData | null;
  negotiationId: string | null;
  handleChange: (section: string, child: string, value: string) => void;
  setShowStickyHeader?: (item: boolean) => void;
};

const FeatureDetails = ({
  negotiation,
  negotiationId,
  handleChange,
  setShowStickyHeader,
}: FeatureDetailsProps) => {
  const dealDetailsRef = useRef(null);
  const [dealStartDate, setDealStartDate] = useState<Date | null>();
  const [arrivalToDealer, setArrivalToDealer] = useState<Date | null>();
  const [arrivalToClient, setArrivalToClient] = useState<Date | null>();
  const [closeDate, setCloseDate] = useState<Date | null>();
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyHeader && setShowStickyHeader(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (dealDetailsRef.current) {
      observer.observe(dealDetailsRef.current);
    }

    return () => {
      if (dealDetailsRef.current) {
        observer.unobserve(dealDetailsRef.current);
      }
    };
  }, []);

  const formatDateToLocal = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const day = String(date.getDate()).padStart(2, "0");

      return `${month}-${day}-${year}`; // Format as yyyy-MM-dd
    }
  };

  const handleDateChange = async (date: Date | null, fieldPath: string) => {
    const id = negotiation?.id;
    try {
      const docRef = doc(db, "negotiations", id ?? "");
      await updateDoc(docRef, {
        [fieldPath]: formatDateToLocal(date),
      });
      console.log(`${fieldPath} updated successfully.`);
      toast({ title: "Date update successfully" });
    } catch (error) {
      console.error(`Error updating ${fieldPath}:`, error);
    }
  };

  useEffect(() => {
    setDealStartDate(
      negotiation?.dealInfo?.negotiations_Deal_Start_Date
        ? new Date(negotiation.dealInfo?.negotiations_Deal_Start_Date)
        : null
    );
    setArrivalToDealer(
      negotiation?.clientInfo?.arrival_to_dealer
        ? new Date(negotiation?.clientInfo?.arrival_to_dealer)
        : null
    );
    setArrivalToClient(
      negotiation?.clientInfo?.arrival_to_client
        ? new Date(negotiation?.clientInfo?.arrival_to_client)
        : null
    );
    setCloseDate(
      negotiation?.clientInfo?.close_date
        ? new Date(negotiation?.clientInfo?.close_date)
        : null
    );
  }, [negotiation]);

  return (
    <Card className="bg-white shadow-lg mb-5" ref={dealDetailsRef}>
      <CardHeader className="bg-gradient-to-r from-[#202125] to-[#0989E5] text-white">
        <CardTitle className="flex items-center">
          <Car className="mr-2" /> Deal Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center space-x-2 text-[#202125]">
          <Car className="h-5 w-5 text-[#0989E5]" />
          <span>
            <EditableDropdown
              options={["New", "Used"]}
              label="Condition"
              value={negotiation?.dealInfo?.negotiations_New_or_Used ?? ""}
              negotiationId={negotiationId ?? ""}
              field="negotiations_New_or_Used"
              onChange={(newValue) =>
                handleChange("dealInfo", "negotiations_New_or_Used", newValue)
              }
            />
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <Car className="h-5 w-5 text-[#0989E5]" />
          <EditableDropdown
            options={vehicleOfInterest}
            label="Vehicle of Interest"
            value={negotiation?.dealInfo?.negotiations_Brand ?? ""}
            negotiationId={negotiationId ?? ""}
            field="negotiations_Brand"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_Brand", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <Car className="h-5 w-5 text-[#0989E5]" />
          <EditableInput
            label="Model"
            value={
              negotiation?.dealInfo?.negotiations_Model ?? "Model not available"
            }
            negotiationId={negotiationId ?? ""}
            field="negotiations_Model"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_Model", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#0989E5]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
          <EditableInput
            label="Trim"
            value={
              negotiation?.dealInfo?.negotiations_Trim_Package_Options ??
              "Trim info not available"
            }
            negotiationId={negotiationId ?? ""}
            field="negotiations_Trim"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_Trim", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <Car className="h-5 w-5 text-[#0989E5]" />
          <EditableDropdown
            options={[
              "No Preference",
              "Two-wheel drive",
              "Four-wheel drive",
              "All-wheel drive",
            ]}
            label="Drivetrain"
            value={negotiation?.dealInfo?.negotiations_Drivetrain ?? ""}
            negotiationId={negotiationId ?? ""}
            field="negotiations_Drivetrain"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_Drivetrain", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#0989E5]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
          </svg>
          <EditableInput
            label="Trade In"
            value={
              negotiation?.dealInfo?.negotiations_Trade_Details ??
              "Trade in not available"
            }
            negotiationId={negotiationId ?? ""}
            field="negotiations_Trade_Details"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_Trade_Details", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <DollarSign className="h-5 w-5 text-[#0989E5]" />
          <EditableDropdown
            options={["Lease", "Cash", "Finance"]}
            label="Finance Type"
            value={
              negotiation?.dealInfo?.negotiations_How_To_Pay ??
              "No finance type"
            }
            negotiationId={negotiationId ?? ""}
            field="negotiations_How_To_Pay"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_How_To_Pay", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <DollarSign className="h-5 w-5 text-[#0989E5]" />
          <EditableInput
            label="Budget"
            value={
              negotiation?.dealInfo?.negotiations_Budget ??
              "No negotiation budget"
            }
            negotiationId={negotiationId ?? ""}
            field="negotiations_Budget"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_Budget", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <DollarSign className="h-5 w-5 text-[#0989E5]" />
          <EditableInput
            label="Monthly Budget"
            value={
              negotiation?.dealInfo?.negotiations_Payment_Budget ??
              "No monthly budget"
            }
            negotiationId={negotiationId ?? ""}
            field="negotiations_Payment_Budget"
            onChange={(newValue) =>
              handleChange("dealInfo", "negotiations_Payment_Budget", newValue)
            }
          />
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Features and Trim Details</h3>
          <EditableTextArea
            value={
              negotiation?.dealInfo?.negotiations_Trim_Package_Options ??
              "Trim details not available"
            }
            negotiationId={negotiationId ?? ""}
            field="negotiations_Trim_Package_Options"
            onChange={(newValue) =>
              handleChange(
                "dealInfo",
                "negotiations_Trim_Package_Options",
                newValue
              )
            }
          />
        </div>
        <div className="space-x-2 flex items-center">
          <h3 className="font-semibold text-lg">Date Paid:</h3>
          <p>{negotiation?.clientInfo.date_paid ?? "No Date Available"}</p>
        </div>
        <div className="space-x-2 flex items-center">
          <h3 className="font-semibold text-lg">Start Date:</h3>
          <DatePicker
            selected={dealStartDate}
            onChange={(date) => {
              setDealStartDate(date);
              handleDateChange(date, "negotiations_Deal_Start_Date");
            }}
            dateFormat="dd-yyyy-MM"
            placeholderText="Select a date"
            className="border border-gray-300 rounded-md px-2 py-1"
          />
        </div>

        <div className="space-x-2 flex items-center">
          <h3 className="font-semibold text-lg">Arrival To Dealer:</h3>
          <DatePicker
            selected={arrivalToDealer}
            onChange={(date) => {
              setArrivalToDealer(date);
              handleDateChange(date, "arrival_to_dealer");
            }}
            dateFormat="dd-yyyy-MM"
            placeholderText="Select a date"
            className="border border-gray-300 rounded-md px-2 py-1"
          />
        </div>
        <div className="space-x-2 flex items-center">
          <h3 className="font-semibold text-lg">Arrival To Client:</h3>
          <DatePicker
            selected={arrivalToClient}
            onChange={(date) => {
              setArrivalToClient(date);
              handleDateChange(date, "arrival_to_client");
            }}
            dateFormat="dd-yyyy-MM"
            placeholderText="Select a date"
            className="border border-gray-300 rounded-md px-2 py-1"
          />
        </div>
        <div className="space-x-2 flex items-center">
          <h3 className="font-semibold text-lg">Close Date:</h3>
          <DatePicker
            selected={closeDate}
            onChange={(date) => {
              setCloseDate(date);
              handleDateChange(date, "close_date");
            }}
            dateFormat="dd-yyyy-MM"
            placeholderText="Select a date"
            className="border border-gray-300 rounded-md px-2 py-1"
          />
        </div>

        <Separator className="my-4" />
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Colors</h3>
          <div className="flex items-center space-x-2 text-[#202125]">
            <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
            <EditableInput
              negotiations={negotiation}
              label="Internal Colors Desired"
              value={
                negotiation?.otherData?.negotiations_Color_Options[0]
                  ?.preferred ?? "No preference"
              }
              negotiationId={negotiationId ?? ""}
              field="negotiations_Color_Options[0].preferred"
              onChange={(newValue) =>
                handleChange(
                  "otherData",
                  "negotiations_Color_Options[0].preferred",
                  newValue
                )
              }
            />
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
            <EditableInput
              negotiations={negotiation}
              label="External Colors Desired"
              value={
                negotiation?.otherData?.negotiations_Color_Options[1]
                  ?.preferred ?? "No preference"
              }
              negotiationId={negotiationId ?? ""}
              field="negotiations_Color_Options[1].preferred"
              onChange={(newValue) =>
                handleChange(
                  "otherData",
                  "negotiations_Color_Options[1].preferred",
                  newValue
                )
              }
            />
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <X className="h-5 w-5 text-red-500" />
            <EditableInput
              negotiations={negotiation}
              label="External Colors Not Wanted"
              value={
                negotiation?.otherData?.negotiations_Color_Options[0]
                  ?.not_preferred ?? "No preference"
              }
              negotiationId={negotiationId ?? ""}
              field="negotiations_Color_Options[0]
                  .not_preferred"
              onChange={(newValue) =>
                handleChange(
                  "otherData",
                  "negotiations_Color_Options[0].not_preferred",
                  newValue
                )
              }
            />
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <X className="h-5 w-5 text-red-500" />
            <EditableInput
              negotiations={negotiation}
              label="Internal Colors Not Wanted"
              value={
                negotiation?.otherData?.negotiations_Color_Options[1]
                  ?.not_preferred ?? "No preference"
              }
              negotiationId={negotiationId ?? ""}
              field="negotiations_Color_Options[1]
                  .not_preferred"
              onChange={(newValue) =>
                handleChange(
                  "otherData",
                  "negotiations_Color_Options[1].not_preferred",
                  newValue
                )
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureDetails;
