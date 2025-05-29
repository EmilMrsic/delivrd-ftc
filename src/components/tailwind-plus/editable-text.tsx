import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { TailwindPlusInput } from "./input";

export const EditableText = ({
  value: defaultValue,
  size = "sm",
  color = "black",
  onUpdate,
  className,
  noMaxWidth = false,
}: {
  value: string;
  size?: string;
  color?: string;
  onUpdate?: (value: string) => void;
  className?: string;
  noMaxWidth?: boolean;
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  return isEditing ? (
    <TailwindPlusInput
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      className={cn(`text-${size} ${className}`, {
        "max-w-[60px]": !noMaxWidth,
      })}
      onEnter={() => {
        setIsEditing(false);
        onUpdate?.(value);
      }}
      onBlur={() => {
        setIsEditing(false);
        onUpdate?.(value);
      }}
      ref={inputRef}
    />
  ) : (
    <span
      className={cn(
        `text-${size} text-${color}`,
        {
          "cursor-pointer": onUpdate,
        },
        className
      )}
      onClick={() => {
        if (onUpdate) {
          setIsEditing(true);
        }
      }}
    >
      {value}
    </span>
  );
};
