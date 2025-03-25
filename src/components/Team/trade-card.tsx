import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Car, X } from "lucide-react";
import EditableTextArea from "../base/editable-textarea";
import EditableInput, { InputField } from "../base/input-field";
import { EditNegotiationData } from "@/types";
import { uploadFile } from "@/lib/utils";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import useTeamProfile from "@/hooks/useTeamProfile";
import { NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusCard } from "../tailwind-plus/card";

type TradeCardProps = {
  negotiationId: string | null;
  handleChange: (updateObject: {
    key: string;
    newValue: string;
    parentKey?: string;
  }) => void;
  negotiation: NegotiationDataType | null;
};

const TradeCard = ({
  negotiationId,
  handleChange,
  negotiation,
}: TradeCardProps) => {
  const { setNegotiation } = useTeamProfile();

  const handleFileUpload = async (files: FileList | null, bidId: string) => {
    const id = bidId;
    if (!files || !bidId) return;

    let fileUrls: string[] = [];

    if (files.length > 0) {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map((file) => uploadFile(file));
      fileUrls = (await Promise.all(uploadPromises)).filter(
        Boolean
      ) as string[];
    }

    if (fileUrls.length > 0) {
      const bidRef = doc(db, "negotiations", id);
      await updateDoc(bidRef, {
        trade_in_files: arrayUnion(...fileUrls),
      });
    }
    if (negotiation !== null && negotiation.dealInfo) {
      setNegotiation({
        ...negotiation,
        dealInfo: {
          ...negotiation.dealInfo,
          trade_in_files: [
            ...(negotiation.dealInfo.trade_in_files ?? []),
            ...fileUrls,
          ],
        },
      });
      toast({ title: "Files uploaded" });
    }
  };

  const handleRemoveFile = async (fileUrl: string) => {
    if (!negotiation || !negotiation.dealInfo) return;

    const bidRef = doc(db, "negotiations", negotiation.id); // Assuming negotiation has an `id`

    try {
      // Remove file from Firebase Firestore
      await updateDoc(bidRef, {
        trade_in_files: arrayRemove(fileUrl),
      });

      if (negotiation !== null && negotiation.dealInfo) {
        setNegotiation({
          ...negotiation,
          dealInfo: {
            ...negotiation.dealInfo,
            trade_in_files: negotiation.dealInfo.trade_in_files?.filter(
              (file) => file !== fileUrl
            ),
          },
        });
      }

      toast({ title: "File removed" }); // Show a success message
    } catch (error) {
      console.error("Error removing file:", error);
      toast({ title: "Failed to remove file" });
    }
  };

  return (
    <TailwindPlusCard title="Trade In Info" icon={Car}>
      <div className="space-y-4">
        <EditableTextArea
          value={negotiation?.tradeInInfo ?? "No trade in info at the moment"}
          negotiationId={negotiationId ?? ""}
          field="trade_in_info"
          onChange={(newValue) =>
            handleChange({
              key: "trade_in_info",
              newValue: newValue as string,
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
              newValue: newValue as string,
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
              newValue: newValue as string,
            })
          }
        />
        <InputField
          field="comments"
          parentKey="tradeDetails"
          negotiationId={negotiationId ?? ""}
          label="Comments"
          value={negotiation?.tradeDetails?.comments ?? ""}
          onChange={(newValue) =>
            handleChange({
              key: "comments",
              parentKey: "tradeDetails",
              newValue: newValue as string,
            })
          }
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700">
            Upload Files
          </label>
          <input
            type="file"
            multiple
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            onChange={(e) =>
              handleFileUpload(e.target.files, negotiationId ?? "")
            }
          />
        </div>

        {/* Display Uploaded Files */}
        <div className="flex space-x-4 mt-2">
          {negotiation?.dealInfo?.trade_in_files?.map((file, index) => {
            const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].some(
              (ext) => file.toLowerCase().includes(ext)
            );

            return (
              <div key={index} className="relative w-20 h-20">
                <div
                  onClick={() => window.open(file, "_blank")}
                  className="cursor-pointer bg-transparent w-full h-full flex items-center justify-center rounded-md overflow-hidden"
                >
                  {isImage ? (
                    <img
                      src={file}
                      alt="Uploaded file"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <embed
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      src={file}
                    />
                  )}
                </div>

                {/* Remove button (cross icon) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening file when clicking the cross
                    handleRemoveFile(file);
                  }}
                  className="absolute top-[-10px] right-[-10px] bg-black  text-white rounded-full p-1 m-1 hover:bg-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </TailwindPlusCard>
  );
};

export default TradeCard;
