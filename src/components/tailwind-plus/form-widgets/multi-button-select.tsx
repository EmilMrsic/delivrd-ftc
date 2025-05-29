import { useEffect, useState } from "react";
import { TailwindPlusButton } from "../button";
import { cn } from "@/lib/utils";
import { useField } from "formik";

export const MultiButtonSelect = ({
  name,
  options,
  multiple = false,
  checkboxes = false,
  onChange,
}: {
  name: string;
  options: { label: string; value: string }[];
  multiple?: boolean;
  checkboxes?: boolean;
  onChange?: (value: string[]) => void;
}) => {
  const isMobile = window.innerWidth < 768;
  const [field, meta, helpers] = useField(name);
  const [selected, setSelected] = useState<string[]>(
    multiple ? field.value : [field.value]
  );

  useEffect(() => {
    helpers.setValue(selected);
    if (onChange) {
      onChange(selected);
    }
  }, [selected]);

  return (
    <div
      className={cn(
        "mt-4 w-fit ml-auto mr-auto gap-4",
        checkboxes
          ? "grid grid-cols-2 max-h-[200px] overflow-y-auto border-2 w-full p-4"
          : "flex flex-row flex-wrap"
      )}
    >
      {options.map((option, index) => (
        <TailwindPlusButton
          key={index}
          variant={checkboxes ? "outline2" : "outline"}
          className={cn(
            `px-4 py-2`,
            checkboxes ? (isMobile ? "text-sm" : "text-xl") : "text-sm",
            !checkboxes &&
              selected.includes(option.value) &&
              "bg-primary text-white",
            checkboxes && "justify-start"
          )}
          onClick={() => {
            if (multiple) {
              setSelected((prev) =>
                prev.includes(option.value)
                  ? prev.filter((v) => v !== option.value)
                  : [...prev, option.value]
              );
            } else {
              setSelected((prev) =>
                prev.includes(option.value)
                  ? prev.filter((v) => v !== option.value)
                  : [option.value]
              );
            }
          }}
        >
          {checkboxes && (
            <span className="text-sm mr-2">
              <input
                type="radio"
                checked={selected.includes(option.value)}
                onChange={() => {}}
              />
            </span>
          )}
          {option.label}
        </TailwindPlusButton>
      ))}
    </div>
  );
};
