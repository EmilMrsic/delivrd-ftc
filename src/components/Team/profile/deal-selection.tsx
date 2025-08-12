"use client";
import { NormalDropdown } from "@/components/tailwind-plus/normal-dropdown";
import { Button } from "@/components/ui/button";
import { db } from "@/firebase/config";
import { generateRandomId } from "@/lib/utils";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export const DealSelection = ({
  currentDeal,
  clientDeals,
}: {
  currentDeal: any;
  clientDeals: {
    id: string;
    make: string;
    model: string;
  }[];
}) => {
  const router = useRouter();
  const createNewDeal = async () => {
    const newId = generateRandomId();

    const newDeal: any = {
      id: newId,
      clientEmail: currentDeal.clientEmail,
      clientNamefull: currentDeal.clientNamefull,
      clientFirstName: currentDeal.clientFirstName,
      clientLastName: currentDeal.clientLastName,
      clientPhone: currentDeal.clientPhone,
      city: currentDeal.city,
      state: currentDeal.state,
      zip: currentDeal.zip,
      userId: currentDeal.userId,
      createdAt: new Date().toISOString(),
    };

    const newNegotiationRef = doc(db, "delivrd_negotiations", newId);
    await setDoc(newNegotiationRef, newDeal);
    // router.push(`/team-profile?id=${newId}`);
    window.location.href = `/team-profile?id=${newId}`;
  };

  const currentDealDisplay = useMemo(() => {
    const dealIndex = clientDeals.findIndex(
      (deal) => deal.id === currentDeal.id
    );

    return {
      key:
        currentDeal.brand && currentDeal.model
          ? `${currentDeal.brand} ${currentDeal.model}`
          : `Deal #${dealIndex}`,
      make: currentDeal.brand,
      model: currentDeal.model,
      id: currentDeal.id,
    };
  }, [currentDeal, clientDeals]);

  if (!currentDeal) return null;

  return (
    <div className="flex flex-row gap-2">
      <NormalDropdown
        options={clientDeals.map((deal, idx) => ({
          key:
            deal.make && deal.model
              ? "" + deal.make + " " + deal.model
              : "Deal #" + (clientDeals.length - idx),
          ...deal,
        }))}
        default={currentDealDisplay}
        // value={currentDeal}
        onChange={(selected: { id: string }) => {
          if (selected?.id !== currentDeal.id) {
            window.location.href = `/team-profile?id=${selected?.id}`;
          }
        }}
        className="mt-auto mb-auto"
        // maxDisplayChars={10}
      />
      <Button className="mt-auto mb-auto" onClick={createNewDeal}>
        Add New Deal
      </Button>
    </div>
  );
};
