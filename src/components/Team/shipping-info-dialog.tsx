import { Dialog } from "@radix-ui/react-dialog";
import React, { useState } from "react";
import { DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { NegotiationData } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusCard } from "../tailwind-plus/card";
import EditableTextArea from "../base/editable-textarea";

export const ShippingInfoModule = ({
  deal,
  handleChange,
  close,
  onBlur,
}: {
  deal: NegotiationDataType;
  handleChange: (item: any) => void;
  close: () => void;
  onBlur?: () => void;
}) => {
  return (
    <TailwindPlusCard
      title="Shipping Info"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <EditableTextArea
        value={deal?.shippingInfo ?? "No shipping info at the moment"}
        negotiationId={deal?.id ?? ""}
        field="shippingInfo"
        onChange={(newValue) =>
          handleChange({
            key: "shippingInfo",
            newValue: newValue,
          })
        }
        onBlur={onBlur}
      />
      <div className="flex justify-end">
        <Button
          className="w-fit mr-0 ml-auto mt-4"
          onClick={() => {
            close();
          }}
        >
          Close
        </Button>
      </div>
    </TailwindPlusCard>
  );
};

// type ShippingInfoDialogProps = {
//   deal: NegotiationDataType;
//   setStopPropogation: (item: boolean) => void;
//   // currentDeals: NegotiationData[];
//   // setCurrentDeals: (item: NegotiationData[]) => void;
//   refetch: (id?: string, filters?: any, reset?: boolean) => void;
// };

// const ShippingInfoDialog = ({
//   deal,
//   setStopPropogation,
//   // setCurrentDeals,
//   // currentDeals,
//   refetch,
// }: ShippingInfoDialogProps) => {
//   const [open, setOpen] = useState(false);
//   const [shippingInfo, setShippingInfo] = useState<string>(
//     deal?.shippingInfo ?? ""
//   );

// const handleShippingInfoChange = async (newInfo: string) => {
//   try {
//     if (newInfo) {
//       const docRef = doc(db, "delivrd_negotiations", deal.id);
//       const updatedDeal = { ...deal, shipping_info: shippingInfo };

//       await updateDoc(docRef, { shippingInfo: newInfo });
//       toast({ title: "Shipping info updated" });
//       // const updatedDeals = currentDeals.map((d) =>
//       //   d.id === deal.id ? updatedDeal : d
//       // );
//       // setCurrentDeals(updatedDeals);
//       setOpen(false);
//       refetch();
//     } else {
//       toast({ title: "Kindly add new info" });
//     }
//   } catch (error) {
//     console.error("Error updating shipping info:", error);
//   }
// };

//   return (
//     <Dialog open={open} onOpenChange={() => setOpen(false)}>
//       <DialogTrigger
//         onClick={(e) => {
//           e.stopPropagation();
//           // e.stopPropagation();
//         }}
//       >
// <Button
//   variant="outline"
//   className="bg-white text-black border-none hover:bg-transparent shadow-none"
//   onClick={(e) => {
//     e.stopPropagation();
//     setStopPropogation(true);
//     setOpen(true);
//   }}
// >
//   Shipping Info
// </Button>
//       </DialogTrigger>
//       <DialogContent
//         onClick={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//         }}
//         className="max-w-2xl bg-transparent"
//       >
//         <TailwindPlusCard title="Shipping Info">
//           <EditableTextArea
//             value={deal?.shippingInfo ?? "No shipping info at the moment"}
//             negotiationId={deal?.id ?? ""}
//             field="shippingInfo"
//             onChange={(newValue) => {
//               // handleChange({
//               //   key: "shippingInfo",
//               //   newValue: newValue,
//               // })
//             }}
//           />
//         </TailwindPlusCard>
//         {/* <div className="flex flex-col gap-3 items-start">
//           <p className="text-4xl font-bold">Shipping Info</p>
//           <textarea
//             className="w-full min-h-[100px] p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 resize-none"
//             value={shippingInfo || "No shipping info at the moment"}
//             onChange={(e) => setShippingInfo(e.target.value)}
//           />
//           <Button
//             size="sm"
//             className={"bg-black text-white flex"}
//             onClick={() => handleShippingInfoChange(shippingInfo)}
//           >
//             Save
//           </Button>
//         </div> */}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default ShippingInfoDialog;
