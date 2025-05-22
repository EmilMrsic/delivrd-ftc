import clsx from "clsx";

export const TailwindPlusTextarea = ({
  placeholder,
  value,
  onChange,
  onKeyDown,
}: any) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={(e) => {
        onKeyDown(e);
      }}
      className={clsx(
        "w-full block resize-none block w-full rounded-lg border border-transparent ring-1 shadow-sm ring-black/10 p-2",
        "px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1.5)-1px)] text-base/6 sm:text-sm/6",
        "data-focus:outline data-focus:outline-2 data-focus:-outline-offset-1 data-focus:outline-black"
      )}
    ></textarea>
  );
};
