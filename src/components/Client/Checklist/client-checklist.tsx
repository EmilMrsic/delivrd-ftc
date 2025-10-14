import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const Steps: Record<
  string,
  (
    | string
    | {
        text: string;
        action: (negotiation: NegotiationDataType) => Promise<void>;
      }
  )[]
> = {
  "Send Intro Loom & Tag Client": [
    "Record/Send personalized Loom (confirm preferences, introduce self, set expectations)",
    "Tag client in <b>OpenPhone</b> to assigned DC + DICS",
    "Tag client in <b>CRM</b> to assigned DC + DICS",
    {
      text: "Paste Loom link in CRM notes",
      action: async (negotiation) => {
        await fetch(process.env.NEXT_PUBLIC_LOOM_LINK_ADDED_URL!, {
          method: "POST",
          body: JSON.stringify({
            negotiationId: negotiation.id,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
      },
    },
  ],
  "Verify Client": [
    "Quick call/text to confirm needs, budget, timeline and pain points",
    "Update CRM profile with verified info",
  ],
  "Car Search – Visor": [
    "Run initial Visor search for availability & pricing",
    "Save search results link in CRM",
  ],
  "Dealership Blast": [
    "Send blast to 10+ dealers (local + regional)",
    "Track outreach in CRM (Date Sent, Dealer Contacted, Response)",
    "Upload all offers as they come in",
  ],
  "Local Dealers": [
    "Check regional/local options first",
    "Note “local-first attempt” in CRM",
  ],
  "Deal Evaluation": [
    "Compare offers vs. Delivrd standard",
    "Yes → Present to client, update CRM, mark color = “Winner”",
    "No → Expand to out-of-state search + repeat FTC blast",
  ],
  "Client Decision": [
    "Client accepts → move forward to trade-in/dealer connection",
    "Client declines → log reason, return to Step 3",
  ],
  "Trade-In (If Applicable and Flexible)": [
    "Collect VIN, mileage, photos",
    "Secure multiple trade-in offers",
    "Present side-by-side with deal options",
  ],
  "Dealer Connection": [
    "Introduce client directly to dealer rep",
    "Confirm all terms in writing, no surprise add-ons",
    "Add to Cal, Text Client 30 min before meeting to let them know we are here",
  ],
  "Final Steps": [
    "Confirm financing/paperwork complete",
    "DCS coordinates shipping/pickup logistics",
    "Schedule delivery + verify ETA with client",
    "Capture client photo + request Google review",
  ],
};

export const ClientChecklist = ({
  negotiation,
}: {
  negotiation: NegotiationDataType;
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [checkedItems, setCheckedItems] = useState<
    Record<string, Record<number, boolean>>
  >(negotiation.checklist || {});

  const updateCheckedItemInState = (
    stepName: string,
    step: number,
    checked: boolean
  ) => {
    setCheckedItems((prev) => {
      const updated = { ...prev };
      if (!updated[stepName]) {
        updated[stepName] = {};
      }
      updated[stepName][step] = checked;
      return updated;
    });
  };

  const setItemChecked = async (
    stepName: string,
    step: number,
    checked: boolean
  ) => {
    setPendingCount((n) => n + 1);
    try {
      const currentChecklist = negotiation.checklist || {};
      const stepItems = currentChecklist[stepName] || {};
      stepItems[step] = checked;
      currentChecklist[stepName] = stepItems;

      const negotiationRef = doc(db, "delivrd_negotiations", negotiation.id);
      await updateDoc(negotiationRef, {
        checklist: currentChecklist,
      });

      toast({
        title: "Checklist item updated",
      });
    } finally {
      setPendingCount((n) => n - 1);
    }
  };

  return (
    <TailwindPlusCard>
      {Object.keys(Steps).map((stepName, idx) => (
        <div className="mt-4">
          <div className="text-lg mb-2">
            {idx + 1}. {stepName}
          </div>
          {Steps[stepName].map((step, stepIdx) => {
            const stepText = typeof step === "string" ? step : step.text;
            const stepAction = typeof step === "string" ? null : step.action;
            return (
              <div key={stepIdx} className="text-sm">
                <div className="ml-4">
                  <Checkbox
                    checked={checkedItems[stepName]?.[stepIdx] || false}
                    onCheckedChange={async (e) => {
                      updateCheckedItemInState(stepName, stepIdx, e === true);
                      await setItemChecked(stepName, stepIdx, e === true);

                      if (stepAction) {
                        if (e) {
                          // only peform action when checking the box
                          await stepAction(negotiation);
                        }
                      }
                    }}
                  />{" "}
                  {stepText}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </TailwindPlusCard>
  );
};
