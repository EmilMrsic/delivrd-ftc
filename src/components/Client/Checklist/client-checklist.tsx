import { InputField } from "@/components/base/input-field";
import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { NegotiationDataType } from "@/lib/models/team";
import { callZapier, callZapierWebhook } from "@/lib/request";
import { collection, doc, updateDoc } from "firebase/firestore";
import { Car } from "lucide-react";
import React, { useEffect, useState } from "react";

const Steps: Record<
  string,
  (
    | string
    | {
        text: string;
        action: (negotiation: NegotiationDataType) => Promise<void>;
        Component?: React.FC<{
          negotiation: NegotiationDataType;
          clientMode?: boolean;
          handleChange: (updateObject: {
            key: string;
            newValue: string;
            parentKey?: string;
          }) => void;
        }>;
      }
  )[]
> = {
  "Send Intro Loom & Tag Client": [
    "Record/Send personalized Loom (confirm preferences, introduce self, set expectations)",
    "Tag client in <b>OpenPhone</b> to assigned DC + DCS",
    "Tag client in <b>CRM</b> to assigned DC + DCS",
    {
      text: "Paste Loom link in CRM notes",
      action: async (negotiation) => {
        // await fetch(process.env.NEXT_PUBLIC_LOOM_LINK_ADDED_URL!, {
        //   method: "POST",
        //   body: JSON.stringify({
        //     negotiationId: negotiation.id,
        //   }),
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });

        const result = await callZapier(
          process.env.NEXT_PUBLIC_LOOM_LINK_ADDED_URL!,
          {
            negotiationId: negotiation.id,
          }
        );
      },
      Component: ({ negotiation, clientMode, handleChange }) => (
        <InputField
          label="Loom Link"
          value={negotiation?.initialLoomLink ?? ""}
          negotiationId={negotiation.id ?? ""}
          field="initialLoomLink"
          onChange={(newValue) =>
            handleChange({
              key: "initialLoomLink",
              newValue: newValue,
            })
          }
          icon={Car}
          readOnly={clientMode}
          evalFn={(testUrl: string) => {
            const urlPattern = new RegExp(
              "^(https?:\\/\\/)?" + // protocol
                "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
                "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
                "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
                "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                "(\\#[-a-z\\d_]*)?$",
              "i"
            ); // fragment locator
            const pass = !!urlPattern.test(testUrl);

            return {
              pass,
              message: pass ? undefined : "Please enter a valid URL",
            };
          }}
        />
      ),
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
    {
      text: "Capture client photo + request Google review",
      action: async (negotiation) => {
        try {
          const dealData = negotiation;

          const updatedDeal = {
            ...dealData,
            review: "Review Request Sent",
          };

          // Send the updated deal to the Cloud Function
          const response = await fetch(
            process.env.NEXT_PUBLIC_REVIEW_FUNC_URL ?? "",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedDeal),
            }
          );

          const result = await response.json();

          if (result.success) {
            toast({ title: "Review Request Sent" });
          } else {
            console.error("Failed to send review request:", result.error);
            toast({
              title: "Failed to send review request",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error requesting review:", error);
          toast({
            title: "Failed to send review request",
            variant: "destructive",
          });
        }
      },
    },
  ],
};

export const ClientChecklist = ({
  negotiation,
  clientMode,
  handleChange,
}: {
  negotiation: NegotiationDataType;
  clientMode?: boolean;
  handleChange: (updateObject: {
    key: string;
    newValue: string;
    parentKey?: string;
  }) => void;
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

  const resetItems = async () => {
    // reset all checked items after step 2
    setPendingCount((n) => n + 1);
    try {
      const resetChecklist: Record<string, Record<number, boolean>> = {};
      const stepNames = Object.keys(Steps);
      for (let i = 0; i < stepNames.length; i++) {
        const stepName = stepNames[i];
        if (i <= 1) {
          // keep steps 0 and 1
          resetChecklist[stepName] = checkedItems[stepName] || {};
        } else {
          resetChecklist[stepName] = {};
        }
      }

      const negotiationRef = doc(db, "delivrd_negotiations", negotiation.id);
      await updateDoc(negotiationRef, {
        checklist: resetChecklist,
      });
      setCheckedItems(resetChecklist);

      toast({
        title: "Checklist reset",
      });
    } finally {
      setPendingCount((n) => n - 1);
    }
  };

  return (
    <TailwindPlusCard
      title="Client Checklist"
      actions={() => (
        <>
          <Button variant="outline" onClick={() => resetItems()}>
            Reset
          </Button>
        </>
      )}
    >
      {Object.keys(Steps).map((stepName, idx) => (
        <div className="mt-4">
          <div className="text-lg mb-2">
            {idx + 1}. {stepName}
          </div>
          {Steps[stepName].map((step, stepIdx) => {
            const stepText = typeof step === "string" ? step : step.text;
            const stepAction = typeof step === "string" ? null : step.action;
            const Component = typeof step !== "string" && step.Component;
            return (
              <>
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
                    <span dangerouslySetInnerHTML={{ __html: stepText }}></span>
                  </div>
                </div>
                <div className="ml-8 mb-2 w-[60%]">
                  {Component && (
                    <Component
                      negotiation={negotiation}
                      clientMode={clientMode}
                      handleChange={handleChange}
                    />
                  )}
                </div>
              </>
            );
          })}
        </div>
      ))}
    </TailwindPlusCard>
  );
};
