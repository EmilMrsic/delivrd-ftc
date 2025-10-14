import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/firebase/config";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";

const Steps: Record<string, string[]> = {
  "Send Intro Loom & Tag Client": [
    "Record/Send personalized Loom (confirm preferences, introduce self, set expectations)",
    "Tag client in <b>OpenPhone</b> to assigned DC + DICS",
    "Tag client in <b>CRM</b> to assigned DC + DICS",
    "Paste Loom link in CRM notes",
  ],
  "Verify Client": [
    "Quick call/text to confirm X, budget, timeline and pain points",
    "Update CRM profile with verified info",
  ],
};

export const ClientChecklist = ({
  negotiation,
}: {
  negotiation: NegotiationDataType;
}) => {
  const [checkedItems, setCheckedItems] = useState<
    Record<string, Record<number, boolean>>
  >(negotiation.checklist || {});

  const updateCheckedItemInState = (
    stepName: string,
    step: number,
    checked: boolean
  ) => {};

  const setItemChecked = async (
    stepName: string,
    step: number,
    checked: boolean
  ) => {
    const currentChecklist = negotiation.checklist || {};
    const stepItems = currentChecklist[stepName] || {};
    stepItems[step] = checked;
    currentChecklist[stepName] = stepItems;

    const negotiationRef = doc(db, "delivrd_negotiations", negotiation.id);
    await updateDoc(negotiationRef, {
      checklist: currentChecklist,
    });
  };

  return (
    <TailwindPlusCard>
      {Object.keys(Steps).map((stepName, idx) => (
        <div className="mt-4">
          <div className="text-lg mb-2">
            {idx + 1}. {stepName}
          </div>
          {Steps[stepName].map((step, stepIdx) => (
            <div key={stepIdx} className="text-sm">
              <div className="ml-4">
                <Checkbox
                  checked={negotiation?.checklist?.[stepName]?.[stepIdx]}
                  onCheckedChange={async (e) => {
                    await setItemChecked(stepName, stepIdx, e === true);
                  }}
                />{" "}
                {step}
              </div>
            </div>
          ))}
        </div>
      ))}
    </TailwindPlusCard>
  );
};
