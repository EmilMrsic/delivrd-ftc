import { Input } from "@headlessui/react";
import clsx from "clsx";

export const TailwindPlusInput = ({
  type,
  value,
  onFocus,
  onBlur,
  onChange,
  ref,
  name,
}: {
  type?: "text" | "searchableDropdown";
  value: string;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  ref: React.RefObject<HTMLInputElement>;
  name: string;
}) => {
  return (
    <Input
      type={type}
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onChange}
      ref={ref}
      name={name}
      className={clsx(
        "block w-full rounded-lg border border-transparent ring-1 shadow-sm ring-black/10 p-2",
        "px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1.5)-1px)] text-base/6 sm:text-sm/6",
        "data-focus:outline data-focus:outline-2 data-focus:-outline-offset-1 data-focus:outline-black"
      )}
    />
  );
};
