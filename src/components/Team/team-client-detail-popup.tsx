import { db } from "@/firebase/config";
import useTeamDashboard from "@/hooks/useTeamDashboard";
import { NegotiationData } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { dealStageOptions } from "@/lib/utils";

type FieldConfig = {
  label: string;
  field: keyof NegotiationData;
  icon?: JSX.Element;
  type?: "input" | "textarea";
};

type ClientDetailsPopupProps = {
  open: boolean;
  onClose: () => void;
  deal: NegotiationData;
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

  const handleInputChange = (field: keyof NegotiationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = async (field: keyof NegotiationData) => {
    const dealRef = doc(db, "negotiations", deal.id);
    try {
      await updateDoc(dealRef, { [field]: formData[field] });

      setTeamData((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          negotiations: team.negotiations.map((n: NegotiationData) =>
            n.id === deal.id
              ? {
                  ...n,
                  ...(field === "negotiations_First_Name" ||
                  field === "negotiations_Last_Name"
                    ? {
                        negotiations_First_Name:
                          formData["negotiations_First_Name"],
                        negotiations_Last_Name:
                          formData["negotiations_Last_Name"],
                        negotiations_Client:
                          formData["negotiations_First_Name"] +
                          " " +
                          formData["negotiations_Last_Name"],
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
            {formData.negotiations_Client}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {fields.map(({ label, field, icon, type = "input" }) => (
            <div key={field} className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium flex items-center gap-1">
                {icon} {label}
              </label>
              {field === "negotiations_deal_coordinator" ||
              field === "negotiations_Status" ? (
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
                    Select{" "}
                    {field === "negotiations_Status"
                      ? "Stage"
                      : "Deal Coordinator"}
                  </option>

                  {field === "negotiations_deal_coordinator"
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
