import { Button } from "@/components/ui/button";
import { X, XIcon } from "lucide-react";
import { useRef, useState } from "react";

export const FileUpload = ({ name }: { name: string }) => {
  const [files, setFiles] = useState<any[]>([]);
  const ref = useRef();

  return (
    <div className="mt-4 w-full">
      <input
        type="file"
        id="fileInput"
        // @ts-ignore
        ref={ref}
        className="hidden"
        onChange={(e) => {
          console.log("file:");
          if (e.target.files) {
            const file = e.target.files[0];
            if (!file) {
              console.log("something went wrong in file upload");
              return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              setFiles([
                ...files,
                {
                  ...file,
                  preview: e.target?.result,
                },
              ]);
            };
            reader.readAsDataURL(file);
          }
        }}
      />
      <Button
        variant="outline"
        className="bg-gray-200 w-full"
        onClick={() => {
          if (ref.current) {
            // @ts-ignore
            ref.current.click();
          }
        }}
        type="button"
      >
        Choose Files (No File Chosen)
      </Button>
      <div className="flex flex-wrap gap-2 mt-4">
        {files.map((file, idx) => (
          <div className="relative">
            <div
              className="absolute top-0 right-0 cursor-pointer bg-white"
              onClick={() => {
                setFiles(files.filter((_, i) => i !== idx));
              }}
            >
              <X className="w-4 h-4 text-black" />
            </div>
            <img src={file.preview} key={idx} className="w-[50px] h-[50px]" />
          </div>
        ))}
      </div>
    </div>
  );
};
