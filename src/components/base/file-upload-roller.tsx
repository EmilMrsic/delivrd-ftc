import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/helpers/files";
import { X } from "lucide-react";

export const FileUploadRoller = ({
  label,
  multiple = false,
  value,
  onChange,
}: {
  label: string;
  multiple?: boolean;
  value: string | string[];
  onChange: (newValue: string | string[]) => void;
}) => {
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    let fileUrls: string[] = [];

    if (files.length > 0) {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map((file) => uploadFile(file));
      fileUrls = (await Promise.all(uploadPromises)).filter(
        Boolean
      ) as string[];
    }

    if (onChange) {
      if (!multiple) {
        onChange(fileUrls[0]);
      } else {
        onChange(fileUrls);
      }
    }

    toast({ title: "Files uploaded" });
  };

  const handleRemoveFile = (index: number) => {
    if (!multiple) {
      onChange("");
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="file"
        // multiple={multiple}
        multiple
        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(e.target.files);
          }
        }}
      />
      {multiple ? (
        <div className="flex flex-wrap gap-4 mt-6 space-x-4"></div>
      ) : (
        <div className="relative mt-4">
          {" "}
          {value && (
            <>
              <img
                src={value as string}
                alt="Uploaded file"
                className="object-cover w-full h-full"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening file when clicking the cross
                  handleRemoveFile(0);
                }}
                className="absolute top-[-10px] right-[-10px] bg-black  text-white rounded-full p-1 m-1 hover:bg-red-700"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
