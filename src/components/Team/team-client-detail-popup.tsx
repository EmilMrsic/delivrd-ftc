import { db } from "@/firebase/config";
import useTeamDashboard from "@/hooks/useTeamDashboard";
import { NegotiationData } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { dealStageOptions } from "@/lib/utils";
import { NegotiationDataType } from "@/lib/models/team";

type FieldConfig = {
  label: string;
  field: keyof NegotiationDataType;
  icon?: JSX.Element;
  type?: "input" | "textarea";
};

type ClientDetailsPopupProps = {
  open: boolean;
  onClose: () => void;
  deal: NegotiationDataType;
  fields: FieldConfig[];
  setTeamData: React.Dispatch<React.SetStateAction<any[]>>; // ✅ Update team data
};

export default function TeamClientDetailsPopup({
  open,
  onClose,
  deal,
  fields,
  setTeamData,
}: ClientDetailsPopupProps) {
  const [formData, setFormData] = useState(deal);
  const { allDealNegotiator } = useTeamDashboard();

  const handleInputChange = (
    field: keyof NegotiationDataType,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = async (field: keyof NegotiationDataType) => {
    const dealRef = doc(db, "delivrd_negotiations", deal.id);
    try {
      await updateDoc(dealRef, { [field]: formData[field] });

      setTeamData((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          negotiations: team.negotiations.map((n: NegotiationDataType) =>
            n.id === deal.id
              ? {
                  ...n,
                  ...(field === "clientFirstName" || field === "clientLastName"
                    ? {
                        clientFirstName: formData["clientFirstName"],
                        clientLastName: formData["clientLastName"],
                        clientNamefull:
                          formData["clientFirstName"] +
                          " " +
                          formData["clientLastName"],
                      }
                    : { [field]: formData[field] }),
                }
              : n
          ),
        }))
      );
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[350px] sm:w-full h-[600px] bg-white overflow-y-auto">
        <DialogHeader className="flex justify-between items-start">
          <p>Client</p>
          <DialogTitle className="text-2xl font-semibold">
            {formData.clientNamefull}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {fields.map(({ label, field, icon, type = "input" }) => (
            <div key={field} className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium flex items-center gap-1">
                {icon} {label}
              </label>
              {field === "dealCoordinatorId" || field === "stage" ? (
                <select
                  className="w-full border rounded p-2"
                  value={formData[field] || ""}
                  onChange={async (e) => {
                    await handleInputChange(field, e.target.value);
                    e.target.blur();
                  }}
                  onBlur={() => handleBlur(field)}
                >
                  <option value={""}>
                    Select {field === "stage" ? "Stage" : "Deal Coordinator"}
                  </option>

                  {field === "dealCoordinatorId"
                    ? allDealNegotiator.map((negotiator) => (
                        <option key={negotiator.id} value={negotiator.id}>
                          {negotiator.name}
                        </option>
                      ))
                    : dealStageOptions.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                </select>
              ) : type === "input" ? (
                <Input
                  value={(formData[field] as string) || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  autoFocus={false}
                />
              ) : (
                <Textarea
                  rows={4}
                  value={(formData[field] as string) || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  autoFocus={false}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
