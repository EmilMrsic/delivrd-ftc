import React, { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
export const TailwindPlusModal = ({
  children,
  close,
  transparent = false,
  width,
  height,
  onCloseTrigger,
  noClose,
}: {
  children: React.ReactNode;
  close: () => void;
  transparent?: boolean;
  width?: number;
  height?: number;
  onCloseTrigger?: () => void;
  noClose?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // console.log("Modal showModal value:", showModal); // Add this if you can access showModal here

      if (ref.current && !ref.current.contains(event.target as Node)) {
        if (!noClose) {
          close();
          onCloseTrigger?.();
        }
      } else {
        console.log("NOT closing modal: clicked inside");
      }
      // if (ref.current && !ref.current.contains(event.target as Node)) {
      //   console.log("closing modal: clicked outside");
      //   close();
      //   onCloseTrigger?.();
      // }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const styles = useMemo(() => {
    return {
      minWidth: width ? `${width}vw` : undefined,
      maxHeight: height ? `${height}vh` : undefined,
    };
  }, [width, height]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur flex items-center justify-center z-50 bg-blur"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "rounded-lg shadow-lg p-4 overflow-y-auto",
          transparent ? "bg-transparent" : "bg-white",
          !width && "max-w-md w-full",
          !height && "max-h-[60vh]"
        )}
        style={styles}
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
