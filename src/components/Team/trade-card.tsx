import React from "react";
import { Car } from "lucide-react";
import EditableTextArea from "../base/editable-textarea";
import EditableInput, { InputField } from "../base/input-field";
import { NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusCard } from "../tailwind-plus/card";
import { UploadFileSection } from "./profile/upload-file-section";

type TradeCardProps = {
  handleChange: (updateObject: {
    key: string;
    newValue: string;
    parentKey?: string;
  }) => void;
  negotiation: NegotiationDataType | null;
  setNegotiation: (negotiation: NegotiationDataType) => void;
};

const TradeCard = ({
  handleChange,
  negotiation,
  setNegotiation,
}: TradeCardProps) => {
  const negotiationId = negotiation?.id;

  return (
    <TailwindPlusCard title="Trade In Info" icon={Car}>
      <div className="space-y-4">
        <EditableTextArea
          value={negotiation?.tradeInInfo ?? "No trade in info at the moment"}
          negotiationId={negotiationId ?? ""}
          field="tradeInInfo"
          onChange={(newValue) =>
            handleChange({
              key: "tradeInInfo",
              newValue: newValue,
            })
          }
        />
        <InputField
          field="year"
          parentKey="tradeDetails"
          negotiationId={negotiationId ?? ""}
          label="Year"
          value={negotiation?.tradeDetails?.year ?? ""}
          onChange={(newValue) =>
            handleChange({
              key: "year",
              parentKey: "tradeDetails",
              newValue: newValue,
            })
          }
        />
        <InputField
          field="vin"
          parentKey="tradeDetails"
          negotiationId={negotiationId ?? ""}
          label="Vin"
          value={negotiation?.tradeDetails?.vin ?? ""}
          onChange={(newValue) =>
            handleChange({
              key: "vin",
              parentKey: "tradeDetails",
              newValue: newValue,
            })
          }
        />
        <InputField
          field="mileage"
          parentKey="tradeDetails"
          negotiationId={negotiationId ?? ""}
          label="Mileage"
          value={negotiation?.tradeDetails?.mileage ?? ""}
          onChange={(newValue) =>
            handleChange({
              key: "mileage",
              parentKey: "tradeDetails",
              newValue: newValue,
            })
          }
        />
        <InputField
          type="textarea"
          field="comments"
          parentKey="tradeDetails"
          negotiationId={negotiationId ?? ""}
          label="Comments"
          value={negotiation?.tradeDetails?.comments ?? ""}
          onChange={(newValue) =>
            handleChange({
              key: "comments",
              parentKey: "tradeDetails",
              newValue: newValue,
            })
          }
        />
        <UploadFileSection
          negotiation={negotiation as NegotiationDataType}
          setNegotiation={setNegotiation}
        />
      </div>
    </TailwindPlusCard>
  );
};

export default TradeCard;
