import { Button } from "../ui/button";

export const RadiusButton = ({ radius }: { radius: string }) => {
  const radiusDisplay = radius.includes("ationwide")
    ? radius.charAt(0).toUpperCase() + radius.slice(1)
    : `${radius} Miles`;
  return (
    <Button
      variant="outline"
      style={{
        backgroundColor: "#d1e2ff",
        color: "#000", // Set dynamic text color
      }}
      className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300 mr-[10px]"
    >
      {radiusDisplay}
    </Button>
  );
};
