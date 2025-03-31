import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
export const TailwindPlusModal = ({
  children,
  close,
  transparent = false,
  width,
}: {
  children: React.ReactNode;
  close: () => void;
  transparent?: boolean;
  width?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={cn(
          "rounded-lg shadow-lg p-4 overflow-y-auto max-h-[60vh]",
          transparent ? "bg-transparent" : "bg-white",
          !width && "max-w-md w-full"
        )}
        style={width ? { minWidth: `${width}vw` } : {}}
        ref={ref}
      >
        {children}
      </div>
    </div>
  );
};
