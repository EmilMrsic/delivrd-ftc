import { cn } from "@/lib/utils";
import React from "react";

export const Infobox = ({
  innerComponent: Component,
  icon: Icon,
  color = "yellow",
}: {
  innerComponent: React.ComponentType<any>;
  icon?: React.ComponentType<any>;
  color?: "yellow" | "blue";
}) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 border-l-4 p-4 rounded-md",
        color === "yellow" && "border-yellow-400 bg-yellow-100 text-yellow-800",
        color === "blue" && "border-blue-400 bg-blue-50 text-blue-600"
      )}
    >
      <div className="text-yellow-500 pt-1">{Icon && <Icon />}</div>
      <div className="text-sm">
        <Component />
      </div>
    </div>
  );
};
