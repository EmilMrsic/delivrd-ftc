import { getStatusStyles } from "@/lib/utils";
import { Button } from "../ui/button";

export const StageButton = ({ stage }: { stage: string }) => {
  return (
    <Button
      variant="outline"
      style={{
        backgroundColor: getStatusStyles(stage ?? "").backgroundColor,
        color: getStatusStyles(stage ?? "").textColor, // Set dynamic text color
      }}
      className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300 mr-[10px]"
    >
      <p>{stage}</p>
    </Button>
  );
};
