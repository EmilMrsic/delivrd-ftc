import React, { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
export const TailwindPlusModal = ({
  children,
  close,
  transparent = false,
  width,
  height,
  onCloseTrigger,
  noClose,
  closeButton,
  className,
  rounded = true,
}: {
  children: React.ReactNode;
  close: () => void;
  transparent?: boolean;
  width?: number;
  height?: number;
  onCloseTrigger?: () => void;
  noClose?: boolean;
  closeButton?: boolean;
  className?: string;
  rounded?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 768;

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
      minWidth: width ? `500px` : undefined,
      maxWidth: width ? `${width}vw` : undefined,
      // minHeight: height ? `${height}vh` : undefined,
      maxHeight: height ? `${height}vh` : undefined,
    };
  }, [width, height]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur flex items-center justify-center z-[9999] bg-blur"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={
          isMobile
            ? {
                maxWidth: "100%",
              }
            : {}
        }
      >
        {closeButton && (
          <button
            className="block text-white cursor-pointer mr-0 ml-auto flex items-center gap-2"
            onClick={close}
          >
            CLOSE <X />
          </button>
        )}
        <div
          className={cn(
            "p-4 overflow-y-auto overflow-x-hidden",
            rounded ? "rounded-lg shadow-lg" : "",
            transparent ? "bg-transparent" : "bg-white",
            !width && "max-w-md w-full",
            !height && "max-h-[60vh]",
            className
          )}
          style={
            isMobile
              ? {
                  // minWidth: "100%",
                  // minHeight: "100%",
                  // maxWidth: "100%",
                  // maxHeight: "100%",
                  // width: "100%",
                  // height: "100%",
                }
              : styles
          }
          ref={ref}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
