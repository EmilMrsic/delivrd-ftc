import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar, Car, DollarSign, ThumbsUp, X } from "lucide-react";
import EditableDropdown from "../base/editable-dropdown";
import EditableInput, { InputField } from "../base/input-field";
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
import { formatDateToLocal } from "@/lib/helpers/dates";

type FeatureDetailsProps = {
  negotiation: NegotiationDataType | null;
  negotiationId: string | null;
  handleChange: (updateObject: {
    key: string;
    newValue: string;
    parentKey?: string;
  }) => void;
  setShowStickyHeader?: (item: boolean) => void;
  clientMode: boolean;
};

const FeatureDetails = ({
  negotiation,
  negotiationId,
  handleChange,
  setShowStickyHeader,
  clientMode,
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

  const handleDateChange = async (date: Date | null, fieldPath: string) => {
    const id = negotiation?.id;
    try {
      const docRef = doc(db, "delivrd_negotiations", id ?? "");
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
    <TailwindPlusCard title="Deal Details" icon={Car}>
      <div className="space-y-4">
        <InputField
          type="searchableDropdown"
          options={["New", "Used"]}
          label="Condition"
          value={negotiation?.condition ?? ""}
          negotiationId={negotiationId ?? ""}
          field="condition"
          onChange={(newValue) =>
            handleChange({
              key: "condition",
              newValue: newValue,
            })
          }
          icon={Car}
          readOnly={clientMode}
        />
        <InputField
          options={vehicleOfInterest}
          label="Vehicle of Interest"
          value={negotiation?.brand ?? ""}
          negotiationId={negotiationId ?? ""}
          field="brand"
          onChange={(newValue) =>
            handleChange({
              key: "brand",
              newValue: newValue,
            })
          }
          type="searchableDropdown"
          icon={Car}
          readOnly={clientMode}
        />
        <InputField
          label="Model"
          value={negotiation?.model ?? "Model not available"}
          negotiationId={negotiationId ?? ""}
          field="model"
          onChange={(newValue) =>
            handleChange({
              key: "model",
              newValue: newValue,
            })
          }
          icon={Car}
          readOnly={clientMode}
        />
        {/* <EditableTextArea
          value={negotiation?.trim ?? "Trim details not available"}
          negotiationId={negotiationId ?? ""}
          field="trimPackageOptions"
          onChange={(newValue) =>
            handleChange({
              key: "trimPackageOptions",
              newValue: newValue,
            })
          }
        /> */}
        <InputField
          type="textarea"
          label="Trim"
          value={negotiation?.trim ?? "Trim info not available"}
          negotiationId={negotiationId ?? ""}
          field="trim"
          onChange={(newValue) =>
            handleChange({
              key: "trim",
              newValue: newValue,
            })
          }
          icon={() => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          )}
          readOnly={clientMode}
        />
        <InputField
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
            handleChange({
              key: "drivetrain",
              newValue: newValue,
            })
          }
          type="searchableDropdown"
          icon={Car}
          readOnly={clientMode}
        />

        <InputField
          label="Trade In"
          value={negotiation?.tradeInInfo ?? "Trade in not available"}
          negotiationId={negotiationId ?? ""}
          field="tradeInInfo"
          onChange={(newValue) =>
            handleChange({
              key: "tradeInInfo",
              newValue: newValue,
            })
          }
          icon={() => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
          )}
          readOnly={clientMode}
        />
        <InputField
          options={["Lease", "Cash", "Finance", "Need to Discuss"]}
          label="Finance Type"
          value={negotiation?.howToPay ?? "Need to Discuss"}
          negotiationId={negotiationId ?? ""}
          field="howToPay"
          onChange={(newValue) =>
            handleChange({
              key: "howToPay",
              newValue: newValue,
            })
          }
          icon={DollarSign}
          type="searchableDropdown"
          readOnly={clientMode}
        />
        <InputField
          label="Budget"
          value={negotiation?.budget ?? "No negotiation budget"}
          negotiationId={negotiationId ?? ""}
          field="budget"
          onChange={(newValue) =>
            handleChange({
              key: "budget",
              newValue: newValue,
            })
          }
          icon={DollarSign}
          readOnly={clientMode}
        />
        <InputField
          label="Monthly Budget"
          value={(negotiation?.monthlyBudget ?? "No monthly budget") as string}
          negotiationId={negotiationId ?? ""}
          field="monthlyBudget"
          onChange={(newValue) =>
            handleChange({
              key: "monthlyBudget",
              newValue: newValue,
            })
          }
          icon={DollarSign}
          readOnly={clientMode}
        />
        <div className="space-y-2"></div>
        <div className="space-x-2 flex items-center">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-[15px]">Date Paid:</h3>
          <p>{dateFormat(negotiation?.datePaid ?? "")}</p>
        </div>

        <InputField
          label="Start Date"
          selected={dealStartDate}
          onDateChange={(date) => {
            setDealStartDate(date);
            handleDateChange(date, "dealStartDate");
          }}
          dateFormat="MM-dd-yyyy"
          placeholderText="Select a date"
          type="datePicker"
          icon={Calendar}
          readOnly={clientMode}
        />
        <InputField
          label="Arrival To Dealer"
          selected={arrivalToDealer}
          onDateChange={(date) => {
            setArrivalToDealer(date);
            handleDateChange(date, "arrivalToDealer");
          }}
          dateFormat="MM-dd-yyyy"
          placeholderText="Select a date"
          type="datePicker"
          icon={Calendar}
          readOnly={clientMode}
        />

        <InputField
          label="Arrival To Client"
          selected={arrivalToClient}
          onDateChange={(date) => {
            setArrivalToClient(date);
            handleDateChange(date, "arrivalToClient");
          }}
          dateFormat="MM-dd-yyyy"
          placeholderText="Select a date"
          type="datePicker"
          icon={Calendar}
          readOnly={clientMode}
        />

        <InputField
          label="Close Date"
          selected={closeDate}
          onDateChange={(date) => {
            setCloseDate(date);
            handleDateChange(date, "closeDate");
          }}
          dateFormat="MM-dd-yyyy"
          placeholderText="Select a date"
          // className="border border-gray-300 rounded-md px-2 py-1"
          type="datePicker"
          icon={Calendar}
          readOnly={clientMode}
        />

        <h3 className="font-semibold text-lg">Colors</h3>
        <InputField
          negotiations={negotiation}
          label="External Colors Desired"
          value={negotiation?.desiredExterior ?? "No preference"}
          negotiationId={negotiationId ?? ""}
          field="desiredExterior"
          onChange={(newValue) =>
            handleChange({
              key: "desiredExterior",
              newValue: newValue,
            })
          }
          icon={ThumbsUp}
          readOnly={clientMode}
        />

        <InputField
          negotiations={negotiation}
          label="Internal Colors Desired"
          value={negotiation?.desiredInterior ?? "No preference"}
          negotiationId={negotiationId ?? ""}
          field="desiredInterior"
          onChange={(newValue) =>
            handleChange({
              key: "desiredInterior",
              newValue: newValue,
            })
          }
          icon={ThumbsUp}
          readOnly={clientMode}
        />

        <InputField
          negotiations={negotiation}
          label="External Colors Not Wanted"
          value={negotiation?.excludedExterior ?? "No preference"}
          negotiationId={negotiationId ?? ""}
          field="excludedExterior"
          onChange={(newValue) =>
            handleChange({
              key: "excludedExterior",
              newValue: newValue,
            })
          }
          icon={X}
          readOnly={clientMode}
        />
        <InputField
          negotiations={negotiation}
          label="Internal Colors Not Wanted"
          value={negotiation?.excludedInterior ?? "No preference"}
          negotiationId={negotiationId ?? ""}
          field="excludedInterior"
          onChange={(newValue) =>
            handleChange({
              key: "excludedInterior",
              newValue: newValue,
            })
          }
          icon={X}
          readOnly={clientMode}
        />
      </div>
    </TailwindPlusCard>
  );
};

export default FeatureDetails;
