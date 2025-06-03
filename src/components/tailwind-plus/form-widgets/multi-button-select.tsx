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
  asRadio = false,
}: {
  name: string;
  options: { label: string; value: string }[];
  multiple?: boolean;
  checkboxes?: boolean;
  onChange?: (value: string[]) => void;
  asRadio?: boolean;
}) => {
  const isMobile = window.innerWidth < 768;
  const [field, meta, helpers] = useField(name);
  const [selected, setSelected] = useState<string[]>(
    multiple ? field.value : [field.value]
  );

  useEffect(() => {
    helpers.setValue(selected);
    // if (onChange && selected) {
    //   console.log(name, "onChange", selected);
    //   // onChange("test");
    //   try {
    //     onChange(selected);
    //   } catch (e: any) {
    //     console.log("onChange: got error on", name, "with selected:", selected);
    //   }
    // }
  }, [selected, onChange]);

  return (
    <div
      className={cn(
        "mt-4 w-fit",
        !asRadio && "ml-auto mr-auto gap-4",
        checkboxes
          ? asRadio
            ? "flex flex-col "
            : "grid grid-cols-2 max-h-[200px] overflow-y-auto border-2 w-full p-4"
          : "flex flex-row flex-wrap"
      )}
    >
      {options.map((option, index) => (
        <TailwindPlusButton
          key={index}
          variant={asRadio ? "noBorder" : checkboxes ? "outline2" : "outline"}
          className={cn(
            !asRadio && `px-4 py-2`,
            checkboxes
              ? asRadio
                ? "text-sm"
                : isMobile
                ? "text-sm"
                : "text-xl"
              : "text-sm",
            !checkboxes &&
              selected.includes(option.value) &&
              "bg-primary text-white",
            checkboxes && "justify-start",
            asRadio && "border-0 box-shadow-none"
          )}
          onClick={() => {
            if (multiple) {
              setSelected((prev) =>
                prev.includes(option.value)
                  ? prev.filter((v) => v !== option.value)
                  : [...prev, option.value]
              );
            } else {
              if (asRadio) {
                setSelected([option.value]);
              } else {
                setSelected((prev) =>
                  prev.includes(option.value)
                    ? prev.filter((v) => v !== option.value)
                    : [option.value]
                );
              }
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
