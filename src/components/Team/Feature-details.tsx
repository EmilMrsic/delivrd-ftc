import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Car, DollarSign, ThumbsUp, X } from "lucide-react";
import EditableDropdown from "../base/editable-dropdown";
import EditableInput from "../base/input-field";
import { Separator } from "@radix-ui/react-separator";
import EditableTextArea from "../base/editable-textarea";
import { EditNegotiationData } from "@/types";
import { dateFormat, vehicleOfInterest } from "@/lib/utils";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusCard } from "../tailwind-plus/card";

type FeatureDetailsProps = {
  negotiation: NegotiationDataType | null;
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
    const fixDateOffset = (date: any) => {
      if (!date) return null; // Ensure we don't modify null values
      const d = new Date(date);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // Correct timezone offset
      return d;
    };

    setDealStartDate(fixDateOffset(negotiation?.dealStartDate));
    setArrivalToDealer(fixDateOffset(negotiation?.arrivalToDealer));
    setArrivalToClient(fixDateOffset(negotiation?.arrivalToClient));
    setCloseDate(fixDateOffset(negotiation?.closeDate));
  }, [negotiation]);

  return (
    <TailwindPlusCard title="Deal Details">
      <div className="flex items-center space-x-2 text-[#202125]">
        <Car className="h-5 w-5 text-[#0989E5]" />
        <span>
          <EditableDropdown
            options={["New", "Used"]}
            label="Condition"
            value={negotiation?.condition ?? ""}
            negotiationId={negotiationId ?? ""}
            field="condition"
            onChange={(newValue) =>
              handleChange("dealInfo", "condition", newValue)
            }
          />
        </span>
      </div>
      <div className="flex items-center space-x-2 text-[#202125]">
        <Car className="h-5 w-5 text-[#0989E5]" />
        <EditableDropdown
          options={vehicleOfInterest}
          label="Vehicle of Interest"
          value={negotiation?.brand ?? ""}
          negotiationId={negotiationId ?? ""}
          field="brand"
          onChange={(newValue) => handleChange("dealInfo", "brand", newValue)}
        />
      </div>
      <div className="flex items-center space-x-2 text-[#202125]">
        <Car className="h-5 w-5 text-[#0989E5]" />
        <EditableInput
          label="Model"
          value={negotiation?.model ?? "Model not available"}
          negotiationId={negotiationId ?? ""}
          field="model"
          onChange={(newValue) => handleChange("dealInfo", "model", newValue)}
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
          value={negotiation?.trim ?? "Trim info not available"}
          negotiationId={negotiationId ?? ""}
          field="trim"
          onChange={(newValue) => handleChange("dealInfo", "trim", newValue)}
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
          value={negotiation?.drivetrain ?? ""}
          negotiationId={negotiationId ?? ""}
          field="drivetrain"
          onChange={(newValue) =>
            handleChange("dealInfo", "drivetrain", newValue)
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
          value={negotiation?.tradeInInfo ?? "Trade in not available"}
          negotiationId={negotiationId ?? ""}
          field="tradeInInfo"
          onChange={(newValue) =>
            handleChange("dealInfo", "tradeInInfo", newValue)
          }
        />
      </div>
      <div className="flex items-center space-x-2 text-[#202125]">
        <DollarSign className="h-5 w-5 text-[#0989E5]" />
        <EditableDropdown
          options={["Lease", "Cash", "Finance", "Need to Discuss"]}
          label="Finance Type"
          value={negotiation?.howToPay ?? "Need to Discuss"}
          negotiationId={negotiationId ?? ""}
          field="howToPay"
          onChange={(newValue) =>
            handleChange("dealInfo", "howToPay", newValue)
          }
        />
      </div>
      <div className="flex items-center space-x-2 text-[#202125]">
        <DollarSign className="h-5 w-5 text-[#0989E5]" />
        <EditableInput
          label="Budget"
          value={negotiation?.budget ?? "No negotiation budget"}
          negotiationId={negotiationId ?? ""}
          field="budget"
          onChange={(newValue) => handleChange("dealInfo", "budget", newValue)}
        />
      </div>
      <div className="flex items-center space-x-2 text-[#202125]">
        <DollarSign className="h-5 w-5 text-[#0989E5]" />
        <EditableInput
          label="Monthly Budget"
          value={negotiation?.monthlyBudget ?? "No monthly budget"}
          negotiationId={negotiationId ?? ""}
          field="monthlyBudget"
          onChange={(newValue) =>
            handleChange("dealInfo", "monthlyBudget", newValue)
          }
        />
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Features and Trim Details</h3>
        <EditableTextArea
          value={negotiation?.trim ?? "Trim details not available"}
          negotiationId={negotiationId ?? ""}
          field="trimPackageOptions"
          onChange={(newValue) => handleChange("dealInfo", "trim", newValue)}
        />
      </div>
      <div className="space-x-2 flex items-center">
        <h3 className="font-semibold text-lg">Date Paid:</h3>
        <p>{dateFormat(negotiation?.datePaid ?? "")}</p>
      </div>
      <div className="space-x-2 flex items-center">
        <h3 className="font-semibold text-lg">Start Date:</h3>
        <DatePicker
          selected={dealStartDate}
          onChange={(date) => {
            setDealStartDate(date);
            handleDateChange(date, "dealStartDate");
          }}
          dateFormat="MM-dd-yyyy"
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
            handleDateChange(date, "arrivalToDealer");
          }}
          dateFormat="MM-dd-yyyy"
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
            handleDateChange(date, "arrivalToClient");
          }}
          dateFormat="MM-dd-yyyy"
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
            handleDateChange(date, "closeDate");
          }}
          dateFormat="MM-dd-yyyy"
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
            value={negotiation?.desiredInterior ?? "No preference"}
            negotiationId={negotiationId ?? ""}
            field="desiredInterior"
            onChange={(newValue) =>
              handleChange(
                "otherData",
                "negotiations_Color_Options.interior_preferred",
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
            value={negotiation?.desiredExterior ?? "No preference"}
            negotiationId={negotiationId ?? ""}
            field="desiredExterior"
            onChange={(newValue) =>
              handleChange(
                "otherData",
                "negotiations_Color_Options.exterior_preferred",
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
            value={negotiation?.excludedExterior ?? "No preference"}
            negotiationId={negotiationId ?? ""}
            field="excludedExterior"
            onChange={(newValue) =>
              handleChange("otherData", "excludedExterior", newValue)
            }
          />
        </div>
        <div className="flex items-center space-x-2 text-[#202125]">
          <X className="h-5 w-5 text-red-500" />
          <EditableInput
            negotiations={negotiation}
            label="Internal Colors Not Wanted"
            value={negotiation?.excludedInterior ?? "No preference"}
            negotiationId={negotiationId ?? ""}
            field="excludedInterior"
            onChange={(newValue) =>
              handleChange("otherData", "excludedInterior", newValue)
            }
          />
        </div>
      </div>
    </TailwindPlusCard>
  );
};

export default FeatureDetails;
