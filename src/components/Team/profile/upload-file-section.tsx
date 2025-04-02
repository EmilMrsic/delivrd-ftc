import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { NegotiationDataType } from "@/lib/models/team";
import { uploadFile } from "@/lib/utils";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { X } from "lucide-react";

export const UploadFileSection = ({
  negotiation,
  setNegotiation,
}: {
  negotiation: NegotiationDataType;
  setNegotiation: (negotiation: NegotiationDataType) => void;
}) => {
  const negotiationId = negotiation?.id;

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
      const bidRef = doc(db, "delivrd_negotiations", id);
      await updateDoc(bidRef, {
        tradeDetails: {
          ...(negotiation.tradeDetails ?? {}),
          fileUrls: arrayUnion(...fileUrls),
        },
      });
    }
    console.log("got here: in uploading 1", negotiation);
    if (negotiation !== null) {
      console.log("got here: in uploading 2");
      setNegotiation({
        ...negotiation,
        tradeDetails: {
          ...(negotiation.tradeDetails ?? {}),
          fileUrls: [
            ...(negotiation.tradeDetails?.fileUrls ?? []),
            ...fileUrls,
          ],
        },
      });
      toast({ title: "Files uploaded" });
    }
  };

  const handleRemoveFile = async (fileUrl: string) => {
    if (!negotiation) return;

    const bidRef = doc(db, "delivrd_negotiations", negotiation.id); // Assuming negotiation has an `id`

    try {
      // Remove file from Firebase Firestore
      await updateDoc(bidRef, {
        tradeDetails: {
          ...(negotiation.tradeDetails ?? {}),
          fileUrls: negotiation.tradeDetails?.fileUrls?.filter(
            (file) => file !== fileUrl
          ),
        },
      });

      if (negotiation !== null) {
        setNegotiation({
          ...negotiation,
          tradeDetails: {
            ...(negotiation.tradeDetails ?? {}),
            fileUrls: negotiation.tradeDetails?.fileUrls?.filter(
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
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700">
        Upload Files
      </label>
      <input
        type="file"
        multiple
        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        onChange={(e) => {
          if (e.target.files && negotiationId) {
            handleFileUpload(e.target.files, negotiationId);
          }
        }}
      />

      {/* Display Uploaded Files */}
      <div className="flex flex-wrap gap-4 mt-6 space-x-4">
        {negotiation?.tradeDetails?.fileUrls?.map((file, index) => {
          const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].some(
            (ext) => file.toLowerCase().includes(ext)
          );

          return (
            <div key={index} className="relative w-20 h-20 mb-2">
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
  );
};
