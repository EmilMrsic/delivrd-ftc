import { getStatusStyles, isDarkColor } from "@/lib/utils";
import { Button } from "../ui/button";
import { negotiationMakeColors } from "@/lib/constants/negotiations";

export const MakeButton = ({ make }: { make: string }) => {
  const backgroundColor = negotiationMakeColors[make] || "#E5E7EB";
  const textColor = isDarkColor(backgroundColor) ? "#FFFFFF" : "#000000";
  return (
    <Button
      variant="outline"
      style={{
        backgroundColor: backgroundColor,
        color: textColor, // Set dynamic text color
      }}
      className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300 mr-[10px]"
    >
      <p>{make}</p>
    </Button>
  );
};
