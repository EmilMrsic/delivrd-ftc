import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const updateDealNegotiator = async (
  id: string,
  newNegotiatorId: string,
  refetch: () => void
) => {
  try {
    const dealRef = doc(db, "delivrd_negotiations", id);
    const dealSnap = await getDoc(dealRef);
    if (!dealSnap.exists()) {
      throw new Error("Deal not found");
    }

    await updateDoc(dealRef, {
      dealCoordinatorId: newNegotiatorId ?? "",
    });

    refetch();

    toast({ title: "Negotiator updated successfully" });
  } catch (error) {
    console.error("Error updating negotiator: ", error);
  }
};
