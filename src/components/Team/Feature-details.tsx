import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Car, DollarSign, ThumbsUp, X } from "lucide-react";
import EditableDropdown from "../base/editable-dropdown";
import EditableInput from "../base/input-field";
import { Separator } from "@radix-ui/react-separator";
import EditableTextArea from "../base/editable-textarea";
import { EditNegotiationData } from "@/types";
import { vehicleOfInterest } from "@/lib/utils";

type FeatureDetailsProps = {
  negotiation: EditNegotiationData | null;
  negotiationId: string | null;
  handleChange: (section: string, field: string, value: string) => void;
  setShowStickyHeader?: (item: boolean) => void;
};

const FeatureDetails = ({
  negotiation,
  negotiationId,
  handleChange,
  setShowStickyHeader,
}: FeatureDetailsProps) => {
  const dealDetailsRef = useRef(null);

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
              userField="condition"
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
            userField="brand"
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
              negotiation?.dealInfo?.negotiations_Trim ??
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
            userField="drive_train"
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
            userField="payment_type"
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
        <Separator className="my-4" />
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Colors</h3>
          <div className="flex items-center space-x-2 text-[#202125]">
            <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Desired Exterior:</strong>{" "}
              {negotiation?.otherData?.negotiations_Color_Options[0]?.preferred}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Desired Interior:</strong>{" "}
              {negotiation?.otherData?.negotiations_Color_Options[1]?.preferred}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <X className="h-5 w-5 text-red-500" />
            <span>
              <strong>Exterior Deal Breakers:</strong>{" "}
              {
                negotiation?.otherData?.negotiations_Color_Options[0]
                  ?.not_preferred
              }
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <X className="h-5 w-5 text-red-500" />
            <span>
              <strong>Interior Deal Breakers:</strong>{" "}
              {
                negotiation?.otherData?.negotiations_Color_Options[1]
                  ?.not_preferred
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureDetails;
