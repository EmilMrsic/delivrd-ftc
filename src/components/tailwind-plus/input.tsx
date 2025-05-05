import { Input } from "@headlessui/react";
import clsx from "clsx";
import { forwardRef } from "react";

export const TailwindPlusInput = forwardRef<
  HTMLInputElement,
  {
    type?: "text" | "searchableDropdown" | "email" | "number";
    value: string | number;
    onFocus?: () => void;
    onBlur?: () => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEnter?: () => void;
    name?: string;
    placeholder?: string;
    className?: string;
  }
>(
  (
    {
      type,
      value,
      onFocus,
      onBlur,
      onChange,
      onEnter,
      name,
      placeholder,
      className,
    },
    ref
  ) => {
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
          "px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1.5)-1px)]",
          "data-focus:outline data-focus:outline-2 data-focus:-outline-offset-1 data-focus:outline-black",
          className ? className : "text-base/6 sm:text-sm/6"
        )}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEnter?.();
          }
        }}
      />
    );
  }
);

// export const TailwindPlusInput = ({
//   type,
//   value,
//   onFocus,
//   onBlur,
//   onChange,
//   onEnter,
//   ref,
//   name,
//   placeholder,
//   className,
// }: {
//   type?: "text" | "searchableDropdown" | "email" | "number";
//   value: string | number;
//   onFocus?: () => void;
//   onBlur?: () => void;
//   onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
//   onEnter?: () => void;
//   ref?: React.RefObject<HTMLInputElement>;
//   name?: string;
//   placeholder?: string;
//   className?: string;
// }) => {
//   return (
//     <Input
//       type={type}
//       value={value}
//       onFocus={onFocus}
//       onBlur={onBlur}
//       onChange={onChange}
//       ref={ref}
//       name={name}
//       className={clsx(
//         "block w-full rounded-lg border border-transparent ring-1 shadow-sm ring-black/10 p-2",
//         "px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1.5)-1px)]",
//         "data-focus:outline data-focus:outline-2 data-focus:-outline-offset-1 data-focus:outline-black",
//         className ? className : "text-base/6 sm:text-sm/6"
//       )}
//       placeholder={placeholder}
//       onKeyDown={(e) => {
//         if (e.key === "Enter") {
//           onEnter?.();
//         }
//       }}
//     />
//   );
// };
